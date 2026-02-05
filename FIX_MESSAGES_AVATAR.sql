-- Fix user_conversations view to include avatar_url in other_participants
-- This will make profile photos appear in the messages page

DROP VIEW IF EXISTS user_conversations;

CREATE OR REPLACE VIEW user_conversations AS
SELECT 
    c.id as conversation_id,
    c.conversation_type,
    c.group_name,
    c.last_message_at,
    cp.user_id,
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.is_read = false
        AND m.sender_id != cp.user_id
        AND NOT (m.deleted_for_everyone = true)
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
        AND NOT (m.deleted_for_everyone = true)
        AND NOT (cp.user_id = ANY(m.deleted_by_user_ids))
        ORDER BY m.created_at DESC
        LIMIT 1
    ) as last_message,
    (
        SELECT json_agg(json_build_object(
            'user_id', u2.id,
            'name', u2.name,
            'email', u2.email,
            'avatar_url', u2.avatar_url
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
