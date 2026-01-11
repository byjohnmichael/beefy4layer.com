import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PlayerId } from '../game/types';
import type { ThemeColor } from '../themes/themes';
import { SYMBOLS } from '../game/engine/rules';

interface TurnIndicatorProps {
    currentPlayer: PlayerId;
    p1Color: ThemeColor; // Your theme's primary
    p2Color: ThemeColor; // Opponent's theme's secondary
    neutralColor?: ThemeColor; // Neutral color for dealing phase
    isFlipping?: boolean; // Whether coin is currently flipping
    showNeutral?: boolean; // Show neutral color (during dealing)
}

export function TurnIndicator({
    currentPlayer,
    p1Color,
    p2Color,
    neutralColor,
    isFlipping = false,
    showNeutral = false,
}: TurnIndicatorProps) {
    const isPlayerTurn = currentPlayer === 'P1';
    const [colorPhase, setColorPhase] = useState(0);

    // Cycle through colors during flip animation
    useEffect(() => {
        if (!isFlipping) {
            setColorPhase(0);
            return;
        }

        // Smoothly alternate between P1 and P2 colors
        const interval = setInterval(() => {
            setColorPhase((prev) => (prev + 1) % 2);
        }, 400); // Change color every 400ms for smoother feel

        return () => clearInterval(interval);
    }, [isFlipping]);

    // Determine which color to show
    const getActiveColor = (): ThemeColor => {
        if (showNeutral && neutralColor) {
            return neutralColor;
        }
        if (isFlipping) {
            // Alternate between P1 and P2 colors only
            return colorPhase === 0 ? p1Color : p2Color;
        }
        return isPlayerTurn ? p1Color : p2Color;
    };

    const activeColor = getActiveColor();
    const showIcon = !showNeutral && !isFlipping;

    return (
        <motion.div className="relative">
            {/* Casino chip */}
            <svg width="56" height="56" viewBox="0 0 56 56">
                {/* Outer ring with notches */}
                <motion.circle
                    cx="28"
                    cy="28"
                    r="26"
                    animate={{ fill: activeColor.solid }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
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
                <circle cx="28" cy="28" r="14" fill="rgba(0,0,0,0.2)" />

                {/* Inner highlight */}
                <motion.circle
                    cx="28"
                    cy="28"
                    r="10"
                    animate={{ fill: activeColor.solid }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />

                {/* Center icon - only show when not flipping */}
                {showIcon && (
                    <text x="28" y="33" textAnchor="middle" fontSize="14" fill="white">
                        {isPlayerTurn ? SYMBOLS.spade : SYMBOLS.diamond}
                    </text>
                )}

                {/* Star during neutral/dealing */}
                {(showNeutral || isFlipping) && (
                    <text
                        x="28"
                        y="33"
                        textAnchor="middle"
                        fontSize="14"
                        fill="white"
                        fontWeight="bold"
                    >
                        {SYMBOLS.star}
                    </text>
                )}
            </svg>

            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full blur-md -z-10"
                animate={{
                    background: activeColor.solid,
                    boxShadow: `0 0 25px ${activeColor.glow}`,
                    opacity: isFlipping ? 0.6 : 0.6,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </motion.div>
    );
}
