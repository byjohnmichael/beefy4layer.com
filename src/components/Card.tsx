import { motion } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { getRankDisplay, getSuitSymbol, getCardColor } from '../game/engine/rules';

interface CardProps {
  card: CardType | null;
  faceUp: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  size?: 'normal' | 'small';
  className?: string;
}

export function Card({
  card,
  faceUp,
  onClick,
  isSelected = false,
  isHighlighted = false,
  isDimmed = false,
  size = 'normal',
  className = '',
}: CardProps) {
  const sizeClasses = size === 'normal' 
    ? 'w-16 h-24 text-xl' 
    : 'w-12 h-18 text-base';

  const baseClasses = `
    relative rounded-lg cursor-pointer
    transition-all duration-200
    ${sizeClasses}
    ${isSelected ? 'ring-3 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
    ${isHighlighted ? 'ring-2 ring-emerald-400 animate-pulse' : ''}
    ${isDimmed ? 'opacity-40 cursor-not-allowed' : ''}
    ${onClick && !isDimmed ? 'hover:scale-105' : ''}
  `;

  // Card back design
  if (!faceUp || !card) {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        onClick={!isDimmed ? onClick : undefined}
        whileHover={onClick && !isDimmed ? { y: -4 } : {}}
        whileTap={onClick && !isDimmed ? { scale: 0.95 } : {}}
        style={{
          background: 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div className="absolute inset-1 rounded border border-white/20">
          <div 
            className="w-full h-full rounded"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 4px,
                  rgba(255,255,255,0.05) 4px,
                  rgba(255,255,255,0.05) 8px
                )
              `,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl opacity-30">♠</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Card face
  const color = getCardColor(card);
  const textColor = color === 'red' ? 'text-red-600' : color === 'gold' ? 'text-amber-500' : 'text-gray-900';
  const rankDisplay = getRankDisplay(card.rank);
  const suitSymbol = getSuitSymbol(card.suit);

  return (
    <motion.div
      className={`${baseClasses} bg-gradient-to-br from-[#f5f0e6] to-[#e8e0d0] ${className}`}
      onClick={!isDimmed ? onClick : undefined}
      whileHover={onClick && !isDimmed ? { y: -8 } : {}}
      whileTap={onClick && !isDimmed ? { scale: 0.95 } : {}}
      style={{
        boxShadow: isSelected 
          ? '0 8px 24px rgba(212, 168, 75, 0.5)' 
          : '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Corner rank/suit - top left */}
      <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${textColor}`}>
        <span className="font-bold" style={{ fontSize: size === 'normal' ? '0.875rem' : '0.75rem' }}>
          {rankDisplay}
        </span>
        <span style={{ fontSize: size === 'normal' ? '0.75rem' : '0.625rem' }}>
          {suitSymbol}
        </span>
      </div>

      {/* Center suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${textColor}`}>
        {card.rank === 'JOKER' ? (
          <span className="text-3xl">★</span>
        ) : (
          <span className="text-2xl">{suitSymbol}</span>
        )}
      </div>

      {/* Corner rank/suit - bottom right (inverted) */}
      <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 ${textColor}`}>
        <span className="font-bold" style={{ fontSize: size === 'normal' ? '0.875rem' : '0.75rem' }}>
          {rankDisplay}
        </span>
        <span style={{ fontSize: size === 'normal' ? '0.75rem' : '0.625rem' }}>
          {suitSymbol}
        </span>
      </div>
    </motion.div>
  );
}

// Animated flip card for revealing face-down cards
export function FlipCard({
  card,
  isFlipped,
  onClick,
  isSelected = false,
}: {
  card: CardType;
  isFlipped: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <div className="relative w-16 h-24" style={{ perspective: '1000px' }}>
      <motion.div
        className="w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back face */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Card card={null} faceUp={false} onClick={onClick} isSelected={isSelected} />
        </div>

        {/* Front face */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Card card={card} faceUp={true} />
        </div>
      </motion.div>
    </div>
  );
}

