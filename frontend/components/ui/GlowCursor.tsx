"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Gooey Circle Cursor Effect - Yellow Theme
 * Creates a custom cursor with trailing gooey blobs and pulsating yellow glow
 */
export function GlowCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setMousePos(newPos);

      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        window.getComputedStyle(target).cursor === 'pointer';
      
      setIsPointer(isClickable);

      // Add to trail
      setTrail((prev) => {
        const newTrail = [...prev, { ...newPos, id: trailId++ }];
        // Keep only last 8 trail points
        return newTrail.slice(-8);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Clear old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail((prev) => prev.slice(1));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* SVG Filter for Gooey Effect */}
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <defs>
          <filter id="gooey-cursor">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Cursor Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
          filter: 'url(#gooey-cursor)',
        }}
      >
        {/* Main Cursor Circle with Pulsating Glow */}
        <motion.div
          className="cursor-main"
          animate={{
            x: mousePos.x - 12,
            y: mousePos.y - 12,
            scale: isPointer ? 1.5 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 28,
            mass: 0.5,
          }}
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isPointer
              ? 'linear-gradient(135deg, #FDE047 0%, #FACC15 50%, #EAB308 100%)'
              : 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
            boxShadow: isPointer
              ? '0 0 25px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.5)'
              : '0 0 20px rgba(250, 204, 21, 0.6), 0 0 30px rgba(250, 204, 21, 0.3)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />

        {/* Outer Ring */}
        <motion.div
          className="cursor-ring"
          animate={{
            x: mousePos.x - 20,
            y: mousePos.y - 20,
            scale: isPointer ? 1.2 : 1,
            opacity: isPointer ? 0.8 : 0.5,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            mass: 0.8,
          }}
          style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(250, 204, 21, 0.6)',
            background: 'transparent',
            boxShadow: '0 0 15px rgba(250, 204, 21, 0.4)',
          }}
        />

        {/* Trail Blobs */}
        {trail.map((point, index) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              x: point.x - 8,
              y: point.y - 8,
              opacity: (index / trail.length) * 0.6,
              scale: (index / trail.length) * 0.8,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
              boxShadow: '0 0 10px rgba(250, 204, 21, 0.4)',
            }}
          />
        ))}
      </div>

      {/* Hide default cursor + Pulsating glow animation */}
      <style>{`
        * {
          cursor: none !important;
        }
        
        /* Keep text cursor for inputs */
        input, textarea {
          cursor: text !important;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 0 20px rgba(250, 204, 21, 0.6), 
              0 0 30px rgba(250, 204, 21, 0.3);
          }
          50% {
            box-shadow: 
              0 0 30px rgba(250, 204, 21, 0.9), 
              0 0 50px rgba(250, 204, 21, 0.5),
              0 0 70px rgba(250, 204, 21, 0.2);
          }
        }
      `}</style>
    </>
  );
}
