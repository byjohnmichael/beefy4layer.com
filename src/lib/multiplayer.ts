import { supabase } from './supabase';
import type { GameState } from '../game/types';

// Types for multiplayer
export interface Player {
  id: string;
  client_id: string;
  username: string;
  theme_id: string;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  game_state: GameState | null;
  current_player: 'host' | 'guest' | null;
  host?: Player;
  guest?: Player;
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

// Get stored username from localStorage
export function getStoredUsername(): string | null {
  return localStorage.getItem('beeft_username');
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

// === PLAYER FUNCTIONS ===

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clientId = getOrCreateClientId();
  
  // Check if username exists, excluding our own record
  const { data, error } = await supabase
    .from('players')
    .select('id, client_id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  // Available if no one has it, or if it's our own record
  return data === null || data.client_id === clientId;
}

export async function registerPlayer(username: string, themeId: string): Promise<Player | null> {
  const clientId = getOrCreateClientId();

  // First check if this client already has a player record
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (existing) {
    // Update existing player
    const { data, error } = await supabase
      .from('players')
      .update({ username, theme_id: themeId, last_seen: new Date().toISOString() })
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return null;
    }

    localStorage.setItem('beeft_username', username);
    localStorage.setItem('beeft_player_id', data.id);
    return data;
  }

  // Create new player
  const { data, error } = await supabase
    .from('players')
    .insert({ client_id: clientId, username, theme_id: themeId })
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    return null;
  }

  localStorage.setItem('beeft_username', username);
  localStorage.setItem('beeft_player_id', data.id);
  return data;
}

export async function getPlayer(): Promise<Player | null> {
  const clientId = getOrCreateClientId();

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('Error getting player:', error);
    return null;
  }

  return data;
}

export async function updatePlayerTheme(themeId: string): Promise<boolean> {
  const clientId = getOrCreateClientId();

  const { error } = await supabase
    .from('players')
    .update({ theme_id: themeId })
    .eq('client_id', clientId);

  if (error) {
    console.error('Error updating theme:', error);
    return false;
  }

  return true;
}

// === ROOM FUNCTIONS ===

export async function createRoom(): Promise<Room | null> {
  const playerId = localStorage.getItem('beeft_player_id');
  if (!playerId) {
    console.error('No player ID found');
    return null;
  }

  // Generate unique room code (retry if collision)
  let code = generateRoomCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: playerId,
        status: 'waiting',
      })
      .select(`
        *,
        host:host_id(id, username, theme_id),
        guest:guest_id(id, username, theme_id)
      `)
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
  const playerId = localStorage.getItem('beeft_player_id');
  if (!playerId) {
    return { room: null, error: 'Not logged in' };
  }

  // Find the room
  const { data: room, error: findError } = await supabase
    .from('rooms')
    .select(`
      *,
      host:host_id(id, username, theme_id),
      guest:guest_id(id, username, theme_id)
    `)
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

  if (room.host_id === playerId) {
    // Already the host, just return the room
    return { room, error: null };
  }

  if (room.guest_id && room.guest_id !== playerId) {
    return { room: null, error: 'Room is full' };
  }

  // Join as guest
  const { data: updatedRoom, error: joinError } = await supabase
    .from('rooms')
    .update({ guest_id: playerId })
    .eq('id', room.id)
    .select(`
      *,
      host:host_id(id, username, theme_id),
      guest:guest_id(id, username, theme_id)
    `)
    .single();

  if (joinError) {
    console.error('Error joining room:', joinError);
    return { room: null, error: 'Error joining room' };
  }

  return { room: updatedRoom, error: null };
}

export async function leaveRoom(roomId: string): Promise<boolean> {
  const playerId = localStorage.getItem('beeft_player_id');
  if (!playerId) return false;

  // Get the room to check if we're host or guest
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room) return false;

  if (room.host_id === playerId) {
    // Host leaving - delete the room
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    return !error;
  } else if (room.guest_id === playerId) {
    // Guest leaving - just remove guest
    const { error } = await supabase
      .from('rooms')
      .update({ guest_id: null })
      .eq('id', roomId);
    return !error;
  }

  return false;
}

export async function startGame(roomId: string, initialState: GameState): Promise<boolean> {
  const playerId = localStorage.getItem('beeft_player_id');
  if (!playerId) return false;

  // Verify we're the host
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room || room.host_id !== playerId) {
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (error) {
    console.error('Error starting game:', error);
    return false;
  }

  return true;
}

export async function updateGameState(roomId: string, gameState: GameState, nextPlayer: 'host' | 'guest'): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .update({
      game_state: gameState,
      current_player: nextPlayer,
      updated_at: new Date().toISOString(),
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

// === REALTIME SUBSCRIPTIONS ===

export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: Room) => void
) {
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
        // Fetch full room data with player info
        const { data } = await supabase
          .from('rooms')
          .select(`
            *,
            host:host_id(id, username, theme_id),
            guest:guest_id(id, username, theme_id)
          `)
          .eq('id', roomId)
          .single();

        if (data) {
          onUpdate(data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

