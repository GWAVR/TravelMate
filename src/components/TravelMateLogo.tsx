import React, { useState } from 'react';
import logoImg from '../assets/images/logo.jpeg';

export type LogoSize = number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TravelMateLogoProps {
  size?: LogoSize;
  className?: string;
  customLogoUrl?: string;
  showText?: boolean;
}

const SIZE_NUM_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const TravelMateLogo: React.FC<TravelMateLogoProps> = ({
  size = 36,
  className = '',
  customLogoUrl,
}) => {
  const pixelSize = typeof size === 'number' ? size : (SIZE_NUM_MAP[size] || 36);

  // Candidates in priority order: customUrl -> public /logo.jpeg -> bundled logoImg -> alternate public paths
  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (customLogoUrl) list.push(customLogoUrl);
    list.push('/logo.jpeg');
    if (logoImg && !list.includes(logoImg)) list.push(logoImg);
    list.push('/logo.jpg');
    list.push('/travelmate_logo.jpg');
    return list;
  }, [customLogoUrl]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  const currentSrc = candidates[candidateIndex];

  // Render the uploaded travel logo image with smooth border & styling
  if (!allFailed && currentSrc) {
    return (
      <img
        src={currentSrc}
        alt="TravelMate Logo"
        loading="eager"
        decoding="async"
        className={`object-cover rounded-xl shadow-xs shrink-0 select-none border border-[#e2e8f0]/40 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onError={handleImageError}
      />
    );
  }

  // Standalone vector SVG fallback if image cannot load
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none shadow-xs rounded-xl overflow-hidden ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      title="TravelMate"
    >
      <svg
        viewBox="0 0 48 48"
        width={pixelSize}
        height={pixelSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="tm-bg-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#004d77" />
            <stop offset="50%" stopColor="#006194" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="tm-wing-gradient" x1="12" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="tm-accent-gradient" x1="28" y1="28" x2="42" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>

        {/* Squircle Background Badge */}
        <rect width="48" height="48" rx="14" fill="url(#tm-bg-gradient)" />

        {/* Subtle Compass & Globe Latitude Arc */}
        <circle cx="24" cy="24" r="16" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="3 3" />
        <ellipse cx="24" cy="24" rx="16" ry="6" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.2" transform="rotate(-25 24 24)" />

        {/* Paper Plane / Jet Flight Silhouette */}
        <path
          d="M38 10L11 23.5L22 28.5L38 10Z"
          fill="url(#tm-wing-gradient)"
          fillOpacity="0.95"
        />
        <path
          d="M38 10L25 38L22 28.5L38 10Z"
          fill="url(#tm-wing-gradient)"
          fillOpacity="0.75"
        />
        <path
          d="M22 28.5L25 38L29 32.5L22 28.5Z"
          fill="#0284c7"
          fillOpacity="0.9"
        />

        {/* GPS Location Pin / Star Dot in Flight Path */}
        <circle cx="39" cy="9" r="2.5" fill="#fef08a" />
        <circle cx="39" cy="9" r="4.5" stroke="#fef08a" strokeOpacity="0.4" strokeWidth="1" />
      </svg>
    </div>
  );
};
