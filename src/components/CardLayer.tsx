import { motion } from 'framer-motion';
import type { Card as CardType, GameState } from '../game/types';
import { Card } from './Card';
import { getLegalPiles } from '../game/engine/rules';
import type { CardTheme, ThemeColor } from '../themes/themes';

interface CardPosition {
  card: CardType;
  x: number;
  y: number;
  rotation: number;
  faceUp: boolean;
  zIndex: number;
  location: 'p1Hand' | 'p1FaceDown' | 'p2Hand' | 'p2FaceDown' | 'pile' | 'deck';
  locationIndex: number;
  isSelectable: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  backColor: ThemeColor;  // Which color to use for card back
}

interface CardLayerProps {
  state: GameState;
  layout: {
    deckPos: { x: number; y: number };
    pilePositions: { x: number; y: number }[];
    p1HandCenter: { x: number; y: number };
    p1FaceDownCenter: { x: number; y: number };
    p2HandCenter: { x: number; y: number };
    p2FaceDownCenter: { x: number; y: number };
  };
  onSelectHandCard: (index: number) => void;
  onSelectFaceDownCard: (index: number) => void;
  onSelectPile: (index: number) => void;
  selectedCard: { source: 'hand' | 'faceDown'; index: number } | null;
  isPlayerTurn: boolean;
  drawingCardId?: string;
  hiddenCardIds?: string[];
  // Theme props
  myTheme: CardTheme;
  opponentTheme: CardTheme;
  // Dealing animation - cards that have been dealt (show them), others stay at deck
  dealtCards?: Set<string>;
  isDealing?: boolean;
}

