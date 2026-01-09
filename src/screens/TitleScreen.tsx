import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemePreview } from '../components/ThemePreview';
import { themes, type CardTheme } from '../themes/themes';
import {
  getPlayer,
  registerPlayer,
  checkUsernameAvailable,
  updatePlayerTheme,
  createRoom,
  joinRoom,
  leaveRoom,
  subscribeToRoom,
  type Player,
  type Room,
} from '../lib/multiplayer';

interface TitleScreenProps {
  onStartSingleplayer: () => void;
  onStartMultiplayer: (room: Room, isHost: boolean) => void;
  selectedTheme: CardTheme;
  onThemeChange: (theme: CardTheme) => void;
}

type MenuView = 'title' | 'themes' | 'multiplayer';
type MultiplayerMode = 'menu' | 'creating' | 'joining' | 'lobby';

export function TitleScreen({ 
  onStartSingleplayer, 
  onStartMultiplayer,
  selectedTheme,
  onThemeChange,
}: TitleScreenProps) {
  const [view, setView] = useState<MenuView>('title');
  const [multiplayerMode, setMultiplayerMode] = useState<MultiplayerMode>('menu');
  
  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  
  // Room state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Load existing player on mount
  useEffect(() => {
    async function loadPlayer() {
      const existingPlayer = await getPlayer();
      if (existingPlayer) {
        setPlayer(existingPlayer);
        setUsername(existingPlayer.username);
      }
    }
    loadPlayer();
  }, []);

  // Subscribe to room updates when in lobby
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribe = subscribeToRoom(currentRoom.id, (updatedRoom) => {
      setCurrentRoom(updatedRoom);
      
      // If game started, transition to game
      if (updatedRoom.status === 'playing') {
        const isHost = updatedRoom.host_id === player?.id;
        onStartMultiplayer(updatedRoom, isHost);
      }
    });

    return unsubscribe;
  }, [currentRoom?.id, player?.id, onStartMultiplayer]);

  // Handle username input change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(null);
    setShowSaveButton(value.trim().length > 0 && value !== player?.username);
  };

  // Save username
  const handleSaveUsername = async () => {
    if (!username.trim()) return;

    setIsSaving(true);
    setUsernameError(null);

    // Check if username is available (unless it's our current username)
    if (username !== player?.username) {
      const available = await checkUsernameAvailable(username.trim());
      if (!available) {
        setUsernameError('Username already taken');
        setIsSaving(false);
        return;
      }
    }

    const savedPlayer = await registerPlayer(username.trim(), selectedTheme.id);
    if (savedPlayer) {
      setPlayer(savedPlayer);
      setShowSaveButton(false);
    } else {
      setUsernameError('Failed to save');
    }

    setIsSaving(false);
  };

  // Update theme in database when changed
  const handleThemeChange = async (theme: CardTheme) => {
    onThemeChange(theme);
    if (player) {
      await updatePlayerTheme(theme.id);
    }
  };

  // Create room
  const handleCreateRoom = async () => {
    setMultiplayerMode('creating');
    const room = await createRoom();
    if (room) {
      setCurrentRoom(room);
      setMultiplayerMode('lobby');
    } else {
      setMultiplayerMode('menu');
    }
  };

  // Join room
  const handleJoinRoom = async (code: string) => {
    if (code.length !== 4) return;

    setIsJoining(true);
    setJoinError(null);

    const { room, error } = await joinRoom(code);
    if (room) {
      setCurrentRoom(room);
      setMultiplayerMode('lobby');
    } else {
      setJoinError(error || 'Failed to join');
    }

    setIsJoining(false);
  };

  // Leave room
  const handleLeaveRoom = async () => {
    if (currentRoom) {
      await leaveRoom(currentRoom.id);
    }
    setCurrentRoom(null);
    setMultiplayerMode('menu');
    setJoinCode('');
    setJoinError(null);
  };

  // Start game (host only)
  const handleStartGame = async () => {
    if (!currentRoom || !player) return;
    
    const isHost = currentRoom.host_id === player.id;
    if (!isHost) return;
    
    // Import and create initial state
    const { createInitialState } = await import('../game/initialState');
    const { startGame } = await import('../lib/multiplayer');
    
    const initialState = createInitialState();
    await startGame(currentRoom.id, initialState);
  };

  // Back to main menu
  const handleBackToMenu = () => {
    if (currentRoom) {
      handleLeaveRoom();
    }
    setMultiplayerMode('menu');
    setView('title');
    setJoinCode('');
    setJoinError(null);
  };

  const isMultiplayerEnabled = player !== null;
  const isHost = currentRoom?.host_id === player?.id;
  const canStartGame = isHost && currentRoom?.guest_id !== null;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 50%, #0f0a1a 100%)',
      }}
    >
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-24 rounded-lg"
            style={{
              background: i % 3 === 0 
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)' 
                : i % 3 === 1 
                ? 'linear-gradient(135deg, #ec4899, #db2777)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            }}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: -100,
              rotate: Math.random() * 360,
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: i * 1.2,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Error Toast - Top Left */}
      <AnimatePresence>
        {usernameError && (
          <motion.div
            className="fixed top-6 left-6 z-50 px-4 py-3 rounded-xl bg-red-500/90 text-white font-medium shadow-lg backdrop-blur-sm"
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{usernameError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Section - Bottom Left */}
      <motion.div
        className="fixed bottom-6 left-6 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div 
          className="p-4 rounded-2xl backdrop-blur-sm"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Username Input Row */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Username"
              maxLength={16}
              className="px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-purple-500/50 w-36 text-sm"
            />
            <AnimatePresence>
              {showSaveButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  onClick={handleSaveUsername}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? '...' : 'Save'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Display (only show after saved) */}
          {player && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 pt-2 border-t border-white/10"
            >
              <span className="text-white/60 text-xs uppercase tracking-wide">Theme</span>
              <span className="text-white text-sm font-medium">{selectedTheme.name}</span>
              
              {/* Mini card preview */}
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Face-down card mini */}
                <div
                  className="w-6 h-8 rounded-sm shadow-md"
                  style={{
                    background: selectedTheme.primary.gradient,
                    boxShadow: `0 2px 8px ${selectedTheme.primary.glow}`,
                  }}
                />
                {/* Chip/token mini */}
                <div
                  className="w-5 h-5 rounded-full shadow-md"
                  style={{
                    background: selectedTheme.secondary.gradient,
                    boxShadow: `0 2px 8px ${selectedTheme.secondary.glow}`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Room Lobby Info - Bottom Right (when in lobby) */}
      <AnimatePresence>
        {multiplayerMode === 'lobby' && currentRoom && (
          <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div 
              className="p-5 rounded-2xl backdrop-blur-sm min-w-64"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <h3 className="text-white/60 text-xs uppercase tracking-wide mb-3">Players in Room</h3>
              
              {/* Host */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white text-sm">
                  {currentRoom.host?.username || 'Host'}
                </span>
                <span className="text-purple-400 text-xs ml-auto">👑 Host</span>
              </div>
              
              {/* Guest */}
              {currentRoom.guest ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white text-sm">
                    {currentRoom.guest.username}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="text-white/50 text-sm italic">
                    Waiting for player...
                  </span>
                </div>
              )}

              {/* Start Game Button (Host only) */}
              {isHost && (
                <motion.button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="w-full mt-4 px-4 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canStartGame 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: canStartGame ? '0 4px 20px rgba(34, 197, 94, 0.4)' : 'none',
                  }}
                  whileHover={canStartGame ? { scale: 1.02 } : {}}
                  whileTap={canStartGame ? { scale: 0.98 } : {}}
                >
                  {canStartGame ? 'Start Game' : 'Waiting for player...'}
                </motion.button>
              )}

              {/* Leave button */}
              <button
                onClick={handleLeaveRoom}
                className="w-full mt-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
              >
                Leave Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'title' && (
          <motion.div
            key="title-content"
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.h1
                className="text-7xl font-black tracking-tight mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 20px rgba(168, 85, 247, 0.4))',
                }}
              >
                Beefy 4 Layer
              </motion.h1>
              <motion.div
                className="flex items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-2xl text-purple-400/60">♠</span>
                <span className="text-2xl text-pink-400/60">♥</span>
                <span className="text-2xl text-amber-400/60">♦</span>
                <span className="text-2xl text-purple-400/60">♣</span>
              </motion.div>
            </motion.div>

            {/* Menu buttons */}
            <motion.div
              className="flex flex-col gap-4 w-72"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {/* Singleplayer button */}
              <motion.button
                onClick={onStartSingleplayer}
                className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
                }}
              >
                <span className="relative z-10 text-white drop-shadow-lg">
                  Singleplayer
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-300/0 via-pink-300/30 to-pink-300/0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>

              {/* Multiplayer section */}
              <AnimatePresence mode="wait">
                {multiplayerMode === 'menu' && (
                  <motion.button
                    key="multiplayer-btn"
                    onClick={() => isMultiplayerEnabled && setMultiplayerMode('creating')}
                    disabled={!isMultiplayerEnabled}
                    className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    whileHover={isMultiplayerEnabled ? { scale: 1.03 } : {}}
                    whileTap={isMultiplayerEnabled ? { scale: 0.98 } : {}}
                    style={{
                      background: isMultiplayerEnabled 
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #3b2063 0%, #2d1b4e 100%)',
                      boxShadow: isMultiplayerEnabled ? '0 8px 24px rgba(139, 92, 246, 0.4)' : 'none',
                      opacity: isMultiplayerEnabled ? 1 : 0.6,
                      cursor: isMultiplayerEnabled ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <span className={isMultiplayerEnabled ? 'text-white' : 'text-purple-300/60'}>
                      Multiplayer
                    </span>
                    {!isMultiplayerEnabled && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-amber-400 text-black rounded-full">
                        Set Username
                      </span>
                    )}
                    {isMultiplayerEnabled && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-300/0 via-purple-300/30 to-purple-300/0"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                )}

                {(multiplayerMode === 'creating' || multiplayerMode === 'lobby') && (
                  <motion.div
                    key="create-room"
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Room Code Display or Create Button */}
                    {currentRoom ? (
                      <motion.div
                        className="relative px-8 py-4 text-center rounded-xl"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                        }}
                      >
                        <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Room Code</div>
                        <div className="text-white text-3xl font-mono font-bold tracking-[0.3em]">
                          {currentRoom.code}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={handleCreateRoom}
                        className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                        }}
                      >
                        <span className="text-white">Create a Room</span>
                      </motion.button>
                    )}

                    {/* Join Room Button/Input */}
                    {!currentRoom && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {multiplayerMode === 'creating' ? (
                          <motion.button
                            onClick={() => setMultiplayerMode('joining')}
                            className="w-full relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                            }}
                          >
                            <span className="text-white">Join a Room</span>
                          </motion.button>
                        ) : null}
                      </motion.div>
                    )}

                    {/* Back button */}
                    {!currentRoom && (
                      <button
                        onClick={handleBackToMenu}
                        className="text-white/50 hover:text-white text-sm transition-colors"
                      >
                        ← Back
                      </button>
                    )}
                  </motion.div>
                )}

                {multiplayerMode === 'joining' && !currentRoom && (
                  <motion.div
                    key="join-room"
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Create Room Button (secondary) */}
                    <motion.button
                      onClick={handleCreateRoom}
                      className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <span className="text-white">Create a Room</span>
                    </motion.button>

                    {/* Join Room Input */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <div 
                        className="px-6 py-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                        }}
                      >
                        <div className="text-white/70 text-xs uppercase tracking-wider mb-2 text-center">
                          Enter Room Code
                        </div>
                        <input
                          type="text"
                          value={joinCode}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
                            setJoinCode(val);
                            setJoinError(null);
                            if (val.length === 4) {
                              handleJoinRoom(val);
                            }
                          }}
                          placeholder="XXXX"
                          maxLength={4}
                          disabled={isJoining}
                          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white text-center text-2xl font-mono font-bold tracking-[0.4em] placeholder-white/30 outline-none focus:ring-2 focus:ring-white/30 uppercase"
                          autoFocus
                        />
                        {joinError && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-300 text-sm text-center mt-2"
                          >
                            {joinError}
                          </motion.div>
                        )}
                        {isJoining && (
                          <div className="text-white/70 text-sm text-center mt-2">
                            Joining...
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Back button */}
                    <button
                      onClick={handleBackToMenu}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      ← Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Themes button */}
              <motion.button
                onClick={() => setView('themes')}
                className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                layout
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                }}
              >
                <span className="relative z-10 text-white drop-shadow-lg">
                  Themes
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-300/0 via-purple-300/30 to-purple-300/0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {view === 'themes' && (
          <motion.div
            key="themes-content"
            className="flex gap-16 items-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Left side - Theme selection */}
            <motion.div
              className="flex flex-col gap-2 w-64"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h2 
                className="text-2xl font-bold mb-6 text-center"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Select Theme
              </h2>
              
              {themes.map((theme, index) => (
                <motion.button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme)}
                  className="relative px-6 py-4 rounded-xl text-left overflow-hidden group"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: selectedTheme.id === theme.id 
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(91, 33, 182, 0.3) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: selectedTheme.id === theme.id 
                      ? '2px solid rgba(124, 58, 237, 0.6)'
                      : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio indicator */}
                    <div 
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: selectedTheme.id === theme.id ? '#a855f7' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {selectedTheme.id === theme.id && (
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-purple-400"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                    
                    {/* Theme name and color swatches */}
                    <div className="flex-1">
                      <span className="text-white font-medium">{theme.name}</span>
                    </div>
                    
                    {/* Mini color swatches */}
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-sm"
                        style={{ background: theme.primary.gradient }}
                      />
                      <div 
                        className="w-4 h-4 rounded-sm"
                        style={{ background: theme.secondary.gradient }}
                      />
                      <div 
                        className="w-4 h-4 rounded-sm"
                        style={{ background: theme.neutral.gradient }}
                      />
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* Back button */}
              <motion.button
                onClick={() => setView('title')}
                className="mt-8 px-6 py-3 rounded-xl text-white/70 hover:text-white transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                }}
              >
                ← Back
              </motion.button>
            </motion.div>

            {/* Right side - Theme preview */}
            <motion.div
              className="bg-black/20 rounded-2xl p-8 backdrop-blur-sm"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ThemePreview theme={selectedTheme} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
