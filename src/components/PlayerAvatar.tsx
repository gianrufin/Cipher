import React from 'react';

interface PlayerAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, src, className = '' }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] font-display font-black text-stone-400 ${className}`}>
      {src ? (
        <img src={src} alt={`${name}'s selfie`} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span aria-hidden="true">{initials || '?'}</span>
      )}
    </span>
  );
};
