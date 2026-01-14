import { motion } from 'framer-motion';
import type { Card as CardType, GameState, PlayerId } from '../game/types';
import { Card } from './Card';
import { getLegalPiles, getBackSymbol } from '../game/engine/rules';
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
    backColor: ThemeColor; // Which color to use for card back
    backSymbol: string; // Symbol to show on card back
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
    // Dealing animation - cards that have been dealt (show them), others stay at deck
    dealtCards?: Set<string>;
    isDealing?: boolean;
    // Perspective: which player ID is "me" (renders at bottom)
    myPlayerId?: PlayerId;
    // Scale factor for responsive sizing (1 = normal, 0.75 = 25% smaller)
    scale?: number;
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
    dealtCards,
    isDealing = false,
    myPlayerId = 'P1',
}: CardLayerProps) {
    const cardPositions: CardPosition[] = [];
    let zCounter = 0;

    // Suit colors from your theme (all face-up cards use your theme)
    const suitColors = {
        clubsSpades: myTheme.primary.solid,
        heartsDiamonds: myTheme.secondary.solid,
    };

    // Determine which player's cards go where based on perspective
    // "Me" always renders at bottom, "Opponent" at top
    const myPlayer = state.players[myPlayerId];
    const opponentPlayerId = myPlayerId === 'P1' ? 'P2' : 'P1';
    const opponentPlayer = state.players[opponentPlayerId];

    // Layout positions from perspective
    // My cards use bottom positions (p1HandCenter, p1FaceDownCenter)
    // Opponent cards use top positions (p2HandCenter, p2FaceDownCenter)
    const myHandCenter = layout.p1HandCenter;
    const myFaceDownCenter = layout.p1FaceDownCenter;
    const opponentHandCenter = layout.p2HandCenter;
    const opponentFaceDownCenter = layout.p2FaceDownCenter;

    // Calculate positions for OPPONENT hand - partially hidden at top
    const opponentHand = opponentPlayer.hand;
    const opponentHandCount = opponentHand.length;
    opponentHand.forEach((card, index) => {
        const spacing = 50;
        const totalWidth = (opponentHandCount - 1) * spacing;
        const startX = opponentHandCenter.x - totalWidth / 2;

        cardPositions.push({
            card,
            x: startX + index * spacing,
            y: opponentHandCenter.y,
            rotation: 0,
            faceUp: false,
            zIndex: zCounter++,
            location: 'p2Hand',
            locationIndex: index,
            isSelectable: false,
            isSelected: false,
            isDimmed: false,
            backColor: myTheme.secondary,
            backSymbol: getBackSymbol('diamond'),
        });
    });

    // Calculate positions for MY hand (bottom, face up, selectable)
    const myHand = myPlayer.hand;
    const myHandCount = myHand.length;
    myHand.forEach((card, index) => {
        const maxRotation = Math.min(myHandCount * 3, 25);
        const normalizedPos = myHandCount === 1 ? 0 : (index / (myHandCount - 1)) * 2 - 1;
        const rotation = normalizedPos * maxRotation;
        const horizontalSpread = normalizedPos * Math.min(myHandCount * 25, 150);
        const lift = -Math.abs(normalizedPos) * 15 + 15;

        const hasLegalPlay = getLegalPiles(card, state.centerPiles).length > 0;
        const isSelected =
            isPlayerTurn && selectedCard?.source === 'hand' && selectedCard.index === index;

        cardPositions.push({
            card,
            x: myHandCenter.x + horizontalSpread,
            y: myHandCenter.y - lift + (isSelected ? -20 : 0),
            rotation,
            faceUp: true,
            zIndex: zCounter++,
            location: 'p1Hand',
            locationIndex: index,
            isSelectable: isPlayerTurn && hasLegalPlay && !state.winner,
            isSelected,
            isDimmed: isPlayerTurn && !hasLegalPlay && !selectedCard,
            backColor: myTheme.primary, // My cards use primary color
            backSymbol: getBackSymbol('spade'),
        });
    });

    // Calculate positions for MY face-down cards
    const myFaceDown = myPlayer.faceDown.filter((c) => c !== null) as CardType[];
    const myFDCount = myFaceDown.length;
    let myFDIndex = 0;
    myPlayer.faceDown.forEach((card, originalIndex) => {
        if (card === null) return;

        const spacing = 76;
        const totalWidth = (myFDCount - 1) * spacing;
        const startX = myFaceDownCenter.x - totalWidth / 2;

        const isSelected =
            isPlayerTurn &&
            selectedCard?.source === 'faceDown' &&
            selectedCard.index === originalIndex;
        const canSelect =
            isPlayerTurn && !state.winner && (!selectedCard || selectedCard.source === 'faceDown');

        cardPositions.push({
            card,
            x: startX + myFDIndex * spacing,
            y: myFaceDownCenter.y + (isSelected ? -8 : 0),
            rotation: 0,
            faceUp: false,
            zIndex: zCounter++,
            location: 'p1FaceDown',
            locationIndex: originalIndex,
            isSelectable: canSelect,
            isSelected,
            isDimmed: false,
            backColor: myTheme.primary, // My face-down cards use primary
            backSymbol: getBackSymbol('spade'),
        });
        myFDIndex++;
    });

    // Calculate positions for OPPONENT face-down cards (top)
    const opponentFaceDown = opponentPlayer.faceDown.filter((c) => c !== null) as CardType[];
    const opponentFDCount = opponentFaceDown.length;
    let opponentFDIndex = 0;
    opponentPlayer.faceDown.forEach((card, originalIndex) => {
        if (card === null) return;

        const spacing = 76;
        const totalWidth = (opponentFDCount - 1) * spacing;
        const startX = opponentFaceDownCenter.x - totalWidth / 2;

        cardPositions.push({
            card,
            x: startX + opponentFDIndex * spacing,
            y: opponentFaceDownCenter.y,
            rotation: 0,
            faceUp: false,
            zIndex: zCounter++,
            location: 'p2FaceDown',
            locationIndex: originalIndex,
            isSelectable: false,
            isSelected: false,
            isDimmed: false,
            backColor: myTheme.secondary,
            backSymbol: getBackSymbol('diamond'),
        });
        opponentFDIndex++;
    });

    // Calculate positions for center piles (only top card visible)
    state.centerPiles.forEach((pile, pileIndex) => {
        if (pile.length === 0) return;

        const topCard = pile[pile.length - 1];
        const pos = layout.pilePositions[pileIndex];
        if (!pos) return; // Safety check

        // Use MY hand for legal pile checking (since I'm the one making moves)
        let isLegal = false;
        if (selectedCard) {
            if (selectedCard.source === 'faceDown') {
                isLegal = true; // Face-down can play on any pile
            } else if (selectedCard.source === 'hand') {
                const selectedHandCard = myPlayer.hand[selectedCard.index];
                if (selectedHandCard) {
                    isLegal = getLegalPiles(selectedHandCard, state.centerPiles).includes(
                        pileIndex,
                    );
                }
            }
        }
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
            backSymbol: getBackSymbol('spade'),
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

    const visiblePositions =
        allHiddenIds.length > 0
            ? cardPositions.filter((pos) => !allHiddenIds.includes(pos.card.id))
            : cardPositions;

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
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
                        initial={
                            isDealing
                                ? {
                                      x: layout.deckPos.x - 32,
                                      y: layout.deckPos.y - 48,
                                      rotate: 0,
                                      rotateY: 180,
                                      scale: 1,
                                  }
                                : false
                        }
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
                            isHighlighted={
                                !isDealing && pos.isSelectable && pos.location === 'pile'
                            }
                            backColor={pos.backColor}
                            backSymbol={pos.backSymbol}
                            suitColors={suitColors}
                            jokerColor={myTheme.neutral}
                            darkFace={myTheme.darkCardFace}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
