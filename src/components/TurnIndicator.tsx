import { motion } from 'framer-motion';
import type { PlayerId } from '../game/types';

interface TurnIndicatorProps {
  currentPlayer: PlayerId;
}

export function TurnIndicator({ currentPlayer }: TurnIndicatorProps) {
  const isPlayerTurn = currentPlayer === 'P1';
  
  // Colors for the chip
  const primaryColor = isPlayerTurn ? '#3b82f6' : '#ef4444';
  const secondaryColor = isPlayerTurn ? '#1d4ed8' : '#b91c1c';
  const accentColor = isPlayerTurn ? '#60a5fa' : '#f87171';
  
  return (
    <motion.div
      animate={{
        y: isPlayerTurn ? 0 : 0, // Will be controlled by parent positioning
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="relative"
    >
      {/* Casino chip */}
      <svg width="56" height="56" viewBox="0 0 56 56">
        {/* Outer ring with notches */}
        <circle
          cx="28"
          cy="28"
          r="26"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="2"
        />
        
        {/* Edge notches (casino chip style) */}
        {[...Array(16)].map((_, i) => (
          <rect
            key={i}
            x="26"
            y="1"
            width="4"
            height="6"
            rx="1"
            fill="white"
            opacity="0.9"
            transform={`rotate(${i * 22.5} 28 28)`}
          />
        ))}
        
        {/* Inner decorative ring */}
        <circle
          cx="28"
          cy="28"
          r="20"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        
        {/* Center circle */}
        <circle
          cx="28"
          cy="28"
          r="14"
          fill={secondaryColor}
        />
        
        {/* Inner highlight */}
        <circle
          cx="28"
          cy="28"
          r="10"
          fill={primaryColor}
        />
        
        {/* Center icon */}
        <text
          x="28"
          y="33"
          textAnchor="middle"
          fontSize="14"
          fill="white"
        >
          {isPlayerTurn ? '♠' : '♦'}
        </text>
      </svg>
      
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-md -z-10"
        style={{
          background: primaryColor,
          opacity: 0.4,
        }}
      />
    </motion.div>
  );
}
