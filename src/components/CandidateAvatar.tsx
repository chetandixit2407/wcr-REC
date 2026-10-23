import React, { useState } from 'react';
import type { Candidate } from '../types/index.ts';
import { getValidCandidatePhoto } from '../utils/candidateHelpers.ts';

interface CandidateAvatarProps {
  candidate?: Partial<Candidate> | null;
  name?: string;
  sizeClassName?: string;
  roundedClassName?: string;
  borderClassName?: string;
  fallbackBgClassName?: string;
  fallbackTextClassName?: string;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * High-clarity, fail-safe Candidate Profile Avatar.
 * Guarantees zero broken image icons by validating photo payload
 * and providing an instant, crisp initials fallback on decode error.
 */
export const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
  candidate,
  name,
  sizeClassName = 'w-14 h-14',
  roundedClassName = 'rounded-2xl',
  borderClassName = 'border-2 border-[#121316]',
  fallbackBgClassName = 'bg-[#FAF8F5]',
  fallbackTextClassName = 'text-[#121316]',
  className = '',
  icon,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const rawPhoto = getValidCandidatePhoto(candidate);
  const displayName = name || candidate?.fullName || 'WCR Candidate';

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    displayName.slice(0, 2).toUpperCase() ||
    'WC';

  if (rawPhoto && !imgFailed) {
    return (
      <img
        src={rawPhoto}
        alt={displayName}
        onError={() => setImgFailed(true)}
        className={`${sizeClassName} ${roundedClassName} object-cover ${borderClassName} shadow-xs shrink-0 select-none ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`candidate-avatar ${sizeClassName} ${roundedClassName} ${fallbackBgClassName} ${fallbackTextClassName} ${borderClassName} flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0 select-none ${className}`}
      title={displayName}
      aria-label={displayName}
    >
      {icon ? icon : <span>{initials}</span>}
    </div>
  );
};

export default CandidateAvatar;
