/**
 * Multiplayer Sync Module - Real-time action-based synchronization
 *
 * Uses Supabase Broadcast for instant P2P action delivery.
 * Both clients run the same reducer, so syncing actions (not state) keeps them in sync.
 */

import { supabase } from './supabase';
import type { GameAction, GameState } from '../game/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Action payload sent over broadcast
export interface BroadcastAction {
    seq: number;           // Sequence number for ordering
    playerId: 'host' | 'guest';
    action: GameAction;
    timestamp: number;
}

// Actions that should be broadcast to opponent
// UI actions let opponent see your selections in real-time
// Game actions are the actual plays
const BROADCAST_ACTIONS: GameAction['type'][] = [
    // UI feedback actions (opponent sees your selections)
    'SELECT_HAND_CARD',
    'SELECT_FACEDOWN_CARD',
    'CLEAR_SELECTIONS',
    'START_DRAW_GAMBLE',
    'CANCEL_DRAW_GAMBLE',
    // Game-changing actions
    'SELECT_PILE',
    'PLAY_DRAW_GAMBLE',
    'DRAW_FROM_DECK',
];

// Actions that change the game state (require turn validation)
const TURN_ACTIONS: GameAction['type'][] = [
    'SELECT_PILE',
    'PLAY_DRAW_GAMBLE',
    'DRAW_FROM_DECK',
];

export interface MultiplayerSyncCallbacks {
    onAction: (action: GameAction, fromPlayer: 'host' | 'guest') => void;
    onConnectionChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export class MultiplayerSync {
    private channel: RealtimeChannel | null = null;
    private roomId: string;
    private playerId: 'host' | 'guest';
    private seq: number = 0;
    private callbacks: MultiplayerSyncCallbacks | null = null;
    private isSubscribed: boolean = false;

    constructor(roomId: string, playerId: 'host' | 'guest') {
        this.roomId = roomId;
        this.playerId = playerId;
    }

    /**
     * Subscribe to the broadcast channel and start receiving actions
     */
    subscribe(callbacks: MultiplayerSyncCallbacks): void {
        if (this.isSubscribed) {
            console.warn('[MultiplayerSync] Already subscribed');
            return;
        }

        this.callbacks = callbacks;

        // Create channel with ack for reliability
        this.channel = supabase.channel(`game:${this.roomId}`, {
            config: {
                broadcast: {
                    // Don't receive our own messages
                    self: false,
                    // Get acknowledgment from server
                    ack: true,
                },
            },
        });

        // Listen for game actions
        this.channel.on(
            'broadcast',
            { event: 'game-action' },
            (payload) => {
                const data = payload.payload as BroadcastAction;
                this.handleReceivedAction(data);
            }
        );

        // Subscribe to the channel
        this.channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                this.isSubscribed = true;
                console.log('[MultiplayerSync] Connected to broadcast channel');
                this.callbacks?.onConnectionChange?.('connected');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('[MultiplayerSync] Channel error');
                this.callbacks?.onConnectionChange?.('error');
            } else if (status === 'CLOSED') {
                this.isSubscribed = false;
                this.callbacks?.onConnectionChange?.('disconnected');
            }
        });
    }

    /**
     * Handle an action received from opponent
     */
    private handleReceivedAction(data: BroadcastAction): void {
        // Ignore our own actions (shouldn't happen with self: false, but safety check)
        if (data.playerId === this.playerId) {
            return;
        }

        console.log('[MultiplayerSync] Received action:', data.action.type, 'from', data.playerId, 'seq:', data.seq, 'payload:', data.action);

        // Dispatch to local reducer via callback
        this.callbacks?.onAction(data.action, data.playerId);
    }

    /**
     * Broadcast an action to opponent
     * Call this after dispatching locally
     */
    async broadcast(action: GameAction): Promise<boolean> {
        // Only broadcast certain action types
        if (!BROADCAST_ACTIONS.includes(action.type)) {
            return true; // Not an error, just not broadcast
        }

        if (!this.channel || !this.isSubscribed) {
            console.warn('[MultiplayerSync] Cannot broadcast: not connected');
            return false;
        }

        this.seq++;

        const payload: BroadcastAction = {
            seq: this.seq,
            playerId: this.playerId,
            action,
            timestamp: Date.now(),
        };

        try {
            const result = await this.channel.send({
                type: 'broadcast',
                event: 'game-action',
                payload,
            });

            if (result === 'ok') {
                console.log('[MultiplayerSync] Broadcast action:', action.type);
                return true;
            } else {
                console.error('[MultiplayerSync] Broadcast failed:', result);
                return false;
            }
        } catch (error) {
            console.error('[MultiplayerSync] Broadcast error:', error);
            return false;
        }
    }

    /**
     * Check if an action is a turn-based action that requires turn validation
     */
    static isTurnAction(action: GameAction): boolean {
        return TURN_ACTIONS.includes(action.type);
    }

    /**
     * Validate that a received action is valid given current game state
     * Returns true if the action should be applied
     */
    static validateAction(
        action: GameAction,
        fromPlayer: 'host' | 'guest',
        currentState: GameState
    ): boolean {
        // For turn-based actions, verify it's that player's turn
        if (MultiplayerSync.isTurnAction(action)) {
            const expectedPlayer = currentState.currentPlayer === 'P1' ? 'host' : 'guest';
            if (fromPlayer !== expectedPlayer) {
                console.warn(
                    '[MultiplayerSync] Turn validation failed:',
                    'expected', expectedPlayer,
                    'got', fromPlayer
                );
                return false;
            }
        }

        // For UI actions, allow from either player
        // This lets you see opponent's selections
        return true;
    }

    /**
     * Unsubscribe and cleanup
     */
    unsubscribe(): void {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
        this.isSubscribed = false;
        this.callbacks = null;
        this.seq = 0;
        console.log('[MultiplayerSync] Unsubscribed from broadcast channel');
    }

    /**
     * Check if currently connected
     */
    get connected(): boolean {
        return this.isSubscribed;
    }
}

/**
 * Create a multiplayer sync instance for a room
 */
export function createMultiplayerSync(
    roomId: string,
    isHost: boolean
): MultiplayerSync {
    return new MultiplayerSync(roomId, isHost ? 'host' : 'guest');
}
