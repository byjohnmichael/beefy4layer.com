import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TitleScreen } from './screens/TitleScreen';
import { Game, type GameMode } from './screens/Game';
import { tacoBellTheme, getThemeById, type CardTheme } from './themes/themes';
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

  // Compute opponent theme for multiplayer
  const getOpponentTheme = (): CardTheme => {
    if (gameMode === 'singleplayer') {
      return myTheme; // Same theme in singleplayer
    }
    
    // In multiplayer, get opponent's theme from room data
    if (currentRoom) {
      const opponentData = isHost ? currentRoom.guest : currentRoom.host;
      if (opponentData?.theme_id) {
        return getThemeById(opponentData.theme_id);
      }
    }
    
    return myTheme; // Fallback
  };

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

  const handleExitToTitle = () => {
    setCurrentScreen('title');
    setCurrentRoom(null);
  };

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
            <Game 
              mode={gameMode} 
              onExit={handleExitToTitle}
              myTheme={myTheme}
              opponentTheme={getOpponentTheme()}
              room={currentRoom}
              isHost={isHost}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
