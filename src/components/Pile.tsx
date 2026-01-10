import { motion } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';

interface PileProps {
    cards: CardType[];
    onClick?: () => void;
    isHighlighted?: boolean;
    isDimmed?: boolean;
}

export function Pile({ cards, onClick, isHighlighted = false, isDimmed = false }: PileProps) {
    const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

    return (
        <motion.div
            className={`relative ${isDimmed ? 'pointer-events-none' : ''}`}
            whileHover={onClick && !isDimmed ? { scale: 1.05 } : {}}
        >
            {/* Top card */}
            {topCard ? (
                <Card
                    card={topCard}
                    faceUp={true}
                    onClick={onClick}
                    isHighlighted={isHighlighted}
                    isDimmed={isDimmed}
                />
            ) : (
                <div
                    className={`w-16 h-24 rounded-lg border-2 border-dashed ${
                        isHighlighted ? 'border-emerald-400' : 'border-gray-600'
                    } flex items-center justify-center text-gray-500`}
                >
                    <span className="text-xs">Empty</span>
                </div>
            )}
        </motion.div>
    );
}
