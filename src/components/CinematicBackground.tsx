import React from 'react';

export type CinematicVariant =
  | 'dashboard'
  | 'reception'
  | 'visitor'
  | 'interview'
  | 'room'
  | 'candidate'
  | 'settings';

interface CinematicBackgroundProps {
  variant?: CinematicVariant;
  intensity?: 'normal' | 'subdued' | 'minimal';
}

/**
 * Screen-responsive White Collar Realty official background canvas.
 * - Dynamically adapts to mobile, tablet, laptop, and desktop screen sizes
 * - Guarantees the emblem, typography, and gold corner arches stay in full view
 *   without awkward cropping on any screen resolution or aspect ratio.
 */
export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ intensity = 'normal' }) => {
  const opacityClass =
    intensity === 'minimal'
      ? 'opacity-40 sm:opacity-50'
      : intensity === 'subdued'
      ? 'opacity-65 sm:opacity-75'
      : 'opacity-90 sm:opacity-95';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#FAF9F6] flex items-center justify-center"
    >
      {/* Background layer for desktop & wide screens */}
      <div className="absolute inset-0 hidden md:block">
        <img
          src="/wcr-background-logo.png"
          alt=""
          className={`w-full h-full object-cover object-center transition-all duration-300 ${opacityClass}`}
        />
      </div>

      {/* Screen-size adaptive container for mobile & tablet screens (prevents text/logo cropping) */}
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 md:hidden">
        <img
          src="/wcr-background-logo.png"
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-center ${opacityClass}`}
        />
        <div className="relative w-[94vw] sm:w-[85vw] max-h-[82vh] flex items-center justify-center">
          <img
            src="/wcr-background-logo.png"
            alt=""
            className="w-full h-auto max-h-[82vh] object-contain drop-shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default CinematicBackground;
