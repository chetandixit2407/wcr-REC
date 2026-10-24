import React from 'react';

export interface WhiteCollarRealtyLogoProps {
  /** Optional additional CSS classes for sizing and positioning */
  className?: string;
  /** Opacity level between 0 and 1, or preset name */
  opacity?: number;
  /** Whether to show as watermark (subtle) or full brand emblem */
  variant?: 'watermark' | 'full' | 'subtle';
  /** Accessible title for screen readers */
  title?: string;
}

/**
 * Responsive component rendering the official White Collar Realty brand emblem image
 * located at /assets/aistudio/image_79ede425.png
 */
export const WhiteCollarRealtyLogo: React.FC<WhiteCollarRealtyLogoProps> = ({
  className = 'w-full h-auto',
  opacity,
  variant = 'full',
  title = 'White Collar Realty - A Tradition Of Trust',
}) => {
  const effectiveOpacity =
    opacity !== undefined
      ? opacity
      : variant === 'watermark'
      ? 0.12
      : variant === 'subtle'
      ? 0.25
      : 1;

  return (
    <img
      src="/assets/aistudio/image_79ede425.png"
      alt={title}
      title={title}
      className={`${className} object-contain select-none pointer-events-none`}
      style={{ opacity: effectiveOpacity }}
    />
  );
};

export default WhiteCollarRealtyLogo;
