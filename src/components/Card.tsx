import { motion } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { getRankDisplay, getSuitSymbol, getBackSymbol } from '../game/engine/rules';
import type { ThemeColor } from '../themes/themes';

interface CardProps {
    card: CardType | null;
    faceUp: boolean;
    onClick?: () => void;
    isSelected?: boolean;
    isHighlighted?: boolean;
    isDimmed?: boolean;
    size?: 'normal' | 'small';
    className?: string;
    // Theme colors
    backColor?: ThemeColor; // Color for card back
    backSymbol?: string; // Symbol to show on card back (default: ♠)
    suitColors?: {
        clubsSpades: string; // Color for ♣♠
        heartsDiamonds: string; // Color for ♥♦
        joker?: string; // Color for Jokers (neutral)
    };
}

// Default colors (fallback if no theme provided)
const defaultBackColor: ThemeColor = {
    gradient: 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)',
    solid: '#2d5a7b',
    glow: 'rgba(45, 90, 123, 0.5)',
};

const defaultSuitColors = {
    clubsSpades: '#1a1a1a',
    heartsDiamonds: '#dc2626',
};

export function Card({
    card,
    faceUp,
    onClick,
    isSelected = false,
    isHighlighted = false,
    isDimmed = false,
    size = 'normal',
    className = '',
    backColor = defaultBackColor,
    backSymbol,
    suitColors = defaultSuitColors,
}: CardProps) {
    // Use VS15-safe symbol by default
    const resolvedBackSymbol = backSymbol ?? getBackSymbol('spade');
    const sizeClasses = size === 'normal' ? 'w-16 h-24 text-xl' : 'w-12 h-18 text-base';

    const baseClasses = `
    relative rounded-lg cursor-pointer
    transition-all duration-200
    ${sizeClasses}
    ${isSelected ? 'ring-3 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
    ${isHighlighted ? 'ring-2 ring-pink-400 animate-pulse' : ''}
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
                    background: backColor.gradient,
                    boxShadow: `0 4px 12px ${backColor.glow}`,
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
                  rgba(255,255,255,0.08) 4px,
                  rgba(255,255,255,0.08) 8px
                )
              `,
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl opacity-40" style={{ color: 'white' }}>
                            {resolvedBackSymbol}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Card face - determine suit color
    // Jokers have null suit and use neutral color
    const isBlackSuit = card.suit !== null && (card.suit === 'clubs' || card.suit === 'spades');
    const suitColor =
        card.rank === 'JOKER'
            ? suitColors.joker || suitColors.heartsDiamonds // Jokers use neutral color
            : isBlackSuit
              ? suitColors.clubsSpades
              : suitColors.heartsDiamonds;

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
            <div
                className="absolute top-1 left-1.5 flex flex-col items-center leading-none"
                style={{ color: suitColor }}
            >
                <span
                    className="font-bold"
                    style={{ fontSize: size === 'normal' ? '0.875rem' : '0.75rem' }}
                >
                    {rankDisplay}
                </span>
                <span style={{ fontSize: size === 'normal' ? '0.75rem' : '0.625rem' }}>
                    {suitSymbol}
                </span>
            </div>

            {/* Center suit */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: suitColor }}
            >
                {card.rank === 'JOKER' ? (
                    <span className="text-3xl">★</span>
                ) : (
                    <span className="text-2xl">{suitSymbol}</span>
                )}
            </div>

            {/* Corner rank/suit - bottom right (inverted) */}
            <div
                className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180"
                style={{ color: suitColor }}
            >
                <span
                    className="font-bold"
                    style={{ fontSize: size === 'normal' ? '0.875rem' : '0.75rem' }}
                >
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
    backColor,
    suitColors,
}: {
    card: CardType;
    isFlipped: boolean;
    onClick?: () => void;
    isSelected?: boolean;
    backColor?: ThemeColor;
    suitColors?: { clubsSpades: string; heartsDiamonds: string };
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
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                    <Card
                        card={null}
                        faceUp={false}
                        onClick={onClick}
                        isSelected={isSelected}
                        backColor={backColor}
                    />
                </div>

                {/* Front face */}
                <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <Card card={card} faceUp={true} suitColors={suitColors} />
                </div>
            </motion.div>
        </div>
    );
}
