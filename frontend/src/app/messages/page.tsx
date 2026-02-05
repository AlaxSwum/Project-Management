'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  PaperAirplaneIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';

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

export default function MessagesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchConversations();
    fetchProjects();
  }, [isAuthenticated, authLoading, router]);

  // Auto-select or create conversation from URL
  useEffect(() => {
    const userId = searchParams?.get('user');
    if (userId && user?.id) {
      const targetUserId = parseInt(userId);
      
      // Check if conversation exists
      const existingConv = conversations.find(c => 
        c.other_participants?.some(p => p.user_id === targetUserId)
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv.conversation_id);
      } else {
        // Create new conversation
        const createConversation = async () => {
          try {
            const { data: convId } = await supabase.rpc('get_or_create_direct_conversation', {
              user1_id: user.id,
              user2_id: targetUserId
            });
            
            if (convId) {
              setSelectedConversation(convId);
              fetchConversations(); // Refresh list
            }
          } catch (error) {
            // Error creating conversation
          }
        };
        createConversation();
      }
    }
  }, [searchParams, conversations, user]);

  // Real-time messaging with Supabase subscriptions
  useEffect(() => {
    if (!selectedConversation) return;
    
    // Initial fetch
    fetchMessages(selectedConversation);
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload) => {
          // Handle new message
          const newMessage = payload.new as any;
          
          // Fetch sender name
          const { data: sender } = await supabase
            .from('auth_user')
            .select('name')
            .eq('id', newMessage.sender_id)
            .single();
          
          // Add to messages state immediately
          setMessages(prev => [...prev, {
            ...newMessage,
            sender_name: sender?.name || 'User'
          }]);
          
          // Refresh conversations list to update last message
          fetchConversations();
        }
      )
      .subscribe();
    
    // Cleanup subscription on unmount or conversation change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from('projects_project').select('*');
      setProjects(data || []);
    } catch (error) {
      // Error
    }
  };

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch conversations and participants manually with avatar_url
      const { data: convParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations(id, conversation_type, group_name, last_message_at)')
        .eq('user_id', user.id);
      
      if (!convParticipants || convParticipants.length === 0) {
        setConversations([]);
        return;
      }
      
      // Build conversations with enriched participants
      const enrichedConversations = await Promise.all(
        convParticipants.map(async (cp: any) => {
          const conversation = cp.conversations;
          if (!conversation) return null;
          
          // Get other participants with avatar_url
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
          
          // Format other participants
          const formattedParticipants = (otherParticipants || []).map((p: any) => ({
            user_id: p.auth_user.id,
            name: p.auth_user.name,
            email: p.auth_user.email,
            avatar_url: p.auth_user.avatar_url
          }));
          
          return {
            conversation_id: conversation.id,
            conversation_type: conversation.conversation_type,
            group_name: conversation.group_name,
            last_message_at: conversation.last_message_at,
            unread_count: unreadCount || 0,
            last_message: null,
            other_participants: formattedParticipants
          };
        })
      );
      
      // Filter out nulls and sort by last message
      const validConversations = enrichedConversations
        .filter(c => c !== null)
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      
      setConversations(validConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
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
      
      if (data) {
        // Enrich with sender names and avatars
        const enriched = await Promise.all(data.map(async (msg) => {
          const { data: sender } = await supabase
            .from('auth_user')
            .select('name, avatar_url')
            .eq('id', msg.sender_id)
            .single();
          
          return {
            ...msg,
            sender_name: sender?.name || 'User',
            sender_avatar_url: sender?.avatar_url
          };
        }));
        
        setMessages(enriched);
      }
    } catch (error) {
      // Error
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;
    
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    try {
      // Add optimistic message immediately
      const optimisticMessage = {
        id: Date.now(), // Temporary ID
        conversation_id: selectedConversation,
        sender_id: user.id,
        sender_name: user.name || 'You',
        message_text: messageText,
        created_at: new Date().toISOString(),
        is_deleted: false,
        deleted_for_everyone: false,
        deleted_by_user_ids: []
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send to database
      await supabase.rpc('send_message', {
        conversation_id_param: selectedConversation,
        sender_id_param: user.id,
        message_text_param: messageText
      });
      
      // Refresh to get actual message with correct ID
      setTimeout(() => fetchMessages(selectedConversation), 500);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      fetchMessages(selectedConversation);
    }
  };

  const deleteMessage = async (messageId: number, forEveryone: boolean) => {
    if (!user?.id) return;
    
    try {
      await supabase.rpc('delete_message', {
        message_id_param: messageId,
        user_id_param: user.id,
        delete_for_everyone: forEveryone
      });
      
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    } catch (error) {
      // Error
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const selectedConv = conversations.find(c => c.conversation_id === selectedConversation);

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      
      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', background: '#0D0D0D' }}>
        {/* Conversations List */}
        <div style={{ width: '320px', background: '#141414', borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1F1F1F' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Messaging</h2>
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              style={{ width: '100%', padding: '0.75rem 1rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map((conv) => {
              const isSelected = conv.conversation_id === selectedConversation;
              const otherUser = conv.other_participants?.[0];
              const displayName = conv.conversation_type === 'group' 
                ? conv.group_name 
                : otherUser?.name || 'Unknown';
              
              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv.conversation_id)}
                  style={{
                    padding: '1rem 1.25rem',
                    background: isSelected ? '#1A1A1A' : 'transparent',
                    borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderBottom: '1px solid #1F1F1F'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1A1A1A'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserAvatar 
                      user={{ 
                        name: displayName || 'Unknown', 
                        avatar_url: conv.conversation_type === 'group' ? undefined : otherUser?.avatar_url 
                      }} 
                      size="lg" 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                        {conv.unread_count > 0 && (
                          <span style={{ minWidth: '20px', height: '20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.375rem' }}>
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message?.message_text || 'No messages yet'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#52525B', marginTop: '0.25rem' }}>
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
            {/* Chat Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#141414', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserAvatar 
                  user={{ 
                    name: (selectedConv?.conversation_type === 'group' 
                      ? selectedConv.group_name 
                      : selectedConv?.other_participants?.[0]?.name) || 'Unknown',
                    avatar_url: selectedConv?.conversation_type === 'group' 
                      ? undefined 
                      : selectedConv?.other_participants?.[0]?.avatar_url
                  }} 
                  size="md" 
                />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {selectedConv?.conversation_type === 'group' 
                      ? selectedConv.group_name 
                      : selectedConv?.other_participants?.[0]?.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#10B981' }}>Online</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.5rem', transition: 'all 0.2s' }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.5rem', transition: 'all 0.2s' }}>
                  <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((message) => {
                const isMe = message.sender_id === user?.id;
                const isDeletedForMe = message.deleted_by_user_ids?.includes(user?.id || 0);
                const isDeleted = message.deleted_for_everyone || isDeletedForMe;
                
                if (isDeleted) return null;
                
                return (
                  <div key={message.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '0.75rem' }}>
                    {!isMe && (
                      <UserAvatar 
                        user={{ name: message.sender_name, avatar_url: message.sender_avatar_url }} 
                        size="sm" 
                      />
                    )}
                    <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {!isMe && (
                        <span style={{ fontSize: '0.75rem', color: '#71717A', marginLeft: '0.75rem' }}>
                          {message.sender_name} • {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <div 
                        style={{ 
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div
                          style={{ 
                            padding: '0.875rem 1.125rem', 
                            background: isMe ? '#3B82F6' : '#2D2D2D', 
                            color: '#FFFFFF', 
                            borderRadius: '1rem',
                            fontSize: '0.9375rem',
                            lineHeight: 1.5,
                            flex: 1
                          }}
                        >
                          {message.message_text}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Delete this message ${isMe ? 'for everyone?' : 'for you?'}`)) {
                              deleteMessage(message.id, isMe);
                            }
                          }}
                          style={{
                            width: '24px',
                            height: '24px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            opacity: 0.7,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.background = '#EF4444';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#EF4444';
                          }}
                        >
                          <TrashIcon style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                      {isMe && (
                        <span style={{ fontSize: '0.75rem', color: '#71717A', textAlign: 'right', marginRight: '0.75rem' }}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#141414', borderTop: '1px solid #1F1F1F' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, background: '#2D2D2D', borderRadius: '1.25rem', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Write a message..."
                    style={{ flex: 1, background: 'none', border: 'none', color: '#FFFFFF', fontSize: '0.9375rem', outline: 'none' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{ width: '40px', height: '40px', background: newMessage.trim() ? '#3B82F6' : '#2D2D2D', border: 'none', borderRadius: '50%', color: '#FFFFFF', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
                >
                  <PaperAirplaneIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '40px', height: '40px', color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>Select a conversation</h3>
              <p style={{ color: '#71717A', fontSize: '0.875rem' }}>Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
