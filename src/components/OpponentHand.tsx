import { motion } from 'framer-motion';

interface OpponentHandProps {
    cardCount: number;
}

export function OpponentHand({ cardCount }: OpponentHandProps) {
    // Create array of card indices for rendering
    const cards = Array.from({ length: cardCount }, (_, i) => i);

    return (
        <div className="flex flex-col items-center">
            <div className="relative h-16 flex items-center justify-center">
                {cardCount === 0 ? (
                    <div className="h-14" />
                ) : (
                    <div
                        className="relative"
                        style={{ width: `${Math.min(cardCount * 20 + 40, 200)}px` }}
                    >
                        {cards.map((i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, y: -20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0, y: -20 }}
                                transition={{ delay: i * 0.05 }}
                                className="absolute w-10 h-14 rounded-md"
                                style={{
                                    left: `${i * 18}px`,
                                    zIndex: i,
                                    background: 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <div className="absolute inset-0.5 rounded-sm border border-white/10">
                                    <div
                                        className="w-full h-full rounded-sm opacity-50"
                                        style={{
                                            backgroundImage: `
                        repeating-linear-gradient(
                          45deg,
                          transparent,
                          transparent 2px,
                          rgba(255,255,255,0.03) 2px,
                          rgba(255,255,255,0.03) 4px
                        )
                      `,
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
