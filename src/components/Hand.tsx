import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '../game/types';
import { Card } from './Card';
import { getLegalPiles } from '../game/engine/rules';

interface HandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  selectedIndex: number | null;
  centerPiles: CardType[][];
  onSelectCard: (index: number) => void;
  playerLabel: string;
}

export function Hand({
  cards,
  isCurrentPlayer,
  selectedIndex,
  centerPiles,
  onSelectCard,
  playerLabel,
}: HandProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-semibold text-gray-400 mb-1">
        {playerLabel}'s Hand ({cards.length})
      </div>

      <div className="flex flex-wrap gap-2 justify-center min-h-[96px] p-2 rounded-lg bg-black/20">
        <AnimatePresence mode="popLayout">
          {cards.length === 0 ? (
            <div className="text-gray-500 text-sm flex items-center">No cards in hand</div>
          ) : (
            cards.map((card, index) => {
              // Check if this card has legal plays
              const hasLegalPlay = getLegalPiles(card, centerPiles).length > 0;
              const isSelectable = isCurrentPlayer && hasLegalPlay;
              const isSelected = selectedIndex === index;

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    card={card}
                    faceUp={isCurrentPlayer}
                    onClick={isSelectable ? () => onSelectCard(index) : undefined}
                    isSelected={isSelected}
                    isDimmed={isCurrentPlayer && !hasLegalPlay}
                  />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

