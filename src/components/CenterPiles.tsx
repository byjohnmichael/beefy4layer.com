import { motion } from 'framer-motion';
import { SYMBOLS } from '../game/engine/rules';
import type { Card as CardType } from '../game/types';
import { Pile } from './Pile';
import type { MutableRefObject, RefObject } from 'react';

interface CenterPilesProps {
    piles: CardType[][];
    deckCount: number;
    legalPileIndices: number[];
    hasSelection: boolean;
    onSelectPile: (index: number) => void;
    onDrawFromDeck: () => void;
    canDraw: boolean;
    pileRefs?: MutableRefObject<(HTMLDivElement | null)[]>;
    deckRef?: RefObject<HTMLDivElement | null>;
}

export function CenterPiles({
    piles,
    deckCount,
    legalPileIndices,
    hasSelection,
    onSelectPile,
    onDrawFromDeck,
    canDraw,
    pileRefs,
    deckRef,
}: CenterPilesProps) {
    return (
        <div className="relative flex items-center justify-center">
            {/* Deck positioned to the left of center piles */}
            <motion.div
                ref={deckRef}
                className={`absolute right-full mr-8 flex flex-col items-center ${canDraw ? 'cursor-pointer' : ''}`}
                whileHover={canDraw ? { scale: 1.05 } : {}}
                whileTap={canDraw ? { scale: 0.95 } : {}}
                onClick={canDraw ? onDrawFromDeck : undefined}
            >
                <div className="relative">
                    {/* Stack effect */}
                    {deckCount > 0 && (
                        <>
                            <div
                                className="absolute w-16 h-24 rounded-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #1a3d5c 0%, #0f2419 100%)',
                                    transform: 'translate(3px, 3px)',
                                    opacity: 0.5,
                                }}
                            />
                            <div
                                className="absolute w-16 h-24 rounded-lg"
                                style={{
                                    background: 'linear-gradient(135deg, #1a3d5c 0%, #0f2419 100%)',
                                    transform: 'translate(1.5px, 1.5px)',
                                    opacity: 0.7,
                                }}
                            />
                        </>
                    )}

                    <motion.div
                        className={`relative w-16 h-24 rounded-lg flex items-center justify-center ${
                            canDraw ? 'ring-2 ring-emerald-400/60' : ''
                        }`}
                        style={{
                            background:
                                deckCount > 0
                                    ? 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)'
                                    : 'transparent',
                            border: deckCount === 0 ? '2px dashed #4a5568' : 'none',
                            boxShadow: deckCount > 0 ? '0 4px 12px rgba(0,0,0,0.4)' : 'none',
                        }}
                    >
                        {deckCount > 0 ? (
                            <>
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
                                </div>
                                <span className="text-2xl opacity-30 z-10">{SYMBOLS.spade}</span>
                            </>
                        ) : (
                            <span className="text-gray-500 text-xs">Empty</span>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* Center piles - centered */}
            <div className="flex gap-4">
                {piles.map((pile, index) => {
                    const isLegal = legalPileIndices.includes(index);
                    const isDimmed = hasSelection && !isLegal;

                    return (
                        <div
                            key={index}
                            ref={
                                pileRefs
                                    ? (el) => {
                                          pileRefs.current[index] = el;
                                      }
                                    : undefined
                            }
                        >
                            <Pile
                                cards={pile}
                                onClick={
                                    hasSelection && isLegal ? () => onSelectPile(index) : undefined
                                }
                                isHighlighted={hasSelection && isLegal}
                                isDimmed={isDimmed}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
