"use client";

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiWrapper() {
  useEffect(() => {
    // Fire confetti after a short delay when page loads
    const timer = setTimeout(() => {
      const duration = 300000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 460, ticks: 30, zIndex: 9999 };

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

    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

