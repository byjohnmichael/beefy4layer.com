import type { Room } from './lib/multiplayer';
import { useState, useCallback, useEffect, useRef } from 'react';
import { TitleScreen } from './screens/TitleScreen';
import { Game, type GameMode } from './screens/Game';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getThemeById, type CardTheme } from './themes/themes';
import { findActiveGame, getOrCreateClientId } from './lib/multiplayer';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Get saved theme from localStorage or default to 'taco-bell'
function getSavedTheme(): CardTheme {
    const savedThemeId = localStorage.getItem('beeft_theme') || 'taco-bell';
    return getThemeById(savedThemeId);
}

// Background music volume (0.0 to 1.0)
const MUSIC_VOLUME = 0.05;

type Screen = 'title' | 'game';

// Main application entry point, index.html calls main.tsx which calls App.tsx
function App() {

    // Screen state
    const [currentScreen, setCurrentScreen] = useState<Screen>('title');

    // User info state
    const [gameMode, setGameMode] = useState<GameMode>('singleplayer');
    const [myTheme, setMyTheme] = useState<CardTheme>(getSavedTheme);

    // Multiplayer info state
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [isHost, setIsHost] = useState(false);

    // Rejoin popup state
    const [pendingRejoinRoom, setPendingRejoinRoom] = useState<Room | null>(null);
    const [isCheckingRejoin, setIsCheckingRejoin] = useState(true);

    // Background music ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize background music
    useEffect(() => {
        const audio = new Audio('/audio/background-music.mp3');
        audio.loop = true;
        audio.volume = MUSIC_VOLUME;
        audioRef.current = audio;

        // Try to play immediately (may be blocked by browser)
        audio.play().catch(() => {
            // Autoplay blocked - will start on first user interaction
        });

        // Start music on first user interaction if autoplay was blocked
        const startMusic = () => {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
            document.removeEventListener('touchstart', startMusic);
        };

        document.addEventListener('click', startMusic);
        document.addEventListener('keydown', startMusic);
        document.addEventListener('touchstart', startMusic);

        return () => {
            audio.pause();
            audio.src = '';
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
            document.removeEventListener('touchstart', startMusic);
        };
    }, []);

    // Check for active game on mount
    useEffect(() => {
        async function checkForActiveGame() {
            const activeRoom = await findActiveGame();
            if (activeRoom) {
                setPendingRejoinRoom(activeRoom);
            }
            setIsCheckingRejoin(false);
        }
        checkForActiveGame();
    }, []);

    // Handle rejoin
    const handleRejoin = () => {
        if (!pendingRejoinRoom) return;

        const clientId = getOrCreateClientId();
        const host = pendingRejoinRoom.host_id === clientId;

        setGameMode('multiplayer');
        setCurrentRoom(pendingRejoinRoom);
        setIsHost(host);
        setCurrentScreen('game');
        setPendingRejoinRoom(null);
    };

    // Handle cancel rejoin
    const handleCancelRejoin = () => {
        setPendingRejoinRoom(null);
    };

    // Set state to start singleplayer mode
    const handleStartSingleplayer = () => {
        setGameMode('singleplayer');
        setCurrentRoom(null);
        setCurrentScreen('game');
    };

    // Set state to start multiplayer mode
    const handleStartMultiplayer = (room: Room, host: boolean) => {
        setGameMode('multiplayer');
        setCurrentRoom(room);
        setIsHost(host);
        setCurrentScreen('game');
    };

    // Set state to exit to title screen
    const handleExitToTitle = () => {
        setCurrentScreen('title');
        setCurrentRoom(null);
    };

    // To reset the game, increment the key to force remount
    const [gameKey, setGameKey] = useState(0);

    // Set state to reset game
    const handleGameReset = useCallback(() => {
        setGameKey((k) => k + 1);
    }, []);

    // Set state to change theme (persists to localStorage)
    const handleThemeChange = (theme: CardTheme) => {
        setMyTheme(theme);
        localStorage.setItem('beeft_theme', theme.id);
    };

    // Don't render until we've checked for active games
    if (isCheckingRejoin) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{
                    background:
                        'radial-gradient(ellipse at center, #1a4a3a 0%, #0f2d23 50%, #0a1f18 100%)',
                }}
            >
                <div className="text-white/50 text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0"
            style={{
                background:
                    'radial-gradient(ellipse at center, #1a4a3a 0%, #0f2d23 50%, #0a1f18 100%)',
            }}
        >
            {/* Rejoin Popup */}
            <AnimatePresence>
                {pendingRejoinRoom && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            className="relative z-10 p-6 rounded-2xl max-w-sm mx-4"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                background: 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <h2 className="text-xl font-bold text-white mb-2">
                                Game in Progress
                            </h2>
                            <p className="text-white/70 text-sm mb-6">
                                You have an active game. Would you like to rejoin?
                            </p>

                            <div className="flex gap-3">
                                <motion.button
                                    onClick={handleRejoin}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
                                    }}
                                >
                                    Rejoin
                                </motion.button>
                                <motion.button
                                    onClick={handleCancelRejoin}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white/70 hover:text-white transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {/* Title screen logic */}
                {currentScreen === 'title' && (
                    <motion.div
                        key="title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TitleScreen
                            onStartSingleplayer={handleStartSingleplayer}
                            onStartMultiplayer={handleStartMultiplayer}
                            selectedTheme={myTheme}
                            onThemeChange={handleThemeChange}
                        />
                    </motion.div>
                )}

                {/* Game screen logic */}
                {currentScreen === 'game' && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ErrorBoundary onReset={handleGameReset}>
                            <Game
                                key={gameKey}
                                mode={gameMode}
                                onExit={handleExitToTitle}
                                myTheme={myTheme}
                                room={currentRoom}
                                isHost={isHost}
                            />
                        </ErrorBoundary>
                    </motion.div>
                )}
            </AnimatePresence>
            <SpeedInsights />
        </div>
    );
}

export default App;
