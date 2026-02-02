-- ========================================
-- REAL-TIME MESSAGING SYSTEM
-- ========================================
-- Direct messages, group chats, delete messages, real-time updates

-- Step 1: Create conversations table (1-on-1 or group chats)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_type VARCHAR(20) DEFAULT 'direct',
    -- Types: 'direct' (1-on-1), 'group' (multiple people)
    group_name TEXT,
    group_avatar_url TEXT,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Step 2: Create conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- Step 3: Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_for_everyone BOOLEAN DEFAULT FALSE,
    deleted_by_user_ids INTEGER[] DEFAULT '{}',
    -- Users who deleted this message (only for themselves)
    reply_to_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    attachments JSONB,
    -- Format: [{"type": "link", "url": "https://...", "name": "Document"}]
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Step 4: Create function to get or create direct conversation
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
    user1_id INTEGER,
    user2_id INTEGER
)
RETURNS BIGINT AS $$
DECLARE
    conversation_id_var BIGINT;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT c.id INTO conversation_id_var
    FROM conversations c
    WHERE c.conversation_type = 'direct'
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp1
        WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp2
        WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
    LIMIT 1;
    
    -- If not found, create new conversation
    IF conversation_id_var IS NULL THEN
        INSERT INTO conversations (conversation_type, created_by_id)
        VALUES ('direct', user1_id)
        RETURNING id INTO conversation_id_var;
        
        -- Add both participants
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES 
            (conversation_id_var, user1_id),
            (conversation_id_var, user2_id);
    END IF;
    
    RETURN conversation_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(INTEGER, INTEGER) TO authenticated;

-- Step 5: Create function to create group conversation
CREATE OR REPLACE FUNCTION create_group_conversation(
    creator_id INTEGER,
    group_name_param TEXT,
    participant_ids INTEGER[]
)
RETURNS BIGINT AS $$
DECLARE
    conversation_id_var BIGINT;
    participant_id INTEGER;
BEGIN
    -- Create group conversation
    INSERT INTO conversations (conversation_type, group_name, created_by_id)
    VALUES ('group', group_name_param, creator_id)
    RETURNING id INTO conversation_id_var;
    
    -- Add creator as admin
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES (conversation_id_var, creator_id, TRUE);
    
    -- Add other participants
    FOREACH participant_id IN ARRAY participant_ids
    LOOP
        IF participant_id != creator_id THEN
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (conversation_id_var, participant_id)
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN conversation_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_group_conversation(INTEGER, TEXT, INTEGER[]) TO authenticated;

-- Step 6: Create function to send message
CREATE OR REPLACE FUNCTION send_message(
    conversation_id_param BIGINT,
    sender_id_param INTEGER,
    message_text_param TEXT
)
RETURNS BIGINT AS $$
DECLARE
    message_id_var BIGINT;
BEGIN
    -- Insert message
    INSERT INTO messages (conversation_id, sender_id, message_text)
    VALUES (conversation_id_param, sender_id_param, message_text_param)
    RETURNING id INTO message_id_var;
    
    -- Update conversation's last_message_at
    UPDATE conversations
    SET last_message_at = NOW(), updated_at = NOW()
    WHERE id = conversation_id_param;
    
    RETURN message_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_message(BIGINT, INTEGER, TEXT) TO authenticated;

-- Step 7: Create function to delete message
CREATE OR REPLACE FUNCTION delete_message(
    message_id_param BIGINT,
    user_id_param INTEGER,
    delete_for_everyone BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    IF delete_for_everyone THEN
        -- Delete for everyone (only sender can do this)
        UPDATE messages
        SET deleted_for_everyone = TRUE, is_deleted = TRUE, updated_at = NOW()
        WHERE id = message_id_param AND sender_id = user_id_param;
    ELSE
        -- Delete for myself only
        UPDATE messages
        SET deleted_by_user_ids = array_append(deleted_by_user_ids, user_id_param), updated_at = NOW()
        WHERE id = message_id_param
        AND NOT (user_id_param = ANY(deleted_by_user_ids));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_message(BIGINT, INTEGER, BOOLEAN) TO authenticated;

-- Step 8: Create view for user conversations with last message
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
    c.id as conversation_id,
    c.conversation_type,
    c.group_name,
    c.last_message_at,
    cp.user_id,
    cp.last_read_at,
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.created_at > cp.last_read_at
        AND m.sender_id != cp.user_id
        AND NOT m.deleted_for_everyone
        AND NOT (cp.user_id = ANY(m.deleted_by_user_ids))
    ) as unread_count,
    (
        SELECT json_build_object(
            'id', m.id,
            'sender_id', m.sender_id,
            'sender_name', u.name,
            'message_text', m.message_text,
            'created_at', m.created_at
        )
        FROM messages m
        LEFT JOIN auth_user u ON m.sender_id = u.id
        WHERE m.conversation_id = c.id
        AND NOT m.deleted_for_everyone
        AND NOT (cp.user_id = ANY(m.deleted_by_user_ids))
        ORDER BY m.created_at DESC
        LIMIT 1
    ) as last_message,
    (
        SELECT json_agg(json_build_object(
            'user_id', cp2.user_id,
            'name', u2.name,
            'email', u2.email
        ))
        FROM conversation_participants cp2
        LEFT JOIN auth_user u2 ON cp2.user_id = u2.id
        WHERE cp2.conversation_id = c.id
        AND cp2.user_id != cp.user_id
    ) as other_participants
FROM conversations c
INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
ORDER BY c.last_message_at DESC;

GRANT SELECT ON user_conversations TO authenticated;

-- Step 9: Grant permissions
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE conversations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE conversation_participants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;

-- ========================================
-- SUCCESS!
-- ========================================
-- After running this SQL:
-- ✅ Conversations table created (direct + group)
-- ✅ Messages table with delete options
-- ✅ Functions for get/create conversation, send message, delete message
-- ✅ View for user conversations with unread counts
-- ✅ All permissions granted
