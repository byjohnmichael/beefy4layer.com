import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerId } from '../game/types';

interface WinOverlayProps {
    winner: PlayerId | null;
    onPlayAgain: () => void;
    onExit?: () => void;
}

export function WinOverlay({ winner, onPlayAgain, onExit }: WinOverlayProps) {
    return (
        <AnimatePresence>
            {winner && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-yellow-500/30"
                        style={{
                            boxShadow: '0 0 60px rgba(212, 168, 75, 0.3)',
                        }}
                    >
                        {/* Crown decoration */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                            className="text-6xl text-center mb-4"
                        >
                            👑
                        </motion.div>

                        {/* Winner text */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-bold text-center mb-6"
                            style={{
                                background:
                                    'linear-gradient(135deg, #d4a84b 0%, #f5d485 50%, #d4a84b 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 30px rgba(212, 168, 75, 0.5)',
                            }}
                        >
                            {winner === 'P1' ? 'Player 1' : 'Player 2'} Wins!
                        </motion.h1>

                        {/* Celebratory sparkles */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl text-center mb-8"
                        >
                            ✨ 🎉 ✨
                        </motion.div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onPlayAgain}
                                className="w-full py-4 px-8 rounded-xl font-bold text-lg transition-all text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                                }}
                            >
                                Play Again
                            </motion.button>

                            {onExit && (
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onExit}
                                    className="w-full py-3 px-8 rounded-xl font-bold text-base transition-all text-gray-300 border border-gray-600 hover:border-gray-500"
                                    style={{
                                        background: 'transparent',
                                    }}
                                >
                                    Main Menu
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
