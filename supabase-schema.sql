-- Beefy 4 Layer - Multiplayer Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Players table: stores username and theme preference
-- Uses a client_id (generated UUID stored in localStorage) instead of auth
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'taco-bell',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table: game lobbies
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 4-letter room code like "ABCD"
  host_id UUID REFERENCES players(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES players(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  game_state JSONB, -- Full GameState when playing
  current_player TEXT, -- 'host' or 'guest' 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast room code lookups
CREATE INDEX IF NOT EXISTS rooms_code_idx ON rooms(code);
CREATE INDEX IF NOT EXISTS rooms_status_idx ON rooms(status);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations with anon key (simple for game, no auth)
-- In production you'd want more restrictive policies

-- Players policies
CREATE POLICY "Anyone can read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON players
  FOR UPDATE USING (true);

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

-- Function to clean up old waiting rooms (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms 
  WHERE status = 'waiting' 
  AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

