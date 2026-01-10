import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';

interface HorizontalFaceDownProps {
    cards: (CardType | null)[];
    isCurrentPlayer: boolean;
    selectedIndex: number | null;
    onSelectCard?: (index: number) => void;
    disabled?: boolean;
    hiddenIndex?: number;
}

export function HorizontalFaceDown({
    cards,
    isCurrentPlayer,
    selectedIndex,
    onSelectCard,
    disabled = false,
    hiddenIndex,
}: HorizontalFaceDownProps) {
    // Filter to only show cards that exist, but keep track of original index
    const cardsWithIndex = cards
        .map((card, index) => ({ card, originalIndex: index }))
        .filter(({ card }) => card !== null);

    return (
        <div className="flex flex-col items-center">
            <div className="flex gap-3">
                <AnimatePresence mode="popLayout">
                    {cardsWithIndex.map(({ card, originalIndex }) => {
                        const isSelected = selectedIndex === originalIndex;
                        const canSelect = isCurrentPlayer && !disabled && onSelectCard;
                        const isHidden = hiddenIndex === originalIndex;

                        return (
                            <motion.div
                                key={originalIndex}
                                data-card-index={cardsWithIndex.indexOf({ card, originalIndex })}
                                data-original-index={originalIndex}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: isHidden ? 0 : 1,
                                    scale: isHidden ? 0.8 : 1,
                                    y: isSelected ? -8 : 0,
                                }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 25,
                                }}
                            >
                                <Card
                                    card={card!}
                                    faceUp={false}
                                    onClick={
                                        canSelect && !isHidden
                                            ? () => onSelectCard(originalIndex)
                                            : undefined
                                    }
                                    isSelected={isSelected}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
