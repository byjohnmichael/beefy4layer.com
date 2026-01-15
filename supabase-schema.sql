-- Beefy 4 Layer - Multiplayer Schema (Simplified)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- NOTE: If you have an existing database, you'll need to drop the old tables first:
--   DROP TABLE IF EXISTS rooms;
--   DROP TABLE IF EXISTS players;

-- Rooms table: game lobbies
-- Uses client_id (generated UUID stored in localStorage) directly, no players table needed
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 4-letter room code like "ABCD"
  host_id TEXT NOT NULL, -- client_id of host
  guest_id TEXT, -- client_id of guest (null until someone joins)
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  game_state JSONB, -- Full GameState when playing
  current_player TEXT, -- 'host' or 'guest'
  last_move_at TIMESTAMPTZ, -- Timestamp of last move for inactivity timer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast room code lookups and finding active games
CREATE INDEX IF NOT EXISTS rooms_code_idx ON rooms(code);
CREATE INDEX IF NOT EXISTS rooms_status_idx ON rooms(status);
CREATE INDEX IF NOT EXISTS rooms_host_idx ON rooms(host_id);
CREATE INDEX IF NOT EXISTS rooms_guest_idx ON rooms(guest_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations with anon key (simple for game, no auth)
-- In production you'd want more restrictive policies

-- Rooms policies
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE USING (true);

-- Enable realtime for rooms table (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Function to clean up old rooms (optional, run periodically)
-- Cleans up waiting rooms older than 1 hour and finished games older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE (status = 'waiting' AND created_at < NOW() - INTERVAL '1 hour')
     OR (status = 'finished' AND updated_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;
