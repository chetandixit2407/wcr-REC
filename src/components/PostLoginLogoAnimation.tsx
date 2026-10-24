import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smoothEase } from '../utils/motion.ts';

interface PostLoginLogoAnimationProps {
  onComplete: () => void;
  userName?: string;
  userRole?: string;
  durationMs?: number;
}

/**
 * High-fidelity post-login White Collar Realty logo animation overlay.
 * Inspired by Jitter "Round Logo: Sliding Name" & smooth cinematic reveal:
 *
 * 1. Clean white full-screen overlay (fixed inset-0 z-[10000])
 * 2. Smooth scale-in with gentle spring-like ease (0.75 -> 1.0)
 * 3. Subtle zoom & micro-glide (1.0 -> 1.035) with crisp proportional logo
 * 4. Refined welcome greeting & role confirmation subtitle
 * 5. Smooth exit reveal (~1.25s total) seamlessly transitioning to dashboard
 * 6. Full respect for prefers-reduced-motion accessibility
 */
export const PostLoginLogoAnimation: React.FC<PostLoginLogoAnimationProps> = ({
  onComplete,
  userName,
  userRole,
  durationMs = 1350,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check system accessibility preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Schedule exit fade and completion
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, prefersReducedMotion ? 750 : durationMs - 350);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, prefersReducedMotion ? 900 : durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [onComplete, durationMs, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="wcr-post-login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: prefersReducedMotion ? 1 : 1.02,
            transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-4 select-none pointer-events-auto overflow-hidden text-[#121316]"
          aria-live="polite"
          aria-label="Signing in to White Collar Realty"
        >
          {/* Subtle warm luxury background ambient glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-radial from-amber-100/40 via-white to-white pointer-events-none"
          />

          {/* Central Logo Container */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full px-6">
            {/* Logo Animation Block */}
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.76, y: 14 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: [0.76, 1.025, 1, 1.03],
                      y: [14, -2, 0, -1],
                    }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0.3 }
                  : {
                      duration: 1.0,
                      times: [0, 0.45, 0.75, 1],
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="relative flex items-center justify-center"
            >
              {/* Primary White Collar Realty Brand Emblem */}
              <img
                src="/assets/aistudio/image_79ede425.png"
                alt="White Collar Realty - A Tradition Of Trust"
                className="w-[82vw] sm:w-[68vw] md:w-[50vw] lg:w-[38vw] max-w-[460px] h-auto max-h-[50vh] object-contain drop-shadow-md"
              />
            </motion.div>

            {/* Personalized Role Confirmation & Welcome Badge */}
            {(userName || userRole) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0.1 : 0.4,
                  duration: 0.4,
                  ease: smoothEase,
                }}
                className="mt-6 flex flex-col items-center text-center space-y-1.5"
              >
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E5DFD4] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#121316] tracking-tight">
                    {userName ? `Welcome, ${userName}` : 'Access Verified'}
                  </span>
                  {userRole && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#121316] text-[#F5EB78] font-bold ml-1">
                      {userRole}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-[#6F727A] tracking-wide">
                  Launching Operations Console &bull; White Collar Realty
                </p>
              </motion.div>
            )}

            {/* Subtle Progress Loading Indicator Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.95,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ originX: 0.5 }}
              className="mt-6 w-36 sm:w-44 h-1 bg-[#121316]/10 rounded-full overflow-hidden"
            >
              <div className="w-full h-full bg-gradient-to-r from-[#D8BF85] via-[#121316] to-[#D8BF85] rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostLoginLogoAnimation;
