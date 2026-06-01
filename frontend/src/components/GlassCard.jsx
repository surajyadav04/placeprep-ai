import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  glowColor = 'indigo',
  delay = 0,
  tilt = true,
  style = {},
  onClick,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  // Map to soft pastel accents
  const pastelMap = {
    indigo: '#E2E8F0', // Muted Sage
    violet: '#E9D8FD', // Soft Lavender
    cyan: '#C6F6D5',   // Mint
    magenta: '#FED7D7',// Soft Coral
    amber: '#FEEBC8',  // Soft Amber
  };

  const activeColor = pastelMap[glowColor] || pastelMap.indigo;

  const handleMouseMove = (e) => {
    if (!tilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // Heavier, subtler tilt
    const rotateX = (y - 0.5) * -3;
    const rotateY = (x - 0.5) * 3;
    setTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg)');
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.32, 0.72, 0, 1], // Custom cubic bezier
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`glass-panel relative overflow-hidden ${className}`}
      style={{
        transform,
        transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Soft Ambient Follow Glow (Outer Shell) */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, ${activeColor} 0%, transparent 60%)`,
          opacity: 0.3,
        }}
      />
      
      {/* Inner Core (The Double Bezel) */}
      <div className="glass-card relative h-full w-full p-6 z-10">
        {children}
      </div>
    </motion.div>
  );
}
