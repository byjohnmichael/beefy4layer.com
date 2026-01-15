import { supabase } from './supabase';
import type { GameState } from '../game/types';

// Types for multiplayer
export interface Room {
    id: string;
    code: string;
    host_id: string; // client_id of host
    guest_id: string | null; // client_id of guest
    status: 'waiting' | 'playing' | 'finished';
    game_state: GameState | null;
    current_player: 'host' | 'guest' | null;
    last_move_at: string | null; // ISO timestamp of last move for timer
}

// Generate a unique client ID (stored in localStorage)
export function getOrCreateClientId(): string {
    const key = 'beeft_client_id';
    let clientId = localStorage.getItem(key);
    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem(key, clientId);
    }
    return clientId;
}

// Generate a 4-letter room code
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O to avoid confusion
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// === ROOM FUNCTIONS ===

export async function createRoom(): Promise<Room | null> {
    const clientId = getOrCreateClientId();

    // Generate unique room code (retry if collision)
    let code = generateRoomCode();
    let attempts = 0;

    while (attempts < 5) {
        const { data, error } = await supabase
            .from('rooms')
            .insert({
                code,
                host_id: clientId,
                status: 'waiting',
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation - try new code
                code = generateRoomCode();
                attempts++;
                continue;
            }
            console.error('Error creating room:', error);
            return null;
        }

        return data;
    }

    console.error('Failed to generate unique room code');
    return null;
}

export async function joinRoom(code: string): Promise<{ room: Room | null; error: string | null }> {
    const clientId = getOrCreateClientId();

    // Find the room
    const { data: room, error: findError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

    if (findError) {
        console.error('Error finding room:', findError);
        return { room: null, error: 'Error finding room' };
    }

    if (!room) {
        return { room: null, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
        return { room: null, error: 'Game already in progress' };
    }

    if (room.host_id === clientId) {
        // Already the host, just return the room
        return { room, error: null };
    }

    if (room.guest_id && room.guest_id !== clientId) {
        return { room: null, error: 'Room is full' };
    }

    // Join as guest - this will trigger auto-start via the subscription
    const { data: updatedRoom, error: joinError } = await supabase
        .from('rooms')
        .update({ guest_id: clientId })
        .eq('id', room.id)
        .select('*')
        .single();

    if (joinError) {
        console.error('Error joining room:', joinError);
        return { room: null, error: 'Error joining room' };
    }

    return { room: updatedRoom, error: null };
}

export async function leaveRoom(roomId: string): Promise<boolean> {
    const clientId = getOrCreateClientId();

    // Get the room to check if we're host or guest
    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (!room) return false;

    if (room.host_id === clientId) {
        // Host leaving - delete the room
        const { error } = await supabase.from('rooms').delete().eq('id', roomId);
        return !error;
    } else if (room.guest_id === clientId) {
        // Guest leaving - just remove guest
        const { error } = await supabase.from('rooms').update({ guest_id: null }).eq('id', roomId);
        return !error;
    }

    return false;
}

export async function startGame(roomId: string, initialState: GameState): Promise<boolean> {
    const clientId = getOrCreateClientId();

    // Verify we're the host
    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();

    if (!room || room.host_id !== clientId) {
        console.error('Only host can start the game');
        return false;
    }

    if (!room.guest_id) {
        console.error('Need two players to start');
        return false;
    }

    // Randomly decide who goes first
    const firstPlayer = Math.random() < 0.5 ? 'host' : 'guest';

    const { error } = await supabase
        .from('rooms')
        .update({
            status: 'playing',
            game_state: initialState,
            current_player: firstPlayer,
            last_move_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error starting game:', error);
        return false;
    }

    return true;
}

export async function updateGameState(
    roomId: string,
    gameState: GameState,
    nextPlayer: 'host' | 'guest',
): Promise<boolean> {
    const now = new Date().toISOString();
    const { error } = await supabase
        .from('rooms')
        .update({
            game_state: gameState,
            current_player: nextPlayer,
            last_move_at: now,
            updated_at: now,
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error updating game state:', error);
        return false;
    }

    return true;
}

export async function endGame(roomId: string, gameState: GameState): Promise<boolean> {
    const { error } = await supabase
        .from('rooms')
        .update({
            status: 'finished',
            game_state: gameState,
            updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error ending game:', error);
        return false;
    }

    return true;
}

// End game due to inactivity (timer expired)
export async function endGameByInactivity(roomId: string): Promise<boolean> {
    const { error } = await supabase
        .from('rooms')
        .update({
            status: 'finished',
            updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error ending game by inactivity:', error);
        return false;
    }

    return true;
}

// Find an active game for the current client
export async function findActiveGame(): Promise<Room | null> {
    const clientId = getOrCreateClientId();

    // Look for rooms where we're either host or guest and game is in progress
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'playing')
        .or(`host_id.eq.${clientId},guest_id.eq.${clientId}`)
        .maybeSingle();

    if (error) {
        console.error('Error finding active game:', error);
        return null;
    }

    return data;
}

// === REALTIME SUBSCRIPTIONS ===

export function subscribeToRoom(roomId: string, onUpdate: (room: Room) => void) {
    const channel = supabase
        .channel(`room:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`,
            },
            async (_payload) => {
                // Fetch full room data
                const { data } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', roomId)
                    .single();

                if (data) {
                    onUpdate(data);
                }
            },
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
