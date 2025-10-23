"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function ConfettiWrapper() {
  const pathname = usePathname();

  useEffect(() => {
    // Only fire confetti on homepage
    if (pathname !== '/' || typeof window === 'undefined') {
      // Clear any existing confetti when not on homepage
      confetti.reset();
      return;
    }

    // Fire confetti after a short delay when page loads
    const timer = setTimeout(() => {
      const duration = 9000; // 3 seconds - shorter duration prevents spillover to other pages
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Fire confetti from two positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }, 500);

    // Cleanup function - stops confetti when navigating away
    return () => {
      clearTimeout(timer);
      confetti.reset(); // Clear all confetti when leaving the page
    };
  }, [pathname]);

  return null;
}

