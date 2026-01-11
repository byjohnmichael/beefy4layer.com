import { useReducer, useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer } from '../game/reducer';
import { createInitialState } from '../game/initialState';
import { getLegalPiles, canPlay, SYMBOLS } from '../game/engine/rules';
import { getBotMove, getBotPileSelection } from '../game/bot';
import { CardLayer } from '../components/CardLayer';
import { Card } from '../components/Card';
import { TurnIndicator } from '../components/TurnIndicator';
import { WinOverlay } from '../components/WinOverlay';
import type { Card as CardType, PlayerId } from '../game/types';
import type { CardTheme } from '../themes/themes';
import type { Room } from '../lib/multiplayer';
import { subscribeToRoom, updateGameState, endGame } from '../lib/multiplayer';

export type GameMode = 'singleplayer' | 'multiplayer';

interface GameProps {
    mode: GameMode;
    onExit: () => void;
    myTheme: CardTheme; // Your selected theme
    room?: Room | null; // Room data for multiplayer
    isHost?: boolean; // Are we the host in multiplayer?
}

interface LayoutPositions {
    deckPos: { x: number; y: number };
    pilePositions: { x: number; y: number }[];
    p1HandCenter: { x: number; y: number };
    p1FaceDownCenter: { x: number; y: number };
    p2HandCenter: { x: number; y: number };
    p2FaceDownCenter: { x: number; y: number };
}

type DrawAnimation = {
    id: string;
    card: CardType; // The actual card being drawn
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    flipToFaceUp: boolean;
    target: 'p1' | 'p2';
    progress: 'animating' | 'done';
};

type FaceDownPlayAnimation = {
    id: string;
    card: CardType;
    slotIndex: number;
    pileIndex: number;
    player: 'P1' | 'P2';
    isSuccess: boolean;
    phase: 'moving' | 'revealed' | 'retreating' | 'replacing' | 'done';
    startPos: { x: number; y: number };
    pilePos: { x: number; y: number };
    handPos: { x: number; y: number };
    replacementCard: CardType | null;
};

type GamePhase = 'dealing' | 'coinFlip' | 'playing';

