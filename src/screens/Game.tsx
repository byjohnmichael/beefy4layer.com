import { useReducer, useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer } from '../game/reducer';
import { createInitialState } from '../game/initialState';
import { getLegalPiles, canPlay } from '../game/engine/rules';
import { getBotMove, getBotPileSelection } from '../game/bot';
import { CardLayer } from '../components/CardLayer';
import { Card } from '../components/Card';
import { TurnIndicator } from '../components/TurnIndicator';
import { WinOverlay } from '../components/WinOverlay';
import type { Card as CardType, PlayerId } from '../game/types';
import type { CardTheme } from '../themes/themes';
import type { Room } from '../lib/multiplayer';
import { subscribeToRoom, updateGameState, endGame, endGameByInactivity } from '../lib/multiplayer';

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

type DrawGambleAnimation = {
    id: string;
    card: CardType;
    pileIndex: number;
    isSuccess: boolean;
    phase: 'moving' | 'revealed' | 'retreating' | 'done';
    startPos: { x: number; y: number };
    pilePos: { x: number; y: number };
    handPos: { x: number; y: number };
};

type GamePhase = 'dealing' | 'coinFlip' | 'playing';

// Check if we're running on localhost
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export function Game({ mode, onExit, myTheme, room, isHost = true }: GameProps) {
    // For multiplayer, use the room's game state if available
    const initialState =
        mode === 'multiplayer' && room?.game_state ? room.game_state : createInitialState();

    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Debug mode state (only available on localhost)
    const [showDebug, setShowDebug] = useState(isLocalhost);

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
    };

    // Track if we need to sync state to server
    const lastSyncedStateRef = useRef<string>('');
    const isProcessingRemoteUpdate = useRef(false);
    const [layout, setLayout] = useState<LayoutPositions | null>(null);
    const [drawAnimation, setDrawAnimation] = useState<DrawAnimation | null>(null);
    const [pendingDraw, setPendingDraw] = useState<{ target: 'p1' | 'p2' } | null>(null);
    const [faceDownPlay, setFaceDownPlay] = useState<FaceDownPlayAnimation | null>(null);
    const [drawGambleAnimation, setDrawGambleAnimation] = useState<DrawGambleAnimation | null>(null);

    // Game intro animation state
    // In multiplayer, skip dealing animation since game state is already set
    const [gamePhase, setGamePhase] = useState<GamePhase>(
        mode === 'multiplayer' ? 'playing' : 'dealing',
    );
    const [dealtCards, setDealtCards] = useState<Set<string>>(new Set());
    const [coinFlipResult, setCoinFlipResult] = useState<'P1' | 'P2' | null>(null);
    const [coinFlipAnimating, setCoinFlipAnimating] = useState(false);

    // 5-second lockout: pre-decide coin flip and track game start time
    const [gameStartTime, setGameStartTime] = useState<number | null>(null);
    const [preDecidedFirstPlayer, setPreDecidedFirstPlayer] = useState<'P1' | 'P2' | null>(null);

    // Move timer state (multiplayer only)
    const [lastMoveAt, setLastMoveAt] = useState<string | null>(room?.last_move_at || null);
    const [secondsRemaining, setSecondsRemaining] = useState(60);
    const [gameEndedByInactivity, setGameEndedByInactivity] = useState(false);

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

    // Debug toggle keyboard handler (localhost only)
    useEffect(() => {
        if (!isLocalhost) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'd' || e.key === 'D') {
                setShowDebug(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // === MULTIPLAYER SYNC ===
    // Subscribe to room updates in multiplayer
    useEffect(() => {
        if (mode !== 'multiplayer' || !room) return;

        const unsubscribe = subscribeToRoom(room.id, (updatedRoom) => {
            // Check if game ended by inactivity (status changed to finished but no winner)
            if (updatedRoom.status === 'finished' && updatedRoom.game_state && !updatedRoom.game_state.winner) {
                setGameEndedByInactivity(true);
                return;
            }

            // Update last move timestamp for timer
            if (updatedRoom.last_move_at) {
                setLastMoveAt(updatedRoom.last_move_at);
            }

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

    // === MOVE TIMER (Multiplayer only) ===
    // Countdown timer based on lastMoveAt
    useEffect(() => {
        if (mode !== 'multiplayer' || !lastMoveAt || gamePhase !== 'playing' || state.winner || gameEndedByInactivity) return;

        const updateTimer = () => {
            const lastMove = new Date(lastMoveAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - lastMove) / 1000);
            const remaining = Math.max(0, 60 - elapsed);
            setSecondsRemaining(remaining);

            // Timer expired - end the game
            if (remaining === 0 && room) {
                endGameByInactivity(room.id);
                setGameEndedByInactivity(true);
            }
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [mode, lastMoveAt, gamePhase, state.winner, gameEndedByInactivity, room]);

    // === DEALING ANIMATION ===
    // Start dealing animation once layout is measured
    useEffect(() => {
        if (gamePhase !== 'dealing' || !layout) return;

        // PRE-DECIDE coin flip IMMEDIATELY (before any animation)
        // This ensures the result is known even if animations break
        const firstPlayer = Math.random() < 0.5 ? 'P1' : 'P2';
        setPreDecidedFirstPlayer(firstPlayer);
        setGameStartTime(Date.now());

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

            // Coin flip animation duration - use pre-decided result
            setTimeout(() => {
                setCoinFlipResult(firstPlayer);
                setCoinFlipAnimating(false);
            }, 1500); // Coin flip duration
            // Note: Game start is handled by the 5-second lockout effect below
        }, delay + 500);
    }, [
        gamePhase,
        layout,
        state.centerPiles,
        state.players.P1.faceDown,
        state.players.P2.faceDown,
        state.currentPlayer,
    ]);

    // === 5-SECOND LOCKOUT ===
    // Players cannot act until 5 seconds after game start, regardless of animation state
    // This ensures the game becomes playable even if animations break
    useEffect(() => {
        if (!gameStartTime || gamePhase === 'playing' || !preDecidedFirstPlayer) return;

        const fiveSecondTimer = setTimeout(() => {
            // Force game to start after 5 seconds
            setCoinFlipAnimating(false);
            setCoinFlipResult(preDecidedFirstPlayer);
            setGamePhase('playing');
            dispatch({ type: 'SET_FIRST_PLAYER', player: preDecidedFirstPlayer });
        }, 5000);

        return () => clearTimeout(fiveSecondTimer);
    }, [gameStartTime, gamePhase, preDecidedFirstPlayer]);

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

    // Function to trigger draw gamble play animation
    const triggerDrawGambleAnimation = useCallback(
        (pileIndex: number, player: 'P1' | 'P2') => {
            if (!layout || drawGambleAnimation || !state.pendingDrawGamble) return;

            const card = state.pendingDrawGamble;

            // Get pile top card to check success
            const pile = state.centerPiles[pileIndex];
            const pileTop = pile[pile.length - 1];
            const isSuccess = canPlay(card, pileTop);

            setDrawGambleAnimation({
                id: `dg-${Date.now()}`,
                card,
                pileIndex,
                isSuccess,
                phase: 'moving',
                startPos: layout.deckPos,
                pilePos: layout.pilePositions[pileIndex],
                handPos: player === 'P1' ? layout.p1HandCenter : layout.p2HandCenter,
            });
        },
        [layout, drawGambleAnimation, state.pendingDrawGamble, state.centerPiles],
    );

    // Bot AI - acts instantly after initial delay
    const executeBotMove = useCallback(() => {
        if (state.currentPlayer !== 'P2' || state.winner || drawAnimation || faceDownPlay || drawGambleAnimation) return;

        // Check if bot needs to select a pile for draw gamble
        if (state.pendingDrawGamble) {
            const pileAction = getBotPileSelection(state);
            if (pileAction && pileAction.type === 'PLAY_DRAW_GAMBLE') {
                // Trigger draw gamble animation for bot
                triggerDrawGambleAnimation(pileAction.pileIndex, 'P2');
            }
            return;
        }

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
                // Dispatch the action - START_DRAW_GAMBLE will set pendingDrawGamble
                dispatch(action);
            }
        }
    }, [state, drawAnimation, faceDownPlay, drawGambleAnimation, triggerFaceDownPlayAnimation, triggerDrawGambleAnimation]);

    useEffect(() => {
        // Only allow bot moves during playing phase
        if (gamePhase !== 'playing') return;
        if (
            isBotEnabled &&
            state.currentPlayer === 'P2' &&
            !state.winner &&
            !drawAnimation &&
            !faceDownPlay &&
            !drawGambleAnimation
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
        state.pendingDrawGamble,
        drawAnimation,
        faceDownPlay,
        drawGambleAnimation,
        executeBotMove,
    ]);

    const handleSelectHandCard = (index: number) => {
        if (gamePhase !== 'playing' || !isMyTurn) return;
        dispatch({ type: 'SELECT_HAND_CARD', index });
    };

    const handleSelectFaceDownCard = (index: number) => {
        if (gamePhase !== 'playing' || !isMyTurn) return;
        dispatch({ type: 'SELECT_FACEDOWN_CARD', index });
    };

    const handleSelectPile = (pileIndex: number) => {
        if (gamePhase !== 'playing' || !isMyTurn) return;

        // Check if this is a draw gamble play - intercept for animation
        if (state.pendingDrawGamble && layout && !drawGambleAnimation) {
            triggerDrawGambleAnimation(pileIndex, 'P1');
            return;
        }

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

    // Handle draw gamble animation phases
    useEffect(() => {
        if (!drawGambleAnimation) return;

        const timings = {
            moving: 500, // Time to move to pile and flip
            revealed: 800, // Time to show success/fail indicator
            retreating: 400, // Time to move to hand (fail only)
        };

        if (drawGambleAnimation.phase === 'moving') {
            const timer = setTimeout(() => {
                setDrawGambleAnimation((prev) => (prev ? { ...prev, phase: 'revealed' } : null));
            }, timings.moving);
            return () => clearTimeout(timer);
        }

        if (drawGambleAnimation.phase === 'revealed') {
            const timer = setTimeout(() => {
                if (drawGambleAnimation.isSuccess) {
                    // Success - dispatch and finish
                    setDrawGambleAnimation((prev) => (prev ? { ...prev, phase: 'done' } : null));
                } else {
                    // Fail - start retreating to hand
                    setDrawGambleAnimation((prev) => (prev ? { ...prev, phase: 'retreating' } : null));
                }
            }, timings.revealed);
            return () => clearTimeout(timer);
        }

        if (drawGambleAnimation.phase === 'retreating') {
            const timer = setTimeout(() => {
                setDrawGambleAnimation((prev) => (prev ? { ...prev, phase: 'done' } : null));
            }, timings.retreating);
            return () => clearTimeout(timer);
        }

        if (drawGambleAnimation.phase === 'done') {
            // Dispatch the actual state change
            dispatch({ type: 'PLAY_DRAW_GAMBLE', pileIndex: drawGambleAnimation.pileIndex });

            setTimeout(() => {
                setDrawGambleAnimation(null);
            }, 50);
        }
    }, [drawGambleAnimation]);

    const handleDrawFromDeck = () => {
        if (gamePhase !== 'playing' || !isMyTurn || drawGambleAnimation) return;
        if (state.deck.length === 0) return;
        // Enter draw gamble mode - highlights piles for player to choose
        dispatch({ type: 'START_DRAW_GAMBLE' });
    };

    const isPlayerTurn = isMyTurn;
    const hasSelection = state.selectedCard !== null || state.pendingDrawGamble !== null;
    const canDraw =
        gamePhase === 'playing' && isPlayerTurn && !state.selectedCard && !state.pendingDrawGamble && !state.winner && state.deck.length > 0 && !drawGambleAnimation;

    // Determine legal piles for highlighting
    const legalPileIndices = (() => {
        // Draw gamble mode - all piles are legal
        if (state.pendingDrawGamble) return [0, 1, 2, 3];

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
                {/* TOP: Opponent area - mirrored layout of bottom */}
                <div className="w-full flex flex-col items-center gap-3">
                    {/* Placeholder for opponent hand - same height as player hand */}
                    <div
                        ref={p2HandRef}
                        className="h-36 flex items-center justify-center"
                        style={{ minWidth: '400px' }}
                    />

                    {/* Placeholder for opponent face-down cards */}
                    <div
                        ref={p2FaceDownRef}
                        className="h-24 flex items-center justify-center"
                        style={{ minWidth: '320px' }}
                    />
                </div>

                {/* MIDDLE: Deck and pile placeholders */}
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        {/* Deck placeholder - positioned to left of piles, vertically aligned */}
                        <motion.div
                            ref={deckRef}
                            className={`absolute right-full mr-6 top-0 w-16 h-24 rounded-lg ${canDraw ? 'cursor-pointer' : ''}`}
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
                                        <span className="text-2xl font-bold opacity-60 text-white">{state.deck.length}</span>
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Pile placeholders - these are centered */}
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

                        {/* Chip placeholder - positioned to right of piles (same spacing as deck) */}
                        <div className="absolute left-full ml-6 w-14 h-14" />
                    </div>
                </div>

                {/* BOTTOM: Player area */}
                <div className="w-full flex flex-col items-center gap-3">
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

                {/* Turn indicator chip - positioned to right of piles, vertically aligned with face-down cards */}
                <motion.div
                    className="fixed w-14 h-14 flex items-center justify-center"
                    style={{
                        // Piles are 304px wide (4×64 + 3×16), so right edge is 152px from center
                        // Deck gap is 24px (mr-6), so chip should be at same distance from right edge
                        left: 'calc(50% + 152px + 24px)', // 50% + piles half-width + gap
                    }}
                    animate={{
                        // Use measured layout positions so chip aligns with face-down cards
                        // Subtract 28px (half of chip's 56px height) to center vertically
                        top: layout
                            ? gamePhase === 'playing'
                                ? isMyTurn
                                    ? layout.p1FaceDownCenter.y - 28
                                    : layout.p2FaceDownCenter.y - 28
                                : window.innerHeight / 2 - 28
                            : window.innerHeight / 2 - 28,
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
                        drawGambleAnimation?.card.id,
                    ].filter((id): id is string => !!id)}
                    myTheme={myTheme}
                    dealtCards={dealtCards}
                    isDealing={gamePhase === 'dealing'}
                    myPlayerId={myPlayerId}
                    pendingDrawGamble={state.pendingDrawGamble}
                />
            )}

            {/* Deck overlay - renders on top of animated cards so they appear to slide out from underneath */}
            {layout && state.deck.length > 0 && (drawAnimation || (faceDownPlay?.phase === 'replacing') || drawGambleAnimation || gamePhase === 'dealing') && (
                <div
                    className="fixed pointer-events-none"
                    style={{
                        left: layout.deckPos.x - 32,
                        top: layout.deckPos.y - 48,
                        width: 64,
                        height: 96,
                        zIndex: 40,
                        background: myTheme.neutral.gradient,
                        borderRadius: 8,
                        boxShadow: `0 4px 12px ${myTheme.neutral.glow}`,
                    }}
                >
                    <div
                        className="absolute rounded border border-white/20"
                        style={{ inset: 4 }}
                    />
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold opacity-60 text-white">{state.deck.length}</span>
                    </div>
                </div>
            )}

            {/* Deck draw animation - card pulled from bottom of deck */}
            <AnimatePresence mode="wait">
                {drawAnimation && (
                    <motion.div
                        key={drawAnimation.id}
                        className="fixed pointer-events-none"
                        initial={{
                            x: drawAnimation.startPos.x - 32,
                            y: drawAnimation.startPos.y - 48 + 28, // Start at bottom of deck (pulled from under)
                            scale: 0.95,
                            zIndex: 1, // Start below deck overlay
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
                            zIndex: { delay: 0.1 },
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
                                    jokerColor={myTheme.neutral}
                                    darkFace={myTheme.darkCardFace}
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
                                // Only move to hand on failure (retreating/replacing/done phases)
                                // On success, stay at pile position
                                x:
                                    (faceDownPlay.phase === 'retreating' ||
                                    faceDownPlay.phase === 'replacing' ||
                                    faceDownPlay.phase === 'done') && !faceDownPlay.isSuccess
                                        ? faceDownPlay.handPos.x - 32
                                        : faceDownPlay.pilePos.x - 32,
                                y:
                                    (faceDownPlay.phase === 'retreating' ||
                                    faceDownPlay.phase === 'replacing' ||
                                    faceDownPlay.phase === 'done') && !faceDownPlay.isSuccess
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
                                        jokerColor={myTheme.neutral}
                                        darkFace={myTheme.darkCardFace}
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
                                        y: layout.deckPos.y - 48 + 28, // Start at bottom of deck
                                        scale: 0.95,
                                        zIndex: 1,
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
                                        zIndex: { delay: 0.1 },
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

            {/* Draw gamble animation */}
            <AnimatePresence>
                {drawGambleAnimation && (
                    <motion.div
                        key={drawGambleAnimation.id}
                        className="fixed pointer-events-none"
                        initial={{
                            x: drawGambleAnimation.startPos.x - 32,
                            y: drawGambleAnimation.startPos.y - 48 + 28, // Start from bottom of deck
                            zIndex: 200,
                            scale: 0.95,
                        }}
                        animate={{
                            x:
                                drawGambleAnimation.phase === 'retreating' ||
                                drawGambleAnimation.phase === 'done'
                                    ? drawGambleAnimation.handPos.x - 32
                                    : drawGambleAnimation.pilePos.x - 32,
                            y:
                                drawGambleAnimation.phase === 'retreating' ||
                                drawGambleAnimation.phase === 'done'
                                    ? drawGambleAnimation.handPos.y - 48
                                    : drawGambleAnimation.pilePos.y -
                                      48 +
                                      (drawGambleAnimation.phase === 'revealed' &&
                                      !drawGambleAnimation.isSuccess
                                          ? -10
                                          : 0),
                            zIndex: 200,
                            scale: 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 25,
                        }}
                        style={{ perspective: 1000 }}
                    >
                        {/* Double-sided flipping card */}
                        <motion.div
                            className="relative w-16 h-24"
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: 180 }}
                            transition={{
                                type: 'spring',
                                stiffness: 100,
                                damping: 15,
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Back face - deck color */}
                            <div
                                className="absolute inset-0"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <Card
                                    card={null}
                                    faceUp={false}
                                    backColor={myTheme.neutral}
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
                                    card={drawGambleAnimation.card}
                                    faceUp={true}
                                    suitColors={suitColors}
                                    jokerColor={myTheme.neutral}
                                    darkFace={myTheme.darkCardFace}
                                />
                            </div>
                        </motion.div>

                        {/* Success/Fail indicator */}
                        <AnimatePresence>
                            {drawGambleAnimation.phase === 'revealed' && (
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                                            drawGambleAnimation.isSuccess
                                                ? 'bg-emerald-500/90 text-white'
                                                : 'bg-red-500/90 text-white'
                                        }`}
                                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                                    >
                                        {drawGambleAnimation.isSuccess ? '✓' : '✗'}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Move Timer (multiplayer only) */}
            {mode === 'multiplayer' && gamePhase === 'playing' && !state.winner && !gameEndedByInactivity && (
                <motion.div
                    className="fixed bottom-6 left-6 z-40"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div
                        className="px-4 py-3 rounded-xl backdrop-blur-sm"
                        style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: `2px solid ${secondsRemaining <= 10 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.1)'}`,
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-2xl font-mono font-bold ${
                                    secondsRemaining <= 10 ? 'text-red-400' : 'text-white'
                                }`}
                            >
                                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Inactivity overlay */}
            <AnimatePresence>
                {gameEndedByInactivity && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            className="relative z-10 p-8 rounded-2xl text-center max-w-sm mx-4"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Game Ended
                            </h2>
                            <p className="text-white/70 mb-6">
                                The game ended due to inactivity.
                            </p>

                            <motion.button
                                onClick={onExit}
                                className="px-8 py-3 rounded-xl font-bold text-white"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                                }}
                            >
                                Back to Menu
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Debug overlay (localhost only) */}
            {isLocalhost && showDebug && (
                <div className="fixed inset-0 pointer-events-none z-[9999]">
                    {/* Vertical center line */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-red-500/50"
                        style={{ left: '50%' }}
                    />
                    {/* Horizontal center line */}
                    <div
                        className="absolute left-0 right-0 h-px bg-red-500/50"
                        style={{ top: '50%' }}
                    />
                    {/* Debug label */}
                    <div className="absolute top-2 left-2 text-xs text-red-500/70 font-mono">
                        DEBUG (press D to toggle)
                    </div>
                </div>
            )}

            {/* Win overlay */}
            <WinOverlay winner={state.winner} onPlayAgain={handlePlayAgain} onExit={onExit} />
        </div>
    );
}

export default Game;
