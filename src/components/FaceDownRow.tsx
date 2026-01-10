import { motion } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';

interface FaceDownRowProps {
    cards: (CardType | null)[];
    isCurrentPlayer: boolean;
    selectedIndex: number | null;
    onSelectCard: (index: number) => void;
    playerLabel: string;
}

export function FaceDownRow({
    cards,
    isCurrentPlayer,
    selectedIndex,
    onSelectCard,
    playerLabel,
}: FaceDownRowProps) {
    const remainingCount = cards.filter((c) => c !== null).length;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold text-gray-400">
                {playerLabel}'s Face-Down ({remainingCount}/4)
            </div>

            <div className="flex flex-col gap-1">
                {cards.map((card, index) => {
                    const isSelected = selectedIndex === index;
                    const isEmpty = card === null;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {isEmpty ? (
                                <div
                                    className="w-16 h-24 rounded-lg border border-dashed border-gray-600/50 flex items-center justify-center"
                                    style={{ background: 'rgba(0,0,0,0.1)' }}
                                >
                                    <span className="text-gray-600 text-xs">✓</span>
                                </div>
                            ) : (
                                <Card
                                    card={card}
                                    faceUp={false}
                                    onClick={
                                        isCurrentPlayer ? () => onSelectCard(index) : undefined
                                    }
                                    isSelected={isSelected}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
