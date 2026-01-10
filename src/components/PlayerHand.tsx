import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';
import { getLegalPiles } from '../game/engine/rules';

interface PlayerHandProps {
    cards: CardType[];
    selectedIndex: number | null;
    centerPiles: CardType[][];
    onSelectCard: (index: number) => void;
    disabled?: boolean;
    hiddenIndex?: number;
}

export function PlayerHand({
    cards,
    selectedIndex,
    centerPiles,
    onSelectCard,
    disabled = false,
    hiddenIndex,
}: PlayerHandProps) {
    const cardCount = cards.length;

    // Calculate arc positions for cards
    const getCardStyle = (index: number, total: number) => {
        if (total === 0) return {};

        const maxRotation = Math.min(total * 3, 25);
        const maxLift = Math.min(total * 2, 15);

        const normalizedPos = total === 1 ? 0 : (index / (total - 1)) * 2 - 1;

        const rotation = normalizedPos * maxRotation;
        const lift = -Math.abs(normalizedPos) * maxLift + maxLift;
        const horizontalSpread = normalizedPos * Math.min(total * 15, 120);

        return {
            transform: `translateX(${horizontalSpread}px) translateY(${-lift}px) rotate(${rotation}deg)`,
            zIndex: index,
        };
    };

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative flex items-end justify-center"
                style={{
                    minHeight: '140px',
                    minWidth: '300px',
                }}
            >
                <AnimatePresence mode="popLayout">
                    {cards.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-gray-500 text-sm absolute bottom-12"
                        >
                            No cards in hand
                        </motion.div>
                    ) : (
                        cards.map((card, index) => {
                            const hasLegalPlay = getLegalPiles(card, centerPiles).length > 0;
                            const isSelectable = !disabled && hasLegalPlay;
                            const isSelected = selectedIndex === index;
                            const style = getCardStyle(index, cardCount);
                            const isHidden = hiddenIndex === index;

                            return (
                                <motion.div
                                    key={card.id}
                                    data-card-index={index}
                                    layout
                                    initial={{ scale: 0, opacity: 0, y: 50 }}
                                    animate={{
                                        scale: isHidden ? 0 : 1,
                                        opacity: isHidden ? 0 : 1,
                                        y: isSelected ? -20 : 0,
                                        ...style,
                                    }}
                                    exit={{ scale: 0, opacity: 0, y: 50 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                    className="absolute bottom-0"
                                    style={{
                                        transformOrigin: 'bottom center',
                                        zIndex: isSelected ? 100 : style.zIndex,
                                    }}
                                >
                                    <Card
                                        card={card}
                                        faceUp={true}
                                        onClick={
                                            isSelectable && !isHidden
                                                ? () => onSelectCard(index)
                                                : undefined
                                        }
                                        isSelected={isSelected}
                                        isDimmed={!disabled && !hasLegalPlay}
                                    />
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
