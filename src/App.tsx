import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer } from './game/reducer';
import { createInitialState } from './game/initialState';
import { getLegalPiles, canPlay } from './game/engine/rules';
import { getBotMove, getBotPileSelection } from './game/bot';
import { Card } from './components/Card';
import { OpponentHand } from './components/OpponentHand';
import { PlayerHand } from './components/PlayerHand';
import { HorizontalFaceDown } from './components/HorizontalFaceDown';
import { CenterPiles } from './components/CenterPiles';
import { TurnIndicator } from './components/TurnIndicator';
import { WinOverlay } from './components/WinOverlay';
import type { Card as CardType } from './game/types';

type PlayAnimation = {
  card: CardType;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  source: 'hand' | 'faceDown';
  isSuccess: boolean;
  phase: 'moving' | 'result' | 'toHand';
  sourceIndex: number;
} | null;

type DeckDrawAnimation = {
  card: CardType | null; // null means face-down card
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  target: 'hand' | 'faceDown';
  faceDownIndex?: number;
} | null;

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [playAnimation, setPlayAnimation] = useState<PlayAnimation>(null);
  const [deckDrawAnimation, setDeckDrawAnimation] = useState<DeckDrawAnimation>(null);
  const [pendingAction, setPendingAction] = useState<{ pileIndex: number } | null>(null);
  const [hiddenCardIndex, setHiddenCardIndex] = useState<{ source: 'hand' | 'faceDown'; index: number } | null>(null);
  
  const pileRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const handRef = useRef<HTMLDivElement>(null);
  const faceDownRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  // Handle play animation completion
  useEffect(() => {
    if (!playAnimation || !pendingAction) return;

    if (playAnimation.phase === 'moving') {
      const timer = setTimeout(() => {
        setPlayAnimation(prev => prev ? { ...prev, phase: 'result' } : null);
      }, 400);
      return () => clearTimeout(timer);
    }

    if (playAnimation.phase === 'result') {
      const timer = setTimeout(() => {
        if (!playAnimation.isSuccess) {
          setPlayAnimation(prev => prev ? { ...prev, phase: 'toHand' } : null);
        } else {
          dispatch({ type: 'SELECT_PILE', pileIndex: pendingAction.pileIndex });
          setPlayAnimation(null);
          setPendingAction(null);
          setHiddenCardIndex(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    if (playAnimation.phase === 'toHand') {
      const timer = setTimeout(() => {
        // Dispatch the action which will handle moving card to hand
        dispatch({ type: 'SELECT_PILE', pileIndex: pendingAction.pileIndex });
        setPlayAnimation(null);
        setPendingAction(null);
        setHiddenCardIndex(null);
        
        // After state updates, trigger deck draw animation for replacement card
        setTimeout(() => {
          triggerDeckDrawAnimation('faceDown', playAnimation.sourceIndex);
        }, 100);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [playAnimation, pendingAction]);

  // Handle deck draw animation completion
  useEffect(() => {
    if (!deckDrawAnimation) return;
    
    const timer = setTimeout(() => {
      setDeckDrawAnimation(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [deckDrawAnimation]);

  const triggerDeckDrawAnimation = (target: 'hand' | 'faceDown', faceDownIndex?: number) => {
    if (!deckRef.current) return;
    
    const deckRect = deckRef.current.getBoundingClientRect();
    const startPos = { x: deckRect.left + deckRect.width / 2, y: deckRect.top + deckRect.height / 2 };
    
    let endPos = { x: window.innerWidth / 2, y: window.innerHeight - 100 };
    
    if (target === 'hand' && handRef.current) {
      const rect = handRef.current.getBoundingClientRect();
      endPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    } else if (target === 'faceDown' && faceDownRef.current) {
      const rect = faceDownRef.current.getBoundingClientRect();
      endPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    
    setDeckDrawAnimation({
      card: null,
      startPos,
      endPos,
      target,
      faceDownIndex,
    });
  };

  // Bot AI
  const executeBotMove = useCallback(() => {
    if (state.currentPlayer !== 'P2' || state.winner || playAnimation || deckDrawAnimation) return;

    const thinkTime = 800 + Math.random() * 600;

    setTimeout(() => {
      if (state.selectedCard) {
        const pileAction = getBotPileSelection(state);
        if (pileAction) {
          dispatch(pileAction);
        }
      } else {
        const action = getBotMove(state);
        if (action) {
          dispatch(action);
        }
      }
    }, thinkTime);
  }, [state, playAnimation, deckDrawAnimation]);

  useEffect(() => {
    if (state.currentPlayer === 'P2' && !state.winner && !playAnimation && !deckDrawAnimation) {
      const timer = setTimeout(executeBotMove, 500);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.winner, state.selectedCard, playAnimation, deckDrawAnimation, executeBotMove]);

  const handleSelectHandCard = (index: number) => {
    if (state.currentPlayer !== 'P1' || playAnimation || deckDrawAnimation) return;
    dispatch({ type: 'SELECT_HAND_CARD', index });
  };

  const handleSelectFaceDownCard = (index: number) => {
    if (state.currentPlayer !== 'P1' || playAnimation || deckDrawAnimation) return;
    dispatch({ type: 'SELECT_FACEDOWN_CARD', index });
  };

  const handleSelectPile = (pileIndex: number) => {
    if (playAnimation || deckDrawAnimation) return;
    
    if (state.currentPlayer === 'P1' && state.selectedCard) {
      const { source, index } = state.selectedCard;
      const player = state.players.P1;
      
      let card: CardType | null = null;
      let startPos = { x: window.innerWidth / 2, y: window.innerHeight - 150 };
      
      if (source === 'hand') {
        card = player.hand[index];
        // Get position of the specific card in hand
        if (handRef.current) {
          const cards = handRef.current.querySelectorAll('[data-card-index]');
          const cardEl = cards[index] as HTMLElement;
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            startPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
        }
      } else {
        card = player.faceDown[index];
        if (faceDownRef.current) {
          const cards = faceDownRef.current.querySelectorAll('[data-card-index]');
          const cardEl = Array.from(cards).find(el => el.getAttribute('data-original-index') === String(index)) as HTMLElement;
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            startPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
        }
      }
      
      if (!card) {
        dispatch({ type: 'SELECT_PILE', pileIndex });
        return;
      }

      let endPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const pileEl = pileRefs.current[pileIndex];
      if (pileEl) {
        const rect = pileEl.getBoundingClientRect();
        endPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      const pileTop = state.centerPiles[pileIndex][state.centerPiles[pileIndex].length - 1];
      const isSuccess = canPlay(card, pileTop);

      // Hide the source card
      setHiddenCardIndex({ source, index });

      setPlayAnimation({
        card,
        startPos,
        endPos,
        source,
        isSuccess,
        phase: 'moving',
        sourceIndex: index,
      });
      setPendingAction({ pileIndex });
    } else {
      dispatch({ type: 'SELECT_PILE', pileIndex });
    }
  };

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
    setPlayAnimation(null);
    setDeckDrawAnimation(null);
    setHiddenCardIndex(null);
    setPendingAction(null);
  };

  const handleDrawFromDeck = () => {
    if (state.currentPlayer !== 'P1' || playAnimation || deckDrawAnimation) return;
    
    // Trigger animation first
    triggerDeckDrawAnimation('hand');
    
    // Then dispatch after a delay
    setTimeout(() => {
      dispatch({ type: 'DRAW_FROM_DECK' });
    }, 400);
  };

  const getLegalPileIndices = (): number[] => {
    if (!state.selectedCard) return [];

    const { source, index } = state.selectedCard;
    const player = state.players[state.currentPlayer];

    if (source === 'hand') {
      const card = player.hand[index];
      if (!card) return [];
      return getLegalPiles(card, state.centerPiles);
    } else {
      return [0, 1, 2, 3];
    }
  };

  const legalPileIndices = getLegalPileIndices();
  const hasSelection = state.selectedCard !== null;
  const isPlayerTurn = state.currentPlayer === 'P1';
  const canDraw = isPlayerTurn && !hasSelection && !state.winner && state.deck.length > 0 && !playAnimation && !deckDrawAnimation;

  const getHandPosition = () => {
    if (handRef.current) {
      const rect = handRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10 p-4 overflow-hidden">
      <div className="flex-1 flex flex-col justify-between py-2 relative">
        
        {/* TOP: Opponent area */}
        <div className="flex flex-col items-center gap-3">
          <OpponentHand cardCount={state.players.P2.hand.length} />
          
          <div className="relative">
            <HorizontalFaceDown
              cards={state.players.P2.faceDown}
              isCurrentPlayer={false}
              selectedIndex={null}
              disabled={true}
            />
            <div className="absolute left-full ml-8 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" />
          </div>
        </div>

        {/* MIDDLE: Center piles with deck */}
        <div className="flex flex-col items-center gap-4">
          <CenterPiles
            piles={state.centerPiles}
            deckCount={state.deck.length}
            legalPileIndices={legalPileIndices}
            hasSelection={hasSelection && isPlayerTurn && !playAnimation}
            onSelectPile={handleSelectPile}
            onDrawFromDeck={handleDrawFromDeck}
            canDraw={canDraw}
            pileRefs={pileRefs}
            deckRef={deckRef}
          />
        </div>

        {/* BOTTOM: Player area */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative" ref={faceDownRef}>
            <HorizontalFaceDown
              cards={state.players.P1.faceDown}
              isCurrentPlayer={isPlayerTurn && !playAnimation}
              selectedIndex={
                state.selectedCard?.source === 'faceDown' && state.currentPlayer === 'P1'
                  ? state.selectedCard.index
                  : null
              }
              onSelectCard={handleSelectFaceDownCard}
              disabled={!isPlayerTurn || (hasSelection && state.selectedCard?.source === 'hand') || !!playAnimation || !!deckDrawAnimation}
              hiddenIndex={hiddenCardIndex?.source === 'faceDown' ? hiddenCardIndex.index : undefined}
            />
            <div className="absolute left-full ml-8 top-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none" />
          </div>
          
          <div ref={handRef}>
            <PlayerHand
              cards={state.players.P1.hand}
              selectedIndex={
                state.selectedCard?.source === 'hand' && state.currentPlayer === 'P1'
                  ? state.selectedCard.index
                  : null
              }
              centerPiles={state.centerPiles}
              onSelectCard={handleSelectHandCard}
              disabled={!isPlayerTurn || !!playAnimation || !!deckDrawAnimation}
              hiddenIndex={hiddenCardIndex?.source === 'hand' ? hiddenCardIndex.index : undefined}
            />
          </div>
        </div>

        {/* Turn indicator chip */}
        <motion.div
          className="absolute w-14 h-14 flex items-center justify-center"
          style={{
            left: 'calc(50% + 170px)',
          }}
          animate={{
            top: isPlayerTurn ? 'calc(100% - 236px)' : '100px',
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 18,
            mass: 1,
          }}
        >
          <TurnIndicator currentPlayer={state.currentPlayer} />
        </motion.div>
      </div>

      {/* Card play animation overlay */}
      <AnimatePresence>
        {playAnimation && (
          <>
            <motion.div
              key="animated-card"
              className="fixed pointer-events-none z-50"
              initial={{
                x: playAnimation.startPos.x - 32,
                y: playAnimation.startPos.y - 48,
                rotateY: playAnimation.source === 'faceDown' ? 180 : 0,
                scale: 1,
              }}
              animate={{
                x: playAnimation.phase === 'toHand' 
                  ? getHandPosition().x - 32 
                  : playAnimation.endPos.x - 32,
                y: playAnimation.phase === 'toHand' 
                  ? getHandPosition().y - 48 
                  : playAnimation.endPos.y - 48,
                rotateY: 0,
                scale: playAnimation.phase === 'result' ? 1.15 : 1,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 22,
                rotateY: { type: 'tween', duration: 0.35 },
              }}
              style={{ perspective: 1000 }}
            >
              <Card 
                card={playAnimation.card} 
                faceUp={playAnimation.phase !== 'moving' || playAnimation.source !== 'faceDown'} 
              />
            </motion.div>

            {playAnimation.phase === 'result' && (
              <motion.div
                key="result-indicator"
                className="fixed pointer-events-none z-50"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  left: playAnimation.endPos.x - 20,
                  top: playAnimation.endPos.y - 80,
                }}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    playAnimation.isSuccess ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  <span className="text-white text-xl font-bold">
                    {playAnimation.isSuccess ? '✓' : '✗'}
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Deck draw animation */}
      <AnimatePresence>
        {deckDrawAnimation && (
          <motion.div
            key="deck-draw-card"
            className="fixed pointer-events-none z-50"
            initial={{
              x: deckDrawAnimation.startPos.x - 32,
              y: deckDrawAnimation.startPos.y - 48,
              scale: 1,
            }}
            animate={{
              x: deckDrawAnimation.endPos.x - 32,
              y: deckDrawAnimation.endPos.y - 48,
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 20,
            }}
          >
            <Card card={null} faceUp={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win overlay */}
      <WinOverlay winner={state.winner} onPlayAgain={handlePlayAgain} />
    </div>
  );
}

export default App;
