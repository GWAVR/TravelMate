import React, { useState } from 'react';

export interface UserAvatarProps {
  name?: string;
  avatar?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatusBadge?: boolean;
  isOnline?: boolean;
  colorScheme?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', badge: 'w-2 h-2 top-0 right-0' },
  sm: { box: 'w-8 h-8', text: 'text-xs', badge: 'w-2 h-2 top-0 right-0' },
  md: { box: 'w-10 h-10', text: 'text-sm', badge: 'w-2.5 h-2.5 top-0 right-0' },
  lg: { box: 'w-12 h-12', text: 'text-base', badge: 'w-3 h-3 top-0.5 right-0.5' },
  xl: { box: 'w-20 h-20', text: 'text-2xl', badge: 'w-4 h-4 top-1 right-1' },
};

function getInitials(name?: string, fallbackInitials?: string): string {
  if (fallbackInitials && fallbackInitials.trim().length > 0) {
    return fallbackInitials.trim().substring(0, 2).toUpperCase();
  }
  if (!name || name.trim().length === 0) return 'TM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Traveler',
  avatar,
  initials,
  size = 'md',
  className = '',
  showStatusBadge = false,
  isOnline = true,
  colorScheme,
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const computedInitials = getInitials(name, initials);

  const hasPhoto = Boolean(avatar && avatar.trim().length > 0 && !hasImageError);

  const isCustomColor = Boolean(colorScheme && (colorScheme.startsWith('#') || colorScheme.startsWith('rgb')));
  const defaultBackground = !isCustomColor && colorScheme ? colorScheme : 'bg-gradient-to-tr from-[#004d77] to-[#0284c7]';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {hasPhoto ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeConfig.box} rounded-full object-cover ring-2 ring-white shadow-2xs`}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div
          className={`${sizeConfig.box} rounded-full ${!isCustomColor ? defaultBackground : ''} text-white font-bold ${sizeConfig.text} flex items-center justify-center ring-2 ring-white shadow-2xs tracking-wider`}
          style={isCustomColor ? { backgroundColor: colorScheme } : undefined}
          title={name}
        >
          {computedInitials}
        </div>
      )}

      {showStatusBadge && (
        <span
          className={`absolute ${sizeConfig.badge} rounded-full ring-2 ring-white ${
            isOnline ? 'bg-[#10b981]' : 'bg-[#94a3b8]'
          }`}
          title={isOnline ? 'Active' : 'Offline'}
        />
      )}
    </div>
  );
};
