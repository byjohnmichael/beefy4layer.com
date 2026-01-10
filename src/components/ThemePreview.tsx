import { motion } from 'framer-motion';
import type { CardTheme } from '../themes/themes';

interface ThemePreviewProps {
    theme: CardTheme;
}

// Mini card component for face-down preview
function FaceDownCard({ gradient, delay = 0 }: { gradient: string; delay?: number }) {
    return (
        <motion.div
            className="w-14 h-20 rounded-lg relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            style={{
                background: gradient,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {/* Diagonal stripes pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.3) 4px,
            rgba(255,255,255,0.3) 8px
          )`,
                }}
            />
            {/* Center spade icon */}
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xl">
                ♠
            </div>
        </motion.div>
    );
}

// Mini card component for face-up preview
function FaceUpCard({
    rank,
    suit,
    suitColor,
    delay = 0,
    isJoker = false,
    jokerColor,
}: {
    rank: string;
    suit: string;
    suitColor: string;
    delay?: number;
    isJoker?: boolean;
    jokerColor?: string;
}) {
    return (
        <motion.div
            className="w-14 h-20 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {isJoker ? (
                // Joker card
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl" style={{ color: jokerColor }}>
                        ★
                    </span>
                    <span
                        className="text-[8px] font-bold tracking-tight"
                        style={{ color: jokerColor }}
                    >
                        JOKER
                    </span>
                </div>
            ) : (
                // Regular card
                <>
                    {/* Top left rank/suit */}
                    <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
                        <span className="text-xs font-bold" style={{ color: suitColor }}>
                            {rank}
                        </span>
                        <span className="text-sm -mt-0.5" style={{ color: suitColor }}>
                            {suit}
                        </span>
                    </div>
                    {/* Center suit */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl" style={{ color: suitColor }}>
                            {suit}
                        </span>
                    </div>
                    {/* Bottom right rank/suit (rotated) */}
                    <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
                        <span className="text-xs font-bold" style={{ color: suitColor }}>
                            {rank}
                        </span>
                        <span className="text-sm -mt-0.5" style={{ color: suitColor }}>
                            {suit}
                        </span>
                    </div>
                </>
            )}
        </motion.div>
    );
}

// Casino chip preview
function ChipPreview({ color, delay = 0 }: { color: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
        >
            <svg width="40" height="40" viewBox="0 0 56 56">
                {/* Outer ring */}
                <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill={color}
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
                <circle cx="28" cy="28" r="7" fill={color} />
            </svg>
        </motion.div>
    );
}

export function ThemePreview({ theme }: ThemePreviewProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* Face Down Cards Section */}
            <div>
                <div className="flex gap-12 mb-3">
                    <span className="text-xs text-white/60 uppercase tracking-wider w-14 text-center">
                        Primary
                    </span>
                    <span className="text-xs text-white/60 uppercase tracking-wider w-14 text-center">
                        Secondary
                    </span>
                    <span className="text-xs text-white/60 uppercase tracking-wider w-14 text-center">
                        Neutral
                    </span>
                </div>
                {/* Row 1 */}
                <div className="flex gap-12 mb-3">
                    <FaceDownCard gradient={theme.primary.gradient} delay={0} />
                    <FaceDownCard gradient={theme.secondary.gradient} delay={0.1} />
                    <FaceDownCard gradient={theme.neutral.gradient} delay={0.2} />
                </div>
                {/* Row 2 */}
                <div className="flex gap-12">
                    <FaceDownCard gradient={theme.primary.gradient} delay={0.15} />
                    <FaceDownCard gradient={theme.secondary.gradient} delay={0.25} />
                    <FaceDownCard gradient={theme.neutral.gradient} delay={0.35} />
                </div>
            </div>

            {/* Face Up Cards Section */}
            <div>
                <div className="text-xs text-white/60 uppercase tracking-wider mb-3 text-center">
                    Face Up Cards
                </div>
                <div className="flex gap-6 justify-center">
                    <FaceUpCard rank="6" suit="♠" suitColor={theme.primary.solid} delay={0.3} />
                    <FaceUpCard rank="7" suit="♥" suitColor={theme.secondary.solid} delay={0.4} />
                    <FaceUpCard
                        rank=""
                        suit=""
                        suitColor=""
                        isJoker
                        jokerColor={theme.neutral.solid}
                        delay={0.5}
                    />
                </div>
            </div>

            {/* Chips Section */}
            <div>
                <div className="text-xs text-white/60 uppercase tracking-wider mb-3 text-center">
                    Turn Chips
                </div>
                <div className="flex gap-8 justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.primary.solid} delay={0.5} />
                        <span className="text-[10px] text-white/40">You</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.secondary.solid} delay={0.6} />
                        <span className="text-[10px] text-white/40">Opponent</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <ChipPreview color={theme.neutral.solid} delay={0.7} />
                        <span className="text-[10px] text-white/40">Neutral</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
