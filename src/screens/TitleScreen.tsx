import { motion } from 'framer-motion';

interface TitleScreenProps {
  onStartSingleplayer: () => void;
  onStartMultiplayer: () => void;
}

export function TitleScreen({ onStartSingleplayer, onStartMultiplayer }: TitleScreenProps) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 50%, #0f0a1a 100%)',
      }}
    >
      {/* Animated background cards - Taco Bell purple/pink themed */}
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
              x: Math.random() * window.innerWidth,
              y: -100,
              rotate: Math.random() * 360,
            }}
            animate={{
              y: window.innerHeight + 100,
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
        {/* Singleplayer button - Taco Bell pink/magenta */}
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

        {/* Multiplayer button (disabled) */}
        <motion.button
          onClick={onStartMultiplayer}
          disabled
          className="relative px-8 py-4 text-xl font-bold rounded-xl cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #3b2063 0%, #2d1b4e 100%)',
            opacity: 0.6,
          }}
        >
          <span className="text-purple-300/60">
            Multiplayer
          </span>
          <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-amber-400 text-black rounded-full">
            Soon
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}

