"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function ConfettiWrapper() {
  const pathname = usePathname();

  useEffect(() => {
    // Only fire confetti on homepage
    if (pathname !== '/' || typeof window === 'undefined') {
      return;
    }

    // Fire confetti after a short delay when page loads
    const timer = setTimeout(() => {
      const duration = 3000000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
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

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

