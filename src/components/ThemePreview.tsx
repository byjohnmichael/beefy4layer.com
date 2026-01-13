import { motion } from 'framer-motion';
import type { CardTheme } from '../themes/themes';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';

interface ThemePreviewProps {
    theme: CardTheme;
}

// Parse gradient string to extract colors for SVG
function parseGradient(gradient: string): { start: string; end: string } {
    const colorMatch = gradient.match(/#[a-fA-F0-9]{6}/g);
    if (colorMatch && colorMatch.length >= 2) {
        return { start: colorMatch[0], end: colorMatch[1] };
    }
    return { start: '#2d5a7b', end: '#1a3d5c' };
}

// Casino chip preview
function ChipPreview({
    color,
    gradient,
    delay = 0,
}: {
    color: string;
    gradient?: string;
    delay?: number;
}) {
    const gradientColors = gradient ? parseGradient(gradient) : null;
    const gradientId = `chip-gradient-${delay}`;
    const fillValue = gradientColors ? `url(#${gradientId})` : color;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
        >
            <svg width="40" height="40" viewBox="0 0 56 56">
                {/* Gradient definition */}
                {gradientColors && (
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={gradientColors.start} />
                            <stop offset="100%" stopColor={gradientColors.end} />
                        </linearGradient>
                    </defs>
                )}
                {/* Outer ring */}
                <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill={fillValue}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                />
                {/* Edge notches */}
                {[...Array(12)].map((_, i) => (
                    <rect
                        key={i}
                        x="26"
                        y="2"
                        width="4"
                        height="5"
                        rx="1"
                        fill="white"
                        opacity="0.9"
                        transform={`rotate(${i * 30} 28 28)`}
                    />
                ))}
                {/* Inner ring */}
                <circle
                    cx="28"
                    cy="28"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                />
                {/* Center */}
                <circle cx="28" cy="28" r="10" fill="rgba(0,0,0,0.15)" />
                <circle cx="28" cy="28" r="7" fill={fillValue} />
            </svg>
        </motion.div>
    );
}

// Sample cards for preview
const sampleCards: { faceUp: CardType[]; faceDown: CardType } = {
    faceUp: [
        { id: 'preview-spade-6', rank: '6', suit: 'spades' },
        { id: 'preview-heart-7', rank: '7', suit: 'hearts' },
        { id: 'preview-joker', rank: 'JOKER', suit: null },
    ],
    faceDown: { id: 'preview-back', rank: 'A', suit: 'spades' },
};

export function ThemePreview({ theme }: ThemePreviewProps) {
    const suitColors = {
        clubsSpades: theme.primary.solid,
        heartsDiamonds: theme.secondary.solid,
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Face Down Cards Section */}
            <div>
                <div className="flex gap-12 mb-3">
                    <span className="text-xs text-white/60 uppercase tracking-wider w-16 text-center">
                        Primary
                    </span>
                    <span className="text-xs text-white/60 uppercase tracking-wider w-16 text-center">
                        Secondary
                    </span>
                    <span className="text-xs text-white/60 uppercase tracking-wider w-16 text-center">
                        Neutral
                    </span>
                </div>
                {/* Row 1 */}
                <div className="flex gap-12 mb-3">
                    <motion.div
                        key={`${theme.id}-primary`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceDown}
                            faceUp={false}
                            backColor={theme.primary}
                        />
                    </motion.div>
                    <motion.div
                        key={`${theme.id}-secondary`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceDown}
                            faceUp={false}
                            backColor={theme.secondary}
                        />
                    </motion.div>
                    <motion.div
                        key={`${theme.id}-neutral`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceDown}
                            faceUp={false}
                            backColor={theme.neutral}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Face Up Cards Section */}
            <div>
                <div className="text-xs text-white/60 uppercase tracking-wider mb-3 text-center">
                    Face Up Cards
                </div>
                <div className="flex gap-6 justify-center">
                    <motion.div
                        key={`${theme.id}-spade`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceUp[0]}
                            faceUp={true}
                            suitColors={suitColors}
                            jokerColor={theme.neutral}
                            darkFace={theme.darkCardFace}
                        />
                    </motion.div>
                    <motion.div
                        key={`${theme.id}-heart`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceUp[1]}
                            faceUp={true}
                            suitColors={suitColors}
                            jokerColor={theme.neutral}
                            darkFace={theme.darkCardFace}
                        />
                    </motion.div>
                    <motion.div
                        key={`${theme.id}-joker`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                    >
                        <Card
                            card={sampleCards.faceUp[2]}
                            faceUp={true}
                            suitColors={suitColors}
                            jokerColor={theme.neutral}
                            darkFace={theme.darkCardFace}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Chips Section */}
            <div>
                <div className="text-xs text-white/60 uppercase tracking-wider mb-3 text-center">
                    Turn Chips
                </div>
                <div className="flex gap-8 justify-center">
                    <div key={`${theme.id}-chip-primary`} className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.primary.solid} delay={0.5} />
                        <span className="text-[10px] text-white/40">You</span>
                    </div>
                    <div key={`${theme.id}-chip-secondary`} className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.secondary.solid} delay={0.6} />
                        <span className="text-[10px] text-white/40">Opponent</span>
                    </div>
                    <div key={`${theme.id}-chip-neutral`} className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.neutral.solid} gradient={theme.neutral.gradient} delay={0.7} />
                        <span className="text-[10px] text-white/40">Neutral</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
