import type { Room } from './lib/multiplayer';
import { useState, useCallback } from 'react';
import { TitleScreen } from './screens/TitleScreen';
import { Game, type GameMode } from './screens/Game';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { tacoBellTheme, type CardTheme } from './themes/themes';

type Screen = 'title' | 'game';

// Main application entry point, index.html calls main.tsx which calls App.tsx
function App() {

    // Screen state
    const [currentScreen, setCurrentScreen] = useState<Screen>('title');

    // User info state
    const [gameMode, setGameMode] = useState<GameMode>('singleplayer');
    const [myTheme, setMyTheme] = useState<CardTheme>(tacoBellTheme);

    // Multiplayer info state
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [isHost, setIsHost] = useState(false);

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

    // Set state to change theme
    const handleThemeChange = (theme: CardTheme) => {
        setMyTheme(theme);
    };

    return (
        <div
            className="fixed inset-0"
            style={{
                background:
                    'radial-gradient(ellipse at center, #1a4a3a 0%, #0f2d23 50%, #0a1f18 100%)',
            }}
        >
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
        </div>
    );
}

export default App;