export function Game({ mode, onExit, myTheme, room, isHost = true }: GameProps) {
    // For multiplayer, use the room's game state if available
    const initialState =
        mode === 'multiplayer' && room?.game_state ? room.game_state : createInitialState();

    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Bot is only active in singleplayer mode
    const isBotEnabled = mode === 'singleplayer';

    // Multiplayer: determine which player we are
    // Host = P1, Guest = P2
    const myPlayerId: PlayerId = mode === 'multiplayer' ? (isHost ? 'P1' : 'P2') : 'P1';
    const isMyTurn = state.currentPlayer === myPlayerId;

    // Suit colors for face-up cards (always your theme)
    const suitColors = {
        clubsSpades: myTheme.primary.solid,
        heartsDiamonds: myTheme.secondary.solid,
        joker: myTheme.neutral.solid,
    };

    // Track if we need to sync state to server
    const lastSyncedStateRef = useRef<string>('');
    const isProcessingRemoteUpdate = useRef(false);
    const [layout, setLayout] = useState<LayoutPositions | null>(null);
    const [drawAnimation, setDrawAnimation] = useState<DrawAnimation | null>(null);
    const [pendingDraw, setPendingDraw] = useState<{ target: 'p1' | 'p2' } | null>(null);
    const [faceDownPlay, setFaceDownPlay] = useState<FaceDownPlayAnimation | null>(null);

    // Game intro animation state
    // In multiplayer, skip dealing animation since game state is already set
    const [gamePhase, setGamePhase] = useState<GamePhase>(
        mode === 'multiplayer' ? 'playing' : 'dealing',
    );
    const [dealtCards, setDealtCards] = useState<Set<string>>(new Set());
    const [coinFlipResult, setCoinFlipResult] = useState<'P1' | 'P2' | null>(null);
    const [coinFlipAnimating, setCoinFlipAnimating] = useState(false);

    // Refs for measuring positions
    const deckRef = useRef<HTMLDivElement>(null);
    const pilesRef = useRef<HTMLDivElement>(null);
    const p1HandRef = useRef<HTMLDivElement>(null);
    const p1FaceDownRef = useRef<HTMLDivElement>(null);
    const p2HandRef = useRef<HTMLDivElement>(null);
    const p2FaceDownRef = useRef<HTMLDivElement>(null);

    // Measure layout positions
    const measureLayout = useCallback(() => {
        const newLayout: LayoutPositions = {
            deckPos: { x: 0, y: 0 },
            pilePositions: [],
            p1HandCenter: { x: window.innerWidth / 2, y: window.innerHeight - 80 },
            p1FaceDownCenter: { x: window.innerWidth / 2, y: window.innerHeight - 220 },
            p2HandCenter: { x: window.innerWidth / 2, y: 60 },
            p2FaceDownCenter: { x: window.innerWidth / 2, y: 140 },
        };

        if (deckRef.current) {
            const rect = deckRef.current.getBoundingClientRect();
            newLayout.deckPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }

        if (pilesRef.current) {
            const pileEls = pilesRef.current.querySelectorAll('[data-pile]');
            pileEls.forEach((el) => {
                const rect = el.getBoundingClientRect();
                newLayout.pilePositions.push({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                });
            });
        }

        if (p1HandRef.current) {
            const rect = p1HandRef.current.getBoundingClientRect();
            newLayout.p1HandCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }

        if (p1FaceDownRef.current) {
            const rect = p1FaceDownRef.current.getBoundingClientRect();
            newLayout.p1FaceDownCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }

        if (p2HandRef.current) {
            const rect = p2HandRef.current.getBoundingClientRect();
            newLayout.p2HandCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }

        if (p2FaceDownRef.current) {
            const rect = p2FaceDownRef.current.getBoundingClientRect();
            newLayout.p2FaceDownCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }

        setLayout(newLayout);
    }, []);

    useLayoutEffect(() => {
        measureLayout();
        window.addEventListener('resize', measureLayout);
        return () => window.removeEventListener('resize', measureLayout);
    }, [measureLayout]);

    // Re-measure after state changes that affect layout
    useEffect(() => {
        const timer = setTimeout(measureLayout, 50);
        return () => clearTimeout(timer);
    }, [state.players.P1.faceDown, state.players.P2.faceDown, measureLayout]);

    // === MULTIPLAYER SYNC ===
    // Subscribe to room updates in multiplayer
    useEffect(() => {
        if (mode !== 'multiplayer' || !room) return;

        const unsubscribe = subscribeToRoom(room.id, (updatedRoom) => {
            if (updatedRoom.game_state && !isProcessingRemoteUpdate.current) {
                const remoteStateStr = JSON.stringify(updatedRoom.game_state);

                // Only update if state is different and we didn't just send this update
                if (remoteStateStr !== lastSyncedStateRef.current) {
                    isProcessingRemoteUpdate.current = true;

                    // Apply the remote state by resetting and replaying
                    // For simplicity, we dispatch a special action to replace state
                    dispatch({ type: 'SYNC_STATE', state: updatedRoom.game_state } as any);

                    lastSyncedStateRef.current = remoteStateStr;

                    setTimeout(() => {
                        isProcessingRemoteUpdate.current = false;
                    }, 100);
                }
            }
        });

        return unsubscribe;
    }, [mode, room?.id]);

    // Sync local state changes to server in multiplayer
    useEffect(() => {
        if (mode !== 'multiplayer' || !room || isProcessingRemoteUpdate.current) return;

        const stateStr = JSON.stringify(state);

        // Don't sync if this is the same state we just received
        if (stateStr === lastSyncedStateRef.current) return;

        // Only sync if it's our turn changing to opponent's turn (we made a move)
        // or if game just ended
        const shouldSync = !isMyTurn || state.winner !== null;

        if (shouldSync && gamePhase === 'playing') {
            lastSyncedStateRef.current = stateStr;

            const nextPlayer = state.currentPlayer === 'P1' ? 'host' : 'guest';

            if (state.winner) {
                endGame(room.id, state);
            } else {
                updateGameState(room.id, state, nextPlayer as 'host' | 'guest');
            }
        }
    }, [mode, room?.id, state, isMyTurn, gamePhase]);

    // === DEALING ANIMATION ===
    // Start dealing animation once layout is measured
    useEffect(() => {
        if (gamePhase !== 'dealing' || !layout) return;

        // Build the deal sequence:
        // 1. Deal 4 face-up cards to center piles
        // 2. Alternate dealing face-down cards (P1, P2, P1, P2, P1, P2)
        const dealSequence: { id: string; delay: number }[] = [];
        let delay = 300; // Initial delay
        const cardDelay = 120; // Time between each card

        // Face-up cards to piles
        state.centerPiles.forEach((pile) => {
            if (pile.length > 0) {
                dealSequence.push({ id: pile[0].id, delay });
                delay += cardDelay;
            }
        });

        // Face-down cards alternating
        const p1FaceDown = state.players.P1.faceDown.filter((c) => c !== null) as CardType[];
        const p2FaceDown = state.players.P2.faceDown.filter((c) => c !== null) as CardType[];
        const maxFaceDown = Math.max(p1FaceDown.length, p2FaceDown.length);

        for (let i = 0; i < maxFaceDown; i++) {
            if (p1FaceDown[i]) {
                dealSequence.push({ id: p1FaceDown[i].id, delay });
                delay += cardDelay;
            }
            if (p2FaceDown[i]) {
                dealSequence.push({ id: p2FaceDown[i].id, delay });
                delay += cardDelay;
            }
        }

        // Schedule each card to be dealt
        dealSequence.forEach(({ id, delay: cardDelay }) => {
            setTimeout(() => {
                setDealtCards((prev) => new Set([...prev, id]));
            }, cardDelay);
        });

        // After all cards dealt, start coin flip
        setTimeout(() => {
            setGamePhase('coinFlip');
            setCoinFlipAnimating(true);

            // Coin flip animation duration
            setTimeout(() => {
                // Randomly determine first player
                const firstPlayer = Math.random() < 0.5 ? 'P1' : 'P2';
                setCoinFlipResult(firstPlayer);
                setCoinFlipAnimating(false);

                // After coin settles, start the game
                setTimeout(() => {
                    setGamePhase('playing');
                    // Set the first player in game state
                    dispatch({ type: 'SET_FIRST_PLAYER', player: firstPlayer });
                }, 800);
            }, 1500); // Coin flip duration
        }, delay + 500);
    }, [
        gamePhase,
        layout,
        state.centerPiles,
        state.players.P1.faceDown,
        state.players.P2.faceDown,
        state.currentPlayer,
    ]);

    const triggerDrawAnimation = useCallback(
        (target: 'p1' | 'p2') => {
            if (!layout || drawAnimation || state.deck.length === 0) return;

            // Peek at the card that will be drawn (top of deck)
            const cardToDraw = state.deck[state.deck.length - 1];
            const endPos = target === 'p1' ? layout.p1HandCenter : layout.p2HandCenter;

            setDrawAnimation({
                id: `draw-${Date.now()}`,
                card: cardToDraw,
                startPos: layout.deckPos,
                endPos,
                flipToFaceUp: target === 'p1',
                target,
                progress: 'animating',
            });
            setPendingDraw({ target });
        },
        [layout, drawAnimation, state.deck],
    );

    // Function to trigger face-down play animation
    const triggerFaceDownPlayAnimation = useCallback(
        (slotIndex: number, pileIndex: number, player: 'P1' | 'P2') => {
            if (!layout || faceDownPlay) return;

            const playerState = state.players[player];
            const card = playerState.faceDown[slotIndex];
            if (!card) return;

            // Get pile top card to check success
            const pile = state.centerPiles[pileIndex];
            const pileTop = pile[pile.length - 1];
            const isSuccess = canPlay(card, pileTop);

            // Calculate the face-down slot position
            const faceDownCards = playerState.faceDown.filter((c) => c !== null);
            const fdCount = faceDownCards.length;
            const spacing = 76;
            const totalWidth = (fdCount - 1) * spacing;
            const faceDownCenter =
                player === 'P1' ? layout.p1FaceDownCenter : layout.p2FaceDownCenter;

            // Find this card's visual index among non-null cards
            let visualIndex = 0;
            for (let i = 0; i < slotIndex; i++) {
                if (playerState.faceDown[i] !== null) visualIndex++;
            }
            const startX = faceDownCenter.x - totalWidth / 2 + visualIndex * spacing;
            const startY = faceDownCenter.y;

            // Get replacement card (if fail)
            const replacementCard =
                !isSuccess && state.deck.length > 0 ? state.deck[state.deck.length - 1] : null;

            setFaceDownPlay({
                id: `fdp-${Date.now()}`,
                card,
                slotIndex,
                pileIndex,
                player,
                isSuccess,
                phase: 'moving',
                startPos: { x: startX, y: startY },
                pilePos: layout.pilePositions[pileIndex],
                handPos: player === 'P1' ? layout.p1HandCenter : layout.p2HandCenter,
                replacementCard,
            });
        },
        [layout, faceDownPlay, state],
    );

    // Bot AI - acts instantly after initial delay
    const executeBotMove = useCallback(() => {
        if (state.currentPlayer !== 'P2' || state.winner || drawAnimation || faceDownPlay) return;

        if (state.selectedCard) {
            const pileAction = getBotPileSelection(state);
            if (pileAction && pileAction.type === 'SELECT_PILE') {
                // Check if this is a face-down play - trigger animation
                if (state.selectedCard.source === 'faceDown') {
                    triggerFaceDownPlayAnimation(
                        state.selectedCard.index,
                        pileAction.pileIndex,
                        'P2',
                    );
                    dispatch({ type: 'CLEAR_SELECTIONS' });
                } else {
                    dispatch(pileAction);
                }
            }
        } else {
            const action = getBotMove(state);
            if (action) {
                // If bot is drawing, trigger animation
                if (action.type === 'DRAW_FROM_DECK') {
                    triggerDrawAnimation('p2');
                } else {
                    dispatch(action);
                }
            }
        }
    }, [state, drawAnimation, faceDownPlay, triggerDrawAnimation, triggerFaceDownPlayAnimation]);

    useEffect(() => {
        // Only allow bot moves during playing phase
        if (gamePhase !== 'playing') return;
        if (
            isBotEnabled &&
            state.currentPlayer === 'P2' &&
            !state.winner &&
            !drawAnimation &&
            !faceDownPlay
        ) {
            const timer = setTimeout(executeBotMove, 500);
            return () => clearTimeout(timer);
        }
    }, [
        gamePhase,
        isBotEnabled,
        state.currentPlayer,
        state.winner,
        state.selectedCard,
        drawAnimation,
        faceDownPlay,
        executeBotMove,
    ]);

    const handleSelectHandCard = (index: number) => {
        if (!isMyTurn) return;
        dispatch({ type: 'SELECT_HAND_CARD', index });
    };

    const handleSelectFaceDownCard = (index: number) => {
        if (!isMyTurn) return;
        dispatch({ type: 'SELECT_FACEDOWN_CARD', index });
    };

    const handleSelectPile = (pileIndex: number) => {
        if (!isMyTurn) return;

        // Check if this is a face-down card play - intercept for animation
        if (state.selectedCard?.source === 'faceDown' && layout && !faceDownPlay) {
            // Always use 'P1' for animation since my cards are at bottom (P1 position) in perspective mode
            triggerFaceDownPlayAnimation(state.selectedCard.index, pileIndex, 'P1');
            dispatch({ type: 'CLEAR_SELECTIONS' });
            return;
        }

        // Regular hand card play
        dispatch({ type: 'SELECT_PILE', pileIndex });
    };

    const handlePlayAgain = () => {
        dispatch({ type: 'RESET_GAME' });
    };

    // Handle draw animation completion
    useEffect(() => {
        if (!drawAnimation || drawAnimation.progress !== 'animating') return;

        const timer = setTimeout(() => {
            setDrawAnimation((prev) => (prev ? { ...prev, progress: 'done' } : null));
        }, 500);

        return () => clearTimeout(timer);
    }, [drawAnimation]);

    useEffect(() => {
        if (drawAnimation?.progress === 'done' && pendingDraw) {
            dispatch({ type: 'DRAW_FROM_DECK' });
            // Small delay before clearing animation to allow CardLayer to render the card first
            setTimeout(() => {
                setDrawAnimation(null);
                setPendingDraw(null);
            }, 50);
        }
    }, [drawAnimation, pendingDraw]);

    // Handle face-down play animation phases
    useEffect(() => {
        if (!faceDownPlay) return;

        const timings = {
            moving: 500, // Time to move to pile and flip
            revealed: 800, // Time to show success/fail indicator
            retreating: 400, // Time to move to hand (fail only)
            replacing: 500, // Time for replacement card to appear (fail only)
        };

        if (faceDownPlay.phase === 'moving') {
            const timer = setTimeout(() => {
                setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'revealed' } : null));
            }, timings.moving);
            return () => clearTimeout(timer);
        }

        if (faceDownPlay.phase === 'revealed') {
            const timer = setTimeout(() => {
                if (faceDownPlay.isSuccess) {
                    // Success - dispatch and finish
                    setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'done' } : null));
                } else {
                    // Fail - start retreating to hand
                    setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'retreating' } : null));
                }
            }, timings.revealed);
            return () => clearTimeout(timer);
        }

        if (faceDownPlay.phase === 'retreating') {
            const timer = setTimeout(() => {
                if (faceDownPlay.replacementCard) {
                    setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'replacing' } : null));
                } else {
                    setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'done' } : null));
                }
            }, timings.retreating);
            return () => clearTimeout(timer);
        }

        if (faceDownPlay.phase === 'replacing') {
            const timer = setTimeout(() => {
                setFaceDownPlay((prev) => (prev ? { ...prev, phase: 'done' } : null));
            }, timings.replacing);
            return () => clearTimeout(timer);
        }

        if (faceDownPlay.phase === 'done') {
            // Dispatch the actual state change
            dispatch({ type: 'SELECT_FACEDOWN_CARD', index: faceDownPlay.slotIndex });
            dispatch({ type: 'SELECT_PILE', pileIndex: faceDownPlay.pileIndex });

            setTimeout(() => {
                setFaceDownPlay(null);
            }, 50);
        }
    }, [faceDownPlay]);

    const handleDrawFromDeck = () => {
        if (!isMyTurn || drawAnimation) return;
        // Always animate to bottom (p1 position) since that's where MY hand is rendered
        triggerDrawAnimation('p1');
    };

    const isPlayerTurn = isMyTurn;
    const hasSelection = state.selectedCard !== null;
    const canDraw =
        isPlayerTurn && !hasSelection && !state.winner && state.deck.length > 0 && !drawAnimation;

    // Determine legal piles for highlighting
    const legalPileIndices = (() => {
        if (!state.selectedCard) return [];
        const { source, index } = state.selectedCard;
        const player = state.players[state.currentPlayer];
        if (source === 'hand') {
            const card = player.hand[index];
            if (!card) return [];
            return getLegalPiles(card, state.centerPiles);
        }
        return [0, 1, 2, 3];
    })();

    return (
        <div className="min-h-screen flex flex-col relative z-10 p-4 overflow-hidden">
            <div className="flex-1 flex flex-col justify-between py-2 relative">
                {/* TOP: Opponent area */}
                <div className="flex flex-col items-center gap-2">
                    {/* Placeholder for opponent hand - positioned so cards are partially off-screen */}
                    <div
                        ref={p2HandRef}
                        className="flex items-center justify-center"
                        style={{ minWidth: '400px', height: '48px', marginTop: '-30px' }}
                    />

                    {/* Placeholder for opponent face-down cards */}
                    <div
                        ref={p2FaceDownRef}
                        className="h-24 flex items-center justify-center"
                        style={{ minWidth: '320px' }}
                    />
                </div>

                {/* MIDDLE: Deck and pile placeholders */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        {/* Deck placeholder */}
                        <motion.div
                            ref={deckRef}
                            className={`absolute right-full mr-8 w-16 h-24 rounded-lg ${canDraw ? 'cursor-pointer' : ''}`}
                            whileHover={canDraw ? { scale: 1.05 } : {}}
                            whileTap={canDraw ? { scale: 0.95 } : {}}
                            onClick={canDraw ? handleDrawFromDeck : undefined}
                            style={{
                                background:
                                    state.deck.length > 0
                                        ? myTheme.neutral.gradient
                                        : 'transparent',
                                border: state.deck.length === 0 ? '2px dashed #4a5568' : 'none',
                                boxShadow:
                                    state.deck.length > 0
                                        ? `0 4px 12px ${myTheme.neutral.glow}`
                                        : 'none',
                            }}
                        >
                            {state.deck.length > 0 && (
                                <>
                                    <div className="absolute inset-1 rounded border border-white/20" />
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-2xl opacity-40 text-white">{SYMBOLS.star}</span>
                                    </div>
                                </>
                            )}
                            {/* Card count badge */}
                            <div className="absolute -bottom-2 -right-2 min-w-6 h-6 px-1.5 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-xs font-bold text-white/90">
                                {state.deck.length}
                            </div>
                            {canDraw && (
                                <div
                                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
                                    style={{ color: myTheme.secondary.solid }}
                                >
                                    Draw
                                </div>
                            )}
                        </motion.div>

                        {/* Pile placeholders */}
                        <div ref={pilesRef} className="flex gap-4">
                            {state.centerPiles.map((_, index) => {
                                const isLegal = legalPileIndices.includes(index);
                                const isDimmed = hasSelection && isPlayerTurn && !isLegal;

                                return (
                                    <div
                                        key={index}
                                        data-pile={index}
                                        className={`w-16 h-24 rounded-lg border-2 transition-all ${
                                            hasSelection && isPlayerTurn && isLegal
                                                ? 'border-emerald-400 bg-emerald-400/10 cursor-pointer'
                                                : isDimmed
                                                  ? 'border-gray-600/30 opacity-40'
                                                  : 'border-gray-600/50'
                                        }`}
                                        onClick={
                                            hasSelection && isPlayerTurn && isLegal
                                                ? () => handleSelectPile(index)
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* BOTTOM: Player area */}
                <div className="flex flex-col items-center gap-3">
                    {/* Placeholder for player face-down cards */}
                    <div
                        ref={p1FaceDownRef}
                        className="h-24 flex items-center justify-center"
                        style={{ minWidth: '320px' }}
                    />

                    {/* Placeholder for player hand */}
                    <div
                        ref={p1HandRef}
                        className="h-36 flex items-center justify-center"
                        style={{ minWidth: '400px' }}
                    />
                </div>

                {/* Turn indicator chip */}
                <motion.div
                    className="absolute w-14 h-14 flex items-center justify-center"
                    style={{
                        left: 'calc(50% + 170px)', // Always to the right of piles
                    }}
                    animate={{
                        top:
                            gamePhase === 'playing'
                                ? isMyTurn
                                    ? 'calc(100% - 240px)'  // Position of my chip
                                    : '56px'                // Position of opponent's chip
                                : 'calc(50% - 92px)',       // Position of chip during dealing/coinFlip
                        rotate: coinFlipAnimating ? 360 : 0, // Spin during coin flip
                    }}
                    transition={{
                        top: { type: 'spring', stiffness: 100, damping: 18, mass: 1 },
                        rotate: { duration: 1.5, ease: [0.4, 0, 0.2, 1] },
                    }}
                >
                    <TurnIndicator
                        currentPlayer={
                            gamePhase === 'playing'
                                ? isMyTurn
                                    ? 'P1'
                                    : 'P2'
                                : coinFlipResult || 'P1'
                        }
                        p1Color={myTheme.primary}
                        p2Color={myTheme.secondary}
                        neutralColor={myTheme.neutral}
                        isFlipping={coinFlipAnimating}
                        showNeutral={gamePhase === 'dealing'}
                    />
                </motion.div>
            </div>

            {/* Card Layer - renders all actual cards */}
            {layout && (
                <CardLayer
                    state={state}
                    layout={layout}
                    onSelectHandCard={handleSelectHandCard}
                    onSelectFaceDownCard={handleSelectFaceDownCard}
                    onSelectPile={handleSelectPile}
                    selectedCard={state.selectedCard}
                    isPlayerTurn={isPlayerTurn}
                    drawingCardId={drawAnimation?.card.id}
                    hiddenCardIds={[
                        faceDownPlay?.card.id,
                        faceDownPlay?.phase === 'replacing'
                            ? faceDownPlay.replacementCard?.id
                            : undefined,
                    ].filter((id): id is string => !!id)}
                    myTheme={myTheme}
                    dealtCards={dealtCards}
                    isDealing={gamePhase === 'dealing'}
                    myPlayerId={myPlayerId}
                />
            )}

            {/* Deck draw animation - card pulled from under the deck */}
            <AnimatePresence mode="wait">
                {drawAnimation && (
                    <motion.div
                        key={drawAnimation.id}
                        className="fixed pointer-events-none"
                        initial={{
                            x: drawAnimation.startPos.x - 32,
                            y: drawAnimation.startPos.y - 48 + 4, // Start slightly below deck center (pulled from under)
                            scale: 0.95,
                            zIndex: 5, // Start below deck visually
                        }}
                        animate={{
                            x: drawAnimation.endPos.x - 32,
                            y: drawAnimation.endPos.y - 48,
                            scale: 1,
                            zIndex: 100, // Rise above as it moves
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 180,
                            damping: 22,
                            zIndex: { delay: 0.05 },
                        }}
                        style={{
                            perspective: 1000,
                        }}
                    >
                        {/* Double-sided card that flips */}
                        <motion.div
                            className="relative w-16 h-24"
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: drawAnimation.flipToFaceUp ? 180 : 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 120,
                                damping: 18,
                                delay: 0.15,
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Back face (face-down card) */}
                            <div
                                className="absolute inset-0"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <Card
                                    card={null}
                                    faceUp={false}
                                    isSelected={false}
                                    isDimmed={false}
                                    isHighlighted={false}
                                    backColor={myTheme.neutral}
                                />
                            </div>

                            {/* Front face (face-up card) - rotated 180deg */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                }}
                            >
                                <Card
                                    card={drawAnimation.card}
                                    faceUp={true}
                                    isSelected={false}
                                    isDimmed={false}
                                    isHighlighted={false}
                                    suitColors={suitColors}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Face-down play animation */}
            <AnimatePresence>
                {faceDownPlay && (
                    <>
                        {/* The card being played */}
                        <motion.div
                            key={faceDownPlay.id}
                            className="fixed pointer-events-none"
                            initial={{
                                x: faceDownPlay.startPos.x - 32,
                                y: faceDownPlay.startPos.y - 48,
                                zIndex: 200,
                            }}
                            animate={{
                                x:
                                    faceDownPlay.phase === 'retreating' ||
                                    faceDownPlay.phase === 'replacing' ||
                                    faceDownPlay.phase === 'done'
                                        ? faceDownPlay.handPos.x - 32
                                        : faceDownPlay.pilePos.x - 32,
                                y:
                                    faceDownPlay.phase === 'retreating' ||
                                    faceDownPlay.phase === 'replacing' ||
                                    faceDownPlay.phase === 'done'
                                        ? faceDownPlay.handPos.y - 48
                                        : faceDownPlay.pilePos.y -
                                          48 +
                                          (faceDownPlay.phase === 'revealed' &&
                                          !faceDownPlay.isSuccess
                                              ? -10
                                              : 0),
                                zIndex: 200,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 25,
                            }}
                            style={{ perspective: 1000 }}
                        >
                            {/* Double-sided flipping card - flips during movement */}
                            <motion.div
                                className="relative w-16 h-24"
                                initial={{ rotateY: 0 }}
                                animate={{
                                    rotateY: 180, // Start flipping immediately as it moves
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 15,
                                }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Back face - use player's card back color */}
                                <div
                                    className="absolute inset-0"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <Card
                                        card={null}
                                        faceUp={false}
                                        backColor={
                                            faceDownPlay.player === 'P1'
                                                ? myTheme.primary
                                                : myTheme.secondary
                                        }
                                    />
                                </div>
                                {/* Front face */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                    }}
                                >
                                    <Card
                                        card={faceDownPlay.card}
                                        faceUp={true}
                                        suitColors={suitColors}
                                    />
                                </div>
                            </motion.div>

                            {/* Success/Fail indicator */}
                            <AnimatePresence>
                                {faceDownPlay.phase === 'revealed' && (
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                                                faceDownPlay.isSuccess
                                                    ? 'bg-emerald-500/90 text-white'
                                                    : 'bg-red-500/90 text-white'
                                            }`}
                                            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                                        >
                                            {faceDownPlay.isSuccess ? '✓' : '✗'}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Replacement card animation (from deck to face-down slot) */}
                        {faceDownPlay.phase === 'replacing' &&
                            faceDownPlay.replacementCard &&
                            layout && (
                                <motion.div
                                    key={`${faceDownPlay.id}-replacement`}
                                    className="fixed pointer-events-none"
                                    initial={{
                                        x: layout.deckPos.x - 32,
                                        y: layout.deckPos.y - 48 + 4,
                                        scale: 0.95,
                                        zIndex: 150,
                                    }}
                                    animate={{
                                        x: faceDownPlay.startPos.x - 32,
                                        y: faceDownPlay.startPos.y - 48,
                                        scale: 1,
                                        zIndex: 150,
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 180,
                                        damping: 22,
                                    }}
                                >
                                    <Card
                                        card={null}
                                        faceUp={false}
                                        backColor={
                                            faceDownPlay.player === 'P1'
                                                ? myTheme.primary
                                                : myTheme.secondary
                                        }
                                    />
                                </motion.div>
                            )}
                    </>
                )}
            </AnimatePresence>

            {/* Win overlay */}
            <WinOverlay winner={state.winner} onPlayAgain={handlePlayAgain} onExit={onExit} />
        </div>
    );
}

export default Game;
