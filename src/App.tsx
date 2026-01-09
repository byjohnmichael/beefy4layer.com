import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TitleScreen } from './screens/TitleScreen';
import { Game, type GameMode } from './screens/Game';
import { tacoBellTheme, type CardTheme } from './themes/themes';

type Screen = 'title' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('singleplayer');
  
  // Theme state - for now default to Taco Bell theme
  // In the future, this could be selected on title screen
  const [myTheme] = useState<CardTheme>(tacoBellTheme);
  // In singleplayer, opponent uses same theme. In multiplayer, this would come from network.
  const [opponentTheme] = useState<CardTheme>(tacoBellTheme);

  const handleStartSingleplayer = () => {
    setGameMode('singleplayer');
    setCurrentScreen('game');
  };

  const handleStartMultiplayer = () => {
    // Multiplayer not implemented yet
    setGameMode('multiplayer');
    setCurrentScreen('game');
  };

  const handleExitToTitle = () => {
    setCurrentScreen('title');
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
              opponentTheme={opponentTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
