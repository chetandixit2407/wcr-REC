import React from 'react';
import { WhiteCollarRealtyLogo } from './WhiteCollarRealtyLogo.tsx';

interface DashboardWatermarkProps {
  opacity?: number;
  className?: string;
  standalone?: boolean;
}

/**
 * Large, semi-transparent White Collar Realty vector logo watermark.
 *
 * - Integrated with WhiteCollarRealtyLogo vector SVG component
 * - Features exact building silhouette emblem, collar/tie motif, brand name, and tagline
 * - By default, delegates to fixed CinematicBackground to guarantee strictly ONE watermark in the DOM
 * - Can be rendered directly when standalone={true}
 */
export const DashboardWatermark: React.FC<DashboardWatermarkProps> = ({
  standalone = false,
  opacity = 0.08,
  className = 'wcr-vector-watermark',
}) => {
  if (!standalone) {
    // CinematicBackground already renders the fixed, single vector watermark
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none flex items-center justify-center p-4"
    >
      <WhiteCollarRealtyLogo
        variant="watermark"
        opacity={opacity}
        className={className}
      />
    </div>
  );
};

export default DashboardWatermark;
