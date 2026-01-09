import { motion } from 'framer-motion';
import type { PlayerId } from '../game/types';
import type { ThemeColor } from '../themes/themes';

interface TurnIndicatorProps {
  currentPlayer: PlayerId;
  p1Color: ThemeColor;  // Your theme's primary
  p2Color: ThemeColor;  // Opponent's theme's secondary
}

export function TurnIndicator({ currentPlayer, p1Color, p2Color }: TurnIndicatorProps) {
  const isPlayerTurn = currentPlayer === 'P1';
  
  // Use the appropriate player's color
  const activeColor = isPlayerTurn ? p1Color : p2Color;
  
  return (
    <motion.div
      animate={{
        y: isPlayerTurn ? 0 : 0, // Controlled by parent positioning
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
          fill={activeColor.solid}
          stroke="rgba(0,0,0,0.3)"
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
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        
        {/* Center circle - darker shade */}
        <circle
          cx="28"
          cy="28"
          r="14"
          fill="rgba(0,0,0,0.2)"
        />
        
        {/* Inner highlight */}
        <circle
          cx="28"
          cy="28"
          r="10"
          fill={activeColor.solid}
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
          background: activeColor.solid,
          opacity: 0.5,
          boxShadow: `0 0 20px ${activeColor.glow}`,
        }}
      />
    </motion.div>
  );
}
