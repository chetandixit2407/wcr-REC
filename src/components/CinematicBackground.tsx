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
  hasSidebar?: boolean;
}

/**
 * Responsive White Collar Realty official logo background.
 * - Displays the official White Collar Realty brand emblem centered in the background.
 * - Perfectly calibrated visibility (opacity ~0.35 - 0.42) so the skyline, silver collar,
 *   brand name, and tagline are clearly recognizable.
 * - Fluid responsive sizing across mobile (320px/375px), tablet (768px/1024px), laptop (1366px), and desktop (1920px+).
 * - Offsets on desktop to center cleanly in the main operations viewport.
 * - Single background element prevents duplication, distortion, or unwanted cropping.
 * - Works harmoniously with transparent frosted glass panels so content remains 100% legible.
 */
export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  intensity = 'normal',
  hasSidebar = false,
}) => {
  const opacityValue =
    intensity === 'minimal'
      ? 0.28
      : intensity === 'subdued'
      ? 0.35
      : 0.42;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 ${hasSidebar ? 'lg:left-64' : ''} pointer-events-none z-0 overflow-hidden select-none bg-[#FAF9F6] flex items-center justify-center p-4 sm:p-8 transition-all duration-300`}
    >
      {/* Centered White Collar Realty Official Logo in Background */}
      <div className="relative w-full max-w-[780px] max-h-[78vh] flex items-center justify-center pointer-events-none select-none">
        <img
          src="/assets/aistudio/image_79ede425.png"
          alt="White Collar Realty - A Tradition Of Trust"
          className="w-[88vw] sm:w-[72vw] md:w-[60vw] lg:w-[48vw] max-w-[740px] h-auto max-h-[74vh] object-contain drop-shadow-md select-none pointer-events-none"
          style={{ opacity: opacityValue }}
        />
      </div>
    </div>
  );
};

export default CinematicBackground;
