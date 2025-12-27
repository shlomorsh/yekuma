"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function GunCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Check if device is desktop
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768 && !('ontouchstart' in window));
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Desktop: Track mouse - throttled with requestAnimationFrame
    if (isDesktop) {
      let rafId: number | null = null;
      const handleMouseMove = (e: MouseEvent) => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            rafId = null;
          });
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', checkDevice);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    } else {
      // Mobile: Handle touch - track continuously during drag
      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
          setTouchPosition({
            x: touch.clientX,
            y: touch.clientY,
            visible: true,
          });
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
          setTouchPosition({
            x: touch.clientX,
            y: touch.clientY,
            visible: true,
          });
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        if (touch) {
          setTouchPosition({
            x: touch.clientX,
            y: touch.clientY,
            visible: true,
          });
          
          // Hide after animation
          setTimeout(() => {
            setTouchPosition(prev => prev ? { ...prev, visible: false } : null);
          }, 300);
        }
      };
      
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', checkDevice);
      };
    }
  }, [isDesktop]);

  // Also track mouse on mobile devices that support both (like tablets) - throttled
  useEffect(() => {
    if (!isDesktop) {
      let rafId: number | null = null;
      const handleMouseMove = (e: MouseEvent) => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            rafId = null;
          });
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [isDesktop]);

  // Use touch position if available, otherwise use mouse position
  const position = touchPosition?.visible ? touchPosition : mousePosition;

  if (!isDesktop && !touchPosition?.visible && mousePosition.x === 0 && mousePosition.y === 0) {
    return null;
  }

  return (
    <>
      <div
        className="gun-cursor"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          // Position the gun so the muzzle points at cursor position
          // After flip, the muzzle is on the left side, so we translate right to align it
          // translate Y: -50% centers it, +19px moves it down by ~0.5cm
          transform: 'translate(30px, calc(-50% + 19px)) scaleX(-1)', // Flip horizontally, muzzle on left after flip
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: touchPosition && !touchPosition.visible ? 0 : 1,
          transition: isDesktop ? 'none' : (touchPosition?.visible ? 'none' : 'opacity 0.3s ease-out'),
        }}
      >
        {/* Gun image - flipped horizontally to point left to right */}
        <Image 
          src="/assets/gun-cursor.png" 
          alt="gun cursor" 
          width={80} 
          height={80} 
          priority
          style={{
            display: 'block',
          }}
        />
      </div>
      <style jsx>{`
        .gun-cursor {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.8));
        }
      `}</style>
    </>
  );
}
