'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MessageNotification {
  id: number;
  senderName: string;
  messageText: string;
  conversationId: number;
}

export default function GlobalMessageNotification() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notification, setNotification] = useState<MessageNotification | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    
    // Don't show notification if already on messages page
    if (pathname?.startsWith('/messages')) return;

    const channel = supabase
      .channel('global-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const newMsg = payload.new as any;
        
        // Skip if it's my own message
        if (newMsg.sender_id === user.id) return;
        
        // Check if this message is in a conversation I'm part of
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('*')
          .eq('conversation_id', newMsg.conversation_id)
          .eq('user_id', user.id)
          .single();
        
        if (!participants) return; // Not in this conversation
        
        // Get sender info
        const { data: sender } = await supabase
          .from('auth_user')
          .select('name')
          .eq('id', newMsg.sender_id)
          .single();
        
        // Show notification
        setNotification({
          id: newMsg.id,
          senderName: sender?.name || 'Someone',
          messageText: newMsg.message_text,
          conversationId: newMsg.conversation_id
        });
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => setNotification(null), 8000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, pathname]);

  if (!notification) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#ffffff',
      border: '2px solid #3B82F6',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      padding: '16px',
      maxWidth: '400px',
      cursor: 'pointer',
      animation: 'slideIn 0.3s ease-out'
    }}
    onClick={() => router.push(`/messages?user=${notification.conversationId}`)}
    >
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <div style={{
          background: '#3B82F6',
          borderRadius: '50%',
          padding: '8px',
          flexShrink: 0
        }}>
          <ChatBubbleLeftRightIcon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
            {notification.senderName}
          </div>
          <div style={{
            color: '#6B7280',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {notification.messageText}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotification(null);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#9CA3AF',
            flexShrink: 0
          }}
        >
          <XMarkIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}
