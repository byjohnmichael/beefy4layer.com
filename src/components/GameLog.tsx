import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameLogProps {
    logs: string[];
}

export function GameLog({ logs }: GameLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Game Log
            </div>

            <div
                ref={scrollRef}
                className="h-32 overflow-y-auto rounded-lg bg-black/30 border border-gray-700/50 p-3"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d4a84b #0f2419',
                }}
            >
                <AnimatePresence mode="popLayout">
                    {logs.map((log, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm py-1 border-b border-gray-700/30 last:border-0 ${
                                log.includes('wins')
                                    ? 'text-yellow-400 font-bold'
                                    : log.includes('success')
                                      ? 'text-emerald-400'
                                      : log.includes('fail')
                                        ? 'text-red-400'
                                        : log.includes('turn')
                                          ? 'text-blue-400'
                                          : log.includes('refreshed')
                                            ? 'text-purple-400'
                                            : 'text-gray-300'
                            }`}
                        >
                            <span className="text-gray-500 mr-2">{index + 1}.</span>
                            {log}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
