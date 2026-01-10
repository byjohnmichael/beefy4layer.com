import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TitleScreen } from './screens/TitleScreen';
import { Game, type GameMode } from './screens/Game';
import { ErrorBoundary } from './components/ErrorBoundary';
import { tacoBellTheme, type CardTheme } from './themes/themes';
import type { Room } from './lib/multiplayer';


type Screen = 'title' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('singleplayer');
  
  // Theme state
  const [myTheme, setMyTheme] = useState<CardTheme>(tacoBellTheme);
  
  // Multiplayer state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState(false);

  // For simplicity, opponent always uses your secondary color for their card backs
  // This avoids confusion and doesn't require fetching opponent's theme
  const opponentTheme = myTheme; // Uses myTheme.secondary for opponent card backs

  const handleStartSingleplayer = () => {
    setGameMode('singleplayer');
    setCurrentRoom(null);
    setCurrentScreen('game');
  };

  const handleStartMultiplayer = (room: Room, host: boolean) => {
    setGameMode('multiplayer');
    setCurrentRoom(room);
    setIsHost(host);
    setCurrentScreen('game');
  };

  // Use a key to force remount when resetting after error
  const [gameKey, setGameKey] = useState(0);
  
  const handleExitToTitle = () => {
    setCurrentScreen('title');
    setCurrentRoom(null);
  };
  
  const handleGameReset = useCallback(() => {
    // Increment key to force remount of Game component
    setGameKey(k => k + 1);
  }, []);

  const handleThemeChange = (theme: CardTheme) => {
    setMyTheme(theme);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at center, #1a4a3a 0%, #0f2d23 50%, #0a1f18 100%)',
      }}
    >
      <AnimatePresence mode="wait">
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
                opponentTheme={opponentTheme}
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