export function CardLayer({
  state,
  layout,
  onSelectHandCard,
  onSelectFaceDownCard,
  onSelectPile,
  selectedCard,
  isPlayerTurn,
  drawingCardId,
  hiddenCardIds = [],
  myTheme,
  opponentTheme,
  dealtCards,
  isDealing = false,
}: CardLayerProps) {
  const cardPositions: CardPosition[] = [];
  let zCounter = 0;

  // Suit colors from your theme (all face-up cards use your theme)
  const suitColors = {
    clubsSpades: myTheme.primary.solid,
    heartsDiamonds: myTheme.secondary.solid,
    joker: myTheme.neutral.solid,
  };

  // Calculate positions for player 2 (opponent) hand - partially hidden at top
  const p2Hand = state.players.P2.hand;
  const p2HandCount = p2Hand.length;
  p2Hand.forEach((card, index) => {
    const spacing = 50;
    const totalWidth = (p2HandCount - 1) * spacing;
    const startX = layout.p2HandCenter.x - totalWidth / 2;

    cardPositions.push({
      card,
      x: startX + index * spacing,
      y: layout.p2HandCenter.y,
      rotation: 0,
      faceUp: false,
      zIndex: zCounter++,
      location: 'p2Hand',
      locationIndex: index,
      isSelectable: false,
      isSelected: false,
      isDimmed: false,
      backColor: opponentTheme.secondary, // Opponent's cards use their theme's secondary
    });
  });

  // Calculate positions for player 1 hand
  const p1Hand = state.players.P1.hand;
  const p1HandCount = p1Hand.length;
  p1Hand.forEach((card, index) => {
    const maxRotation = Math.min(p1HandCount * 3, 25);
    const normalizedPos = p1HandCount === 1 ? 0 : (index / (p1HandCount - 1)) * 2 - 1;
    const rotation = normalizedPos * maxRotation;
    const horizontalSpread = normalizedPos * Math.min(p1HandCount * 25, 150);
    const lift = -Math.abs(normalizedPos) * 15 + 15;
    
    const hasLegalPlay = getLegalPiles(card, state.centerPiles).length > 0;
    const isSelected = isPlayerTurn && selectedCard?.source === 'hand' && selectedCard.index === index;

    cardPositions.push({
      card,
      x: layout.p1HandCenter.x + horizontalSpread,
      y: layout.p1HandCenter.y - lift + (isSelected ? -20 : 0),
      rotation,
      faceUp: true,
      zIndex: zCounter++,
      location: 'p1Hand',
      locationIndex: index,
      isSelectable: isPlayerTurn && hasLegalPlay && !state.winner,
      isSelected,
      isDimmed: isPlayerTurn && !hasLegalPlay && !selectedCard,
      backColor: myTheme.primary, // Your cards use your theme's primary
    });
  });

  // Calculate positions for player 1 face-down
  const p1FaceDown = state.players.P1.faceDown.filter(c => c !== null) as CardType[];
  const p1FDCount = p1FaceDown.length;
  let p1FDIndex = 0;
  state.players.P1.faceDown.forEach((card, originalIndex) => {
    if (card === null) return;
    
    const spacing = 76;
    const totalWidth = (p1FDCount - 1) * spacing;
    const startX = layout.p1FaceDownCenter.x - totalWidth / 2;
    
    const isSelected = isPlayerTurn && selectedCard?.source === 'faceDown' && selectedCard.index === originalIndex;
    const canSelect = isPlayerTurn && !state.winner && (!selectedCard || selectedCard.source === 'faceDown');

    cardPositions.push({
      card,
      x: startX + p1FDIndex * spacing,
      y: layout.p1FaceDownCenter.y + (isSelected ? -8 : 0),
      rotation: 0,
      faceUp: false,
      zIndex: zCounter++,
      location: 'p1FaceDown',
      locationIndex: originalIndex,
      isSelectable: canSelect,
      isSelected,
      isDimmed: false,
      backColor: myTheme.primary, // Your face-down cards use your theme's primary
    });
    p1FDIndex++;
  });

  // Calculate positions for player 2 face-down (opponent)
  const p2FaceDown = state.players.P2.faceDown.filter(c => c !== null) as CardType[];
  const p2FDCount = p2FaceDown.length;
  let p2FDIndex = 0;
  state.players.P2.faceDown.forEach((card, originalIndex) => {
    if (card === null) return;
    
    const spacing = 76;
    const totalWidth = (p2FDCount - 1) * spacing;
    const startX = layout.p2FaceDownCenter.x - totalWidth / 2;

    cardPositions.push({
      card,
      x: startX + p2FDIndex * spacing,
      y: layout.p2FaceDownCenter.y,
      rotation: 0,
      faceUp: false,
      zIndex: zCounter++,
      location: 'p2FaceDown',
      locationIndex: originalIndex,
      isSelectable: false,
      isSelected: false,
      isDimmed: false,
      backColor: opponentTheme.secondary, // Opponent's face-down use their secondary
    });
    p2FDIndex++;
  });

  // Calculate positions for center piles (only top card visible)
  state.centerPiles.forEach((pile, pileIndex) => {
    if (pile.length === 0) return;
    
    const topCard = pile[pile.length - 1];
    const pos = layout.pilePositions[pileIndex];
    const isLegal = selectedCard ? 
      (selectedCard.source === 'faceDown' || getLegalPiles(state.players.P1.hand[selectedCard.index], state.centerPiles).includes(pileIndex))
      : false;
    const hasSelection = selectedCard !== null && isPlayerTurn;

    cardPositions.push({
      card: topCard,
      x: pos.x,
      y: pos.y,
      rotation: 0,
      faceUp: true,
      zIndex: zCounter++,
      location: 'pile',
      locationIndex: pileIndex,
      isSelectable: hasSelection && isLegal,
      isSelected: false,
      isDimmed: hasSelection && !isLegal,
      backColor: myTheme.neutral, // Center piles use neutral (shouldn't be seen anyway)
    });
  });

  const handleCardClick = (pos: CardPosition) => {
    if (!pos.isSelectable) return;
    
    if (pos.location === 'p1Hand') {
      onSelectHandCard(pos.locationIndex);
    } else if (pos.location === 'p1FaceDown') {
      onSelectFaceDownCard(pos.locationIndex);
    } else if (pos.location === 'pile') {
      onSelectPile(pos.locationIndex);
    }
  };

  // Filter out any cards that are being animated
  const allHiddenIds = [...hiddenCardIds];
  if (drawingCardId) allHiddenIds.push(drawingCardId);
  
  const visiblePositions = allHiddenIds.length > 0
    ? cardPositions.filter(pos => !allHiddenIds.includes(pos.card.id))
    : cardPositions;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {visiblePositions.map((pos) => {
        // During dealing, check if this card has been dealt yet
        const hasBeenDealt = !dealtCards || dealtCards.has(pos.card.id);
        const showAtDeck = isDealing && !hasBeenDealt;
        
        // Cards not yet dealt start at deck position
        const targetX = showAtDeck ? layout.deckPos.x - 32 : pos.x - 32;
        const targetY = showAtDeck ? layout.deckPos.y - 48 : pos.y - 48;
        const targetRotation = showAtDeck ? 0 : pos.rotation;
        const showFaceUp = showAtDeck ? false : pos.faceUp;
        
        return (
          <motion.div
            key={pos.card.id}
            layoutId={pos.card.id}
            className="absolute pointer-events-auto"
            initial={isDealing ? {
              x: layout.deckPos.x - 32,
              y: layout.deckPos.y - 48,
              rotate: 0,
              rotateY: 180,
              scale: 1,
            } : false}
            animate={{
              x: targetX,
              y: targetY,
              rotate: targetRotation,
              rotateY: showFaceUp ? 0 : 180,
              scale: pos.isSelected ? 1.05 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 28,
              rotateY: { type: 'spring', stiffness: 200, damping: 20 },
            }}
            style={{ 
              zIndex: showAtDeck ? 1 : pos.zIndex + (pos.isSelected ? 1000 : 0),
              perspective: 1000,
            }}
            onClick={isDealing ? undefined : () => handleCardClick(pos)}
          >
            <Card
              card={pos.card}
              faceUp={showFaceUp}
              isSelected={!isDealing && pos.isSelected}
              isDimmed={!isDealing && pos.isDimmed}
              isHighlighted={!isDealing && pos.isSelectable && pos.location === 'pile'}
              backColor={pos.backColor}
              suitColors={suitColors}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
