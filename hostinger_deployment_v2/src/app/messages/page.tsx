'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  PaperAirplaneIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar_url?: string;
  message_text: string;
  created_at: string;
  is_deleted: boolean;
  deleted_for_everyone: boolean;
  deleted_by_user_ids: number[];
}

interface Conversation {
  conversation_id: number;
  conversation_type: string;
  group_name?: string;
  last_message_at: string;
  unread_count: number;
  last_message: any;
  other_participants: Array<{
    user_id: number;
    name: string;
    email: string;
    avatar_url?: string;
  }>;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

// Avatar helper component
function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#5884FD', '#C483D9', '#FFB333', '#10b981', '#F87239', '#6366f1', '#ec4899'];
  const colorIndex = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: colors[colorIndex],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: `${size * 0.38}px`,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}

function MessagesContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchConversations();
    fetchTeamMembers();
  }, [isAuthenticated, authLoading, router]);

  // Auto-select or create conversation from URL param
  useEffect(() => {
    const userId = searchParams?.get('user');
    if (userId && user?.id && conversations.length >= 0 && !isLoadingConversations) {
      const targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) return;

      // Check if conversation with this user already exists
      const existingConv = conversations.find(c =>
        c.other_participants?.some(p => p.user_id === targetUserId)
      );

      if (existingConv) {
        setSelectedConversation(existingConv.conversation_id);
      } else if (targetUserId !== user.id) {
        // Create new conversation
        createDirectConversation(targetUserId);
      }
    }
  }, [searchParams, conversations, user, isLoadingConversations]);

  // Real-time messaging subscription for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation);

    const channel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload: any) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === user?.id) return;

          const { data: sender } = await supabase
            .from('auth_user')
            .select('name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMsg,
            sender_name: sender?.name || 'User',
            sender_avatar_url: sender?.avatar_url,
            deleted_by_user_ids: newMsg.deleted_by_user_ids || [],
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Global real-time subscription to refresh conversation list sidebar
  useEffect(() => {
    if (!user?.id) return;

    const globalChannel = supabase
      .channel('messages-global-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMsg = payload.new as any;
          // Skip messages sent by current user (already handled by optimistic update)
          if (newMsg.sender_id === user?.id) return;
          // Refresh conversation list to update last message and ordering
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Refresh conversation list when any conversation is updated
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [user?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTeamMembers = async () => {
    try {
      const { data } = await supabase
        .from('auth_user')
        .select('id, name, email, avatar_url')
        .eq('is_active', true)
        .order('name');
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const createDirectConversation = async (targetUserId: number) => {
    if (!user?.id) return;
    try {
      const { data: convId, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', {
        user1_id: user.id,
        user2_id: targetUserId
      });

      if (rpcError) {
        console.error('Error creating conversation via RPC:', rpcError);
        // Fallback: try creating manually
        await createConversationManually(targetUserId);
        return;
      }

      if (convId) {
        setSelectedConversation(convId);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      // Fallback: try creating manually
      await createConversationManually(targetUserId);
    }
  };

  const createConversationManually = async (targetUserId: number) => {
    if (!user?.id) return;
    try {
      // Check if a direct conversation already exists between these two users
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingParticipants && existingParticipants.length > 0) {
        const myConvIds = existingParticipants.map(p => p.conversation_id);
        
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', targetUserId)
          .in('conversation_id', myConvIds);

        if (otherParticipants && otherParticipants.length > 0) {
          // Check if any of these are direct conversations
          for (const op of otherParticipants) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('id, conversation_type')
              .eq('id', op.conversation_id)
              .eq('conversation_type', 'direct')
              .single();
            
            if (conv) {
              setSelectedConversation(conv.id);
              fetchConversations();
              return;
            }
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert([{
          conversation_type: 'direct',
          last_message_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (convError || !newConv) {
        console.error('Error creating conversation:', convError);
        setError('Failed to create conversation. The messages table might not be set up yet.');
        return;
      }

      // Add both participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: targetUserId },
        ]);

      setSelectedConversation(newConv.id);
      fetchConversations();
    } catch (err) {
      console.error('Error creating conversation manually:', err);
      setError('Failed to create conversation.');
    }
  };

  const fetchConversations = async () => {
    if (!user?.id) return;
    setIsLoadingConversations(true);

    try {
      // Fetch conversations the user is part of
      const { data: convParticipants, error: cpError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations(id, conversation_type, group_name, last_message_at)')
        .eq('user_id', user.id);

      if (cpError) {
        console.error('Error fetching conversation participants:', cpError);
        // Table might not exist
        setError('Messages feature is not available. The required database tables may not be set up yet.');
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      if (!convParticipants || convParticipants.length === 0) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      const enrichedConversations = await Promise.all(
        convParticipants.map(async (cp: any) => {
          const conversation = cp.conversations;
          if (!conversation) return null;

          // Get other participants with avatar
          const { data: otherParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id, auth_user(id, name, email, avatar_url)')
            .eq('conversation_id', conversation.id)
            .neq('user_id', user.id);

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          // Get last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('message_text, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const formattedParticipants = (otherParticipants || []).map((p: any) => ({
            user_id: p.auth_user?.id || p.user_id,
            name: p.auth_user?.name || 'Unknown',
            email: p.auth_user?.email || '',
            avatar_url: p.auth_user?.avatar_url
          }));

          return {
            conversation_id: conversation.id,
            conversation_type: conversation.conversation_type,
            group_name: conversation.group_name,
            last_message_at: conversation.last_message_at,
            unread_count: unreadCount || 0,
            last_message: lastMsgData?.[0] || null,
            other_participants: formattedParticipants
          };
        })
      );

      const validConversations = (enrichedConversations
        .filter((c: any) => c !== null) as Conversation[])
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(validConversations);
      setError('');
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations.');
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    if (!user?.id) return;
    setIsLoadingMessages(true);

    try {
      const { data, error: msgError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message_text,
          created_at,
          is_deleted,
          deleted_for_everyone,
          deleted_by_user_ids
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      if (data) {
        const enriched = await Promise.all(data.map(async (msg: any) => {
          const { data: sender } = await supabase
            .from('auth_user')
            .select('name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender_name: sender?.name || 'User',
            sender_avatar_url: sender?.avatar_url,
            deleted_by_user_ids: msg.deleted_by_user_ids || [],
          };
        }));
        setMessages(enriched);

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .eq('is_read', false)
          .neq('sender_id', user.id);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: Date.now(),
      conversation_id: selectedConversation,
      sender_id: user.id,
      sender_name: user.name || 'You',
      message_text: messageText,
      created_at: new Date().toISOString(),
      is_deleted: false,
      deleted_for_everyone: false,
      deleted_by_user_ids: [],
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Try using the RPC first
      const { error: rpcError } = await supabase.rpc('send_message', {
        conversation_id_param: selectedConversation,
        sender_id_param: user.id,
        message_text_param: messageText
      });

      if (rpcError) {
        // Fallback: insert directly
        const { error: insertError } = await supabase
          .from('messages')
          .insert([{
            conversation_id: selectedConversation,
            sender_id: user.id,
            message_text: messageText,
            created_at: new Date().toISOString(),
            is_read: false,
            is_deleted: false,
            deleted_for_everyone: false,
            deleted_by_user_ids: [],
          }]);

        if (insertError) {
          console.error('Error sending message:', insertError);
          // Remove optimistic message
          fetchMessages(selectedConversation);
          return;
        }
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);

      // Refresh to get actual message
      setTimeout(() => fetchMessages(selectedConversation), 500);
    } catch (err) {
      console.error('Error sending message:', err);
      fetchMessages(selectedConversation);
    }
  };

  const deleteMessage = async (messageId: number, forEveryone: boolean) => {
    if (!user?.id) return;
    try {
      if (forEveryone) {
        await supabase
          .from('messages')
          .update({ deleted_for_everyone: true, is_deleted: true })
          .eq('id', messageId);
      } else {
        // Get current deleted_by_user_ids
        const { data: msg } = await supabase
          .from('messages')
          .select('deleted_by_user_ids')
          .eq('id', messageId)
          .single();

        const currentIds = msg?.deleted_by_user_ids || [];
        await supabase
          .from('messages')
          .update({ deleted_by_user_ids: [...currentIds, user.id] })
          .eq('id', messageId);
      }

      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation || !user?.id) return;
    if (!confirm('Are you sure you want to delete this entire conversation? This cannot be undone.')) return;

    try {
      await supabase.from('messages').delete().eq('conversation_id', selectedConversation);
      await supabase.from('conversation_participants').delete().eq('conversation_id', selectedConversation);
      await supabase.from('conversations').delete().eq('id', selectedConversation);

      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHrs = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffHrs < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const selectedConv = conversations.find(c => c.conversation_id === selectedConversation);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.conversation_type === 'group'
      ? c.group_name
      : c.other_participants?.[0]?.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredTeamMembers = teamMembers.filter(m => {
    if (m.id === user?.id) return false;
    if (!searchQuery) return true;
    return m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Loading state
  if (authLoading) {
    return (
      <div style={{
        padding: '2rem',
        background: '#F5F5ED',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #C483D9',
          borderTop: '3px solid #5884FD',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .msg-conv-item:hover {
            background: #f0f0e8 !important;
          }
          .msg-send-btn:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(88, 132, 253, 0.4);
          }
          .msg-bubble-delete:hover {
            opacity: 1 !important;
            background: #F87239 !important;
            color: #fff !important;
          }
          .msg-new-chat-item:hover {
            background: #f0f0e8 !important;
          }
        `
      }} />

      <div style={{
        background: '#F5F5ED',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 0 2rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '300',
                margin: '0',
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Messages
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Chat with your team members
              </p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#5884FD',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)',
              }}
            >
              <PlusIcon style={{ width: '18px', height: '18px' }} />
              New Chat
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            margin: '0 2rem 1rem 2rem',
            background: '#ffffff',
            border: '1px solid #F87239',
            borderRadius: '12px',
            padding: '1rem',
            color: '#F87239',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)',
          }}>
            {error}
          </div>
        )}

        {/* Main Chat Area */}
        <div style={{
          flex: 1,
          margin: '0 2rem 2rem 2rem',
          background: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          minHeight: 'calc(100vh - 200px)',
        }}>
          {/* Conversation List (Left Panel) */}
          <div style={{
            width: '340px',
            borderRight: '1px solid #e8e8e8',
            display: 'flex',
            flexDirection: 'column',
            background: '#fafaf5',
          }}>
            {/* Search */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e8e8e8' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#f0f0e8',
                borderRadius: '10px',
                padding: '0.6rem 0.75rem',
              }}>
                <MagnifyingGlassIcon style={{ width: '18px', height: '18px', color: '#999999', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'none',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#1a1a1a',
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isLoadingConversations ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999999' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e0e0e0',
                    borderTop: '2px solid #5884FD',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 0.5rem',
                  }} />
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999999', fontSize: '0.9rem' }}>
                  <ChatBubbleLeftRightIcon style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', color: '#cccccc' }} />
                  <p style={{ margin: 0 }}>No conversations yet</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Start a new chat to begin messaging</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation === conv.conversation_id;
                  const displayName = conv.conversation_type === 'group'
                    ? conv.group_name || 'Group Chat'
                    : conv.other_participants?.[0]?.name || 'Unknown';
                  const avatarUrl = conv.conversation_type === 'group'
                    ? undefined
                    : conv.other_participants?.[0]?.avatar_url;
                  const lastMsg = conv.last_message?.message_text || 'No messages yet';

                  return (
                    <div
                      key={conv.conversation_id}
                      className="msg-conv-item"
                      onClick={() => setSelectedConversation(conv.conversation_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: isSelected ? '#e8e8e0' : 'transparent',
                        borderBottom: '1px solid #f0f0e8',
                        borderLeft: isSelected ? '3px solid #5884FD' : '3px solid transparent',
                      }}
                    >
                      <Avatar name={displayName} avatarUrl={avatarUrl} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.2rem',
                        }}>
                          <span style={{
                            fontWeight: conv.unread_count > 0 ? 600 : 500,
                            color: '#1a1a1a',
                            fontSize: '0.95rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {displayName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#999999', flexShrink: 0, marginLeft: '0.5rem' }}>
                            {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{
                            fontSize: '0.85rem',
                            color: '#888888',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                          }}>
                            {lastMsg}
                          </span>
                          {conv.unread_count > 0 && (
                            <span style={{
                              background: '#5884FD',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginLeft: '0.5rem',
                            }}>
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Panel (Right) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {selectedConversation && selectedConv ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e8e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafaf5',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar
                      name={(selectedConv.conversation_type === 'group'
                        ? selectedConv.group_name
                        : selectedConv.other_participants?.[0]?.name) || 'Unknown'}
                      avatarUrl={selectedConv.conversation_type === 'group'
                        ? undefined
                        : selectedConv.other_participants?.[0]?.avatar_url}
                      size={40}
                    />
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a' }}>
                        {selectedConv.conversation_type === 'group'
                          ? selectedConv.group_name
                          : selectedConv.other_participants?.[0]?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Online</div>
                    </div>
                  </div>
                  <button
                    onClick={deleteConversation}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.875rem',
                      background: 'rgba(248, 114, 57, 0.08)',
                      border: '1px solid rgba(248, 114, 57, 0.2)',
                      borderRadius: '8px',
                      color: '#F87239',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F87239'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248, 114, 57, 0.08)'; e.currentTarget.style.color = '#F87239'; }}
                  >
                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                    Delete Chat
                  </button>
                </div>

                {/* Messages Area */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: '#fafaf5',
                }}>
                  {isLoadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        border: '2px solid #e0e0e0',
                        borderTop: '2px solid #5884FD',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      color: '#999999',
                    }}>
                      <ChatBubbleLeftRightIcon style={{ width: '48px', height: '48px', color: '#cccccc' }} />
                      <p style={{ fontSize: '1rem', fontWeight: 500, color: '#666666' }}>No messages yet</p>
                      <p style={{ fontSize: '0.85rem' }}>Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.sender_id === user?.id;
                      const isDeletedForMe = message.deleted_by_user_ids?.includes(user?.id || 0);
                      const isDeleted = message.deleted_for_everyone || isDeletedForMe;

                      if (isDeleted) return null;

                      return (
                        <div key={message.id} style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                        }}>
                          {!isMe && (
                            <Avatar name={message.sender_name} avatarUrl={message.sender_avatar_url} size={32} />
                          )}
                          <div style={{ maxWidth: '60%', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            {!isMe && (
                              <span style={{ fontSize: '0.75rem', color: '#999999', marginLeft: '0.5rem' }}>
                                {message.sender_name} &middot; {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <div style={{
                                padding: '0.75rem 1rem',
                                background: isMe ? '#5884FD' : '#f0f0e8',
                                color: isMe ? '#FFFFFF' : '#1a1a1a',
                                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                fontSize: '0.9rem',
                                lineHeight: 1.5,
                                flex: 1,
                                wordBreak: 'break-word',
                              }}>
                                {message.message_text}
                              </div>
                              <button
                                className="msg-bubble-delete"
                                onClick={() => {
                                  if (confirm(`Delete this message ${isMe ? 'for everyone?' : 'for you?'}`)) {
                                    deleteMessage(message.id, isMe);
                                  }
                                }}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '50%',
                                  color: '#cccccc',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  opacity: 0.5,
                                  transition: 'all 0.2s',
                                }}
                              >
                                <TrashIcon style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                            {isMe && (
                              <span style={{ fontSize: '0.75rem', color: '#999999', textAlign: 'right', marginRight: '0.5rem' }}>
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; You
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e8e8e8',
                  background: '#ffffff',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      flex: 1,
                      background: '#f0f0e8',
                      borderRadius: '24px',
                      padding: '0.75rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          color: '#1a1a1a',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      className="msg-send-btn"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      style={{
                        width: '42px',
                        height: '42px',
                        background: newMessage.trim() ? '#5884FD' : '#e0e0e0',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#FFFFFF',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      <PaperAirplaneIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State - No Conversation Selected */
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(88, 132, 253, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ChatBubbleLeftRightIcon style={{ width: '40px', height: '40px', color: '#5884FD' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    Select a conversation
                  </h3>
                  <p style={{ color: '#888888', fontSize: '0.9rem' }}>
                    Choose a chat from the sidebar or start a new conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowNewChat(false)}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '420px',
              maxHeight: '70vh',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1a1a1a' }}>New Conversation</h3>
              <button
                onClick={() => setShowNewChat(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999999',
                  padding: '0.25rem',
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Search in modal */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f0f0e8' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#f0f0e8',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
              }}>
                <MagnifyingGlassIcon style={{ width: '16px', height: '16px', color: '#999999' }} />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a' }}
                />
              </div>
            </div>

            {/* Team Members List */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
              {filteredTeamMembers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999999', fontSize: '0.9rem' }}>
                  No team members found
                </div>
              ) : (
                filteredTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="msg-new-chat-item"
                    onClick={() => {
                      setShowNewChat(false);
                      setSearchQuery('');
                      createDirectConversation(member.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderBottom: '1px solid #f5f5f0',
                    }}
                  >
                    <Avatar name={member.name} avatarUrl={member.avatar_url} size={38} />
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1a1a1a' }}>{member.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#999999' }}>{member.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{
        padding: '2rem',
        background: '#F5F5ED',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #C483D9',
          borderTop: '3px solid #5884FD',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
