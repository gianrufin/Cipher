import React from 'react';

interface PlayerAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, src, className = '' }) => {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] font-display font-black text-stone-400 ${className}`}>
      {src ? (
        <img src={src} alt={`${name}'s selfie`} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span aria-hidden="true">{initial || '?'}</span>
      )}
    </span>
  );
};
