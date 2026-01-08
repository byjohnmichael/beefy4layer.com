import { motion } from 'framer-motion';

interface DeckProps {
  count: number;
  canDraw?: boolean;
  onDraw?: () => void;
}

export function Deck({ count, canDraw = false, onDraw }: DeckProps) {
  const isClickable = canDraw && count > 0 && onDraw;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-semibold text-gray-400">Deck</div>

      <motion.div 
        className={`relative ${isClickable ? 'cursor-pointer' : ''}`}
        whileHover={isClickable ? { scale: 1.05 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        onClick={isClickable ? onDraw : undefined}
      >
        {/* Stack effect */}
        {count > 0 && (
          <>
            <div 
              className="absolute w-16 h-24 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #1a3d5c 0%, #0f2419 100%)',
                transform: 'translate(4px, 4px)',
                opacity: 0.6,
              }}
            />
            <div 
              className="absolute w-16 h-24 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #1a3d5c 0%, #0f2419 100%)',
                transform: 'translate(2px, 2px)',
                opacity: 0.8,
              }}
            />
          </>
        )}

        {/* Top card / empty state */}
        <motion.div
          className={`relative w-16 h-24 rounded-lg flex items-center justify-center transition-all ${
            isClickable ? 'ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-transparent' : ''
          }`}
          animate={{ scale: count === 0 ? 0.95 : 1 }}
          style={{
            background: count > 0 
              ? 'linear-gradient(135deg, #2d5a7b 0%, #1a3d5c 100%)'
              : 'transparent',
            border: count === 0 ? '2px dashed #4a5568' : 'none',
            boxShadow: count > 0 ? '0 4px 12px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          {count > 0 ? (
            <>
              <div className="absolute inset-1 rounded border border-white/20">
                <div 
                  className="w-full h-full rounded"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 4px,
                        rgba(255,255,255,0.05) 4px,
                        rgba(255,255,255,0.05) 8px
                      )
                    `,
                  }}
                />
              </div>
              <span className="text-2xl opacity-30 z-10">♠</span>
            </>
          ) : (
            <span className="text-gray-500 text-xs">Empty</span>
          )}
        </motion.div>

        {/* Card count badge */}
        <div 
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-800 border-2 border-amber-500/60 flex items-center justify-center text-sm font-bold text-amber-400"
        >
          {count}
        </div>

        {/* Draw hint */}
        {isClickable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-emerald-400 whitespace-nowrap"
          >
            Click to draw
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

