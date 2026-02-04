import React from 'react';

interface UserAvatarProps {
  user: {
    id?: number;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const SIZES = {
  xs: { avatar: '20px', text: '0.6rem' },
  sm: { avatar: '24px', text: '0.6875rem' },
  md: { avatar: '32px', text: '0.75rem' },
  lg: { avatar: '40px', text: '0.875rem' },
  xl: { avatar: '48px', text: '1rem' },
};

const COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', 
  '#F59E0B', '#EF4444', '#06B6D4', '#F97316'
];

export default function UserAvatar({ 
  user, 
  size = 'md', 
  showName = false,
  className = '' 
}: UserAvatarProps) {
  const dimensions = SIZES[size];
  const initial = user.name?.charAt(0)?.toUpperCase() || 'U';
  
  // Generate consistent color based on user ID or name
  const colorIndex = (user.id || user.name.length) % COLORS.length;
  const bgColor = COLORS[colorIndex];

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: showName ? '0.5rem' : '0' }}
      className={className}
    >
      <div
        style={{
          width: dimensions.avatar,
          height: dimensions.avatar,
          borderRadius: '50%',
          background: user.avatar_url 
            ? `url(${user.avatar_url}) center/cover` 
            : bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: dimensions.text,
          fontWeight: 600,
          flexShrink: 0,
          border: '2px solid #1F1F1F',
        }}
        title={user.name}
      >
        {!user.avatar_url && initial}
      </div>
      {showName && (
        <span style={{
          fontSize: dimensions.text,
          color: '#E4E4E7',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.name}
        </span>
      )}
    </div>
  );
}

// AvatarGroup component for displaying multiple avatars
interface AvatarGroupProps {
  users: Array<{
    id?: number;
    name: string;
    email?: string;
    avatar_url?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: AvatarGroupProps) {
  const dimensions = SIZES[size];
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      marginLeft: size === 'xs' ? '-4px' : '-6px'
    }}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id || index}
          style={{
            marginLeft: index === 0 ? 0 : size === 'xs' ? '-8px' : '-10px',
            position: 'relative',
            zIndex: visibleUsers.length - index,
          }}
        >
          <UserAvatar user={user} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          style={{
            marginLeft: size === 'xs' ? '-8px' : '-10px',
            width: dimensions.avatar,
            height: dimensions.avatar,
            borderRadius: '50%',
            background: '#3D3D3D',
            border: '2px solid #1F1F1F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A1A1AA',
            fontSize: dimensions.text,
            fontWeight: 600,
            zIndex: 0,
          }}
          title={`${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
