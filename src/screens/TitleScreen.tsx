import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemePreview } from '../components/ThemePreview';
import { themes, type CardTheme } from '../themes/themes';
import { SYMBOLS } from '../game/engine/rules';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom, startGame, getOrCreateClientId, type Room } from '../lib/multiplayer';
import { createInitialState } from '../game/initialState';

interface TitleScreenProps {
    onStartSingleplayer: () => void;
    onStartMultiplayer: (room: Room, isHost: boolean) => void;
    selectedTheme: CardTheme;
    onThemeChange: (theme: CardTheme) => void;
}

type MenuView = 'title' | 'themes';
type MultiplayerMode = 'menu' | 'creating' | 'joining' | 'waiting';

export function TitleScreen({
    onStartSingleplayer,
    onStartMultiplayer,
    selectedTheme,
    onThemeChange,
}: TitleScreenProps) {
    const [view, setView] = useState<MenuView>('title');
    const [multiplayerMode, setMultiplayerMode] = useState<MultiplayerMode>('menu');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Filter out disabled themes, then compute ungrouped themes and unique groups
    const enabledThemes = themes.filter((t) => !t.disabled);
    const ungroupedThemes = enabledThemes.filter((t) => !t.group);
    const groupedThemes = enabledThemes.filter((t) => t.group);
    const uniqueGroups = [...new Set(groupedThemes.map((t) => t.group!))];
    const themesInSelectedGroup = selectedGroup
        ? enabledThemes.filter((t) => t.group === selectedGroup)
        : [];

    // Room state
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    // Track window width for responsive behavior
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Subscribe to room updates when waiting for guest
    useEffect(() => {
        if (!currentRoom) return;

        const clientId = getOrCreateClientId();
        const isHost = currentRoom.host_id === clientId;

        const unsubscribe = subscribeToRoom(currentRoom.id, async (updatedRoom) => {
            setCurrentRoom(updatedRoom);

            // If game started, transition to game
            if (updatedRoom.status === 'playing') {
                onStartMultiplayer(updatedRoom, isHost);
                return;
            }

            // Auto-start: if we're host and guest just joined, start the game
            if (isHost && updatedRoom.guest_id && updatedRoom.status === 'waiting') {
                const initialState = createInitialState();
                await startGame(updatedRoom.id, initialState);
            }
        });

        return unsubscribe;
    }, [currentRoom?.id, onStartMultiplayer]);

    // Create room
    const handleCreateRoom = async () => {
        setMultiplayerMode('creating');
        const room = await createRoom();
        if (room) {
            setCurrentRoom(room);
            setMultiplayerMode('waiting');
        } else {
            setMultiplayerMode('menu');
        }
    };

    // Join room - game starts automatically when we join
    const handleJoinRoom = async (code: string) => {
        if (code.length !== 4) return;

        setIsJoining(true);
        setJoinError(null);

        const { room, error } = await joinRoom(code);
        if (room) {
            setCurrentRoom(room);
            // The host will auto-start the game when they see we joined
            // We'll transition when we receive the 'playing' status update
            setMultiplayerMode('waiting');
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

    const clientId = getOrCreateClientId();
    const isHost = currentRoom?.host_id === clientId;

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
                            background:
                                i % 3 === 0
                                    ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                    : i % 3 === 1
                                      ? 'linear-gradient(135deg, #ec4899, #db2777)'
                                      : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        }}
                        initial={{
                            x:
                                Math.random() *
                                (typeof window !== 'undefined' ? window.innerWidth : 1000),
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
                {joinError && (
                    <motion.div
                        className="fixed top-6 left-6 z-50 px-4 py-3 rounded-xl bg-red-500/90 text-white font-medium shadow-lg backdrop-blur-sm"
                        initial={{ opacity: 0, x: -20, y: -10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>{joinError}</span>
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
                                    background:
                                        'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)',
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
                                <span className="text-2xl text-purple-400/60">{SYMBOLS.spade}</span>
                                <span className="text-2xl text-pink-400/60">{SYMBOLS.heart}</span>
                                <span className="text-2xl text-amber-400/60">{SYMBOLS.diamond}</span>
                                <span className="text-2xl text-purple-400/60">{SYMBOLS.club}</span>
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
                                        onClick={() => setMultiplayerMode('creating')}
                                        className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                                        }}
                                    >
                                        <span className="text-white">Multiplayer</span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-purple-300/0 via-purple-300/30 to-purple-300/0"
                                            initial={{ x: '-100%' }}
                                            whileHover={{ x: '100%' }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </motion.button>
                                )}

                                {(multiplayerMode === 'creating' || multiplayerMode === 'waiting') && (
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
                                                    background:
                                                        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                                                }}
                                            >
                                                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">
                                                    {isHost ? 'Share This Code' : 'Joining...'}
                                                </div>
                                                <div className="text-white text-3xl font-mono font-bold tracking-[0.3em]">
                                                    {currentRoom.code}
                                                </div>
                                                {isHost && (
                                                    <div className="text-white/60 text-xs mt-2">
                                                        Waiting for opponent...
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.button
                                                onClick={handleCreateRoom}
                                                className="relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    background:
                                                        'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
                                                <motion.button
                                                    onClick={() => setMultiplayerMode('joining')}
                                                    className="w-full relative px-8 py-4 text-xl font-bold rounded-xl overflow-hidden"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{
                                                        background:
                                                            'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                        boxShadow:
                                                            '0 8px 24px rgba(99, 102, 241, 0.4)',
                                                    }}
                                                >
                                                    <span className="text-white">Join a Room</span>
                                                </motion.button>
                                            </motion.div>
                                        )}

                                        {/* Cancel/Leave button */}
                                        <button
                                            onClick={handleBackToMenu}
                                            className="text-white/50 hover:text-white text-sm transition-colors"
                                        >
                                            ← {currentRoom ? 'Leave Room' : 'Back'}
                                        </button>
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
                                                background:
                                                    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
                                                    background:
                                                        'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
                                                        const val = e.target.value
                                                            .toUpperCase()
                                                            .replace(/[^A-Z]/g, '')
                                                            .slice(0, 4);
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
                        className="flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Left side - Theme selection */}
                        <motion.div
                            className="flex flex-col gap-2 w-64 max-w-full"
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
                                {selectedGroup ? selectedGroup.toUpperCase() : 'Select Theme'}
                            </h2>

                            {/* Scrollable theme list */}
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                                {/* Show ungrouped themes or themes in selected group */}
                                {(selectedGroup ? themesInSelectedGroup : ungroupedThemes).map(
                                    (theme, index) => (
                                        <motion.button
                                            key={theme.id}
                                            onClick={() => onThemeChange(theme)}
                                            className="relative px-6 py-4 min-h-[56px] rounded-xl text-left overflow-hidden group"
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.15 + index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                background:
                                                    selectedTheme.id === theme.id
                                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(91, 33, 182, 0.3) 100%)'
                                                        : 'rgba(255,255,255,0.05)',
                                                border:
                                                    selectedTheme.id === theme.id
                                                        ? '2px solid rgba(124, 58, 237, 0.6)'
                                                        : '2px solid transparent',
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Radio indicator */}
                                                <div
                                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        borderColor:
                                                            selectedTheme.id === theme.id
                                                                ? '#a855f7'
                                                                : 'rgba(255,255,255,0.3)',
                                                    }}
                                                >
                                                    {selectedTheme.id === theme.id && (
                                                        <motion.div
                                                            className="w-2.5 h-2.5 rounded-full bg-purple-400"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 500,
                                                                damping: 30,
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Theme name and color swatches */}
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-white font-medium text-sm truncate block">
                                                        {theme.name}
                                                    </span>
                                                </div>

                                                {/* Mini color swatches - hidden on screens < 652px */}
                                                {windowWidth >= 652 && (
                                                    <div className="flex gap-1 flex-shrink-0">
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
                                                )}
                                            </div>
                                        </motion.button>
                                    ),
                                )}
                            </div>

                            {/* Group buttons - only show when not in a group */}
                            {!selectedGroup && uniqueGroups.length > 0 && (
                                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                                    {uniqueGroups.map((group, index) => (
                                        <motion.button
                                            key={group}
                                            onClick={() => setSelectedGroup(group)}
                                            className="px-6 py-3 rounded-xl text-left font-bold uppercase tracking-wider text-sm"
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{
                                                delay: 0.15 + ungroupedThemes.length * 0.05 + index * 0.08,
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-blue-300">{group}</span>
                                                <span className="text-white/40">→</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Back button */}
                            <motion.button
                                onClick={() => {
                                    if (selectedGroup) {
                                        setSelectedGroup(null);
                                    } else {
                                        setView('title');
                                    }
                                }}
                                className="mt-4 px-6 py-3 rounded-xl text-white/70 hover:text-white transition-colors"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                ← {selectedGroup ? 'Back to Themes' : 'Back'}
                            </motion.button>
                        </motion.div>

                        {/* Right side - Theme preview (hidden on mobile) */}
                        {windowWidth >= 652 && (
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
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
