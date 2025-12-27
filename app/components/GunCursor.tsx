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

    // Desktop: Track mouse
    if (isDesktop) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', checkDevice);
      };
    } else {
      // Mobile: Handle touch
      const handleTouch = (e: TouchEvent) => {
        const touch = e.touches[0] || e.changedTouches[0];
        if (touch) {
          setTouchPosition({
            x: touch.clientX,
            y: touch.clientY,
            visible: true,
          });
          
          // Hide after animation
          setTimeout(() => {
            setTouchPosition(prev => prev ? { ...prev, visible: false } : null);
          }, 700);
        }
      };
      
      window.addEventListener('touchstart', handleTouch);
      window.addEventListener('touchend', handleTouch);
      
      return () => {
        window.removeEventListener('touchstart', handleTouch);
        window.removeEventListener('touchend', handleTouch);
        window.removeEventListener('resize', checkDevice);
      };
    }
  }, [isDesktop]);

  if (!isDesktop && !touchPosition?.visible) {
    return null;
  }

  const position = isDesktop ? mousePosition : (touchPosition || { x: 0, y: 0 });

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
          transition: isDesktop ? 'none' : 'opacity 0.7s ease-out',
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

