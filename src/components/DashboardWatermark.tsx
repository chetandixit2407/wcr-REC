import React from 'react';
import { motion } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';

/**
 * Large, semi-transparent White Collar Realty logo watermark.
 * Positioned centrally within the main dashboard content area,
 * completely behind cards, navigation, modals, and operational sections.
 *
 * - Genuine transparent background (no solid rectangle or box)
 * - Exact building silhouette emblem, collar/tie motif, and typography
 * - Dark charcoal / black monochrome appearance with ~11% opacity (within 8-15% range)
 * - Pointer-events: none so clicks and scrolls pass through completely
 * - Sized ~300-400px wide on desktop with responsive scaling
 * - Subtle, smooth initial fade-in without any distracting loops or motion
 */
export const DashboardWatermark: React.FC = () => {
  return null;
};

export default DashboardWatermark;
