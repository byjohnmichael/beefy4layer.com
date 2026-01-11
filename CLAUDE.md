# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beefy 4 Layer is a React-based card game with singleplayer (vs bot) and multiplayer (via Supabase real-time) modes. Players compete to empty their hands and face-down card slots by playing cards on center piles following adjacency rules.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Architecture

### Game State Management
- **Reducer pattern**: Game logic in `src/game/reducer.ts` handles all state transitions via `GameAction` dispatches
- **State shape**: Defined in `src/game/types.ts` - includes deck, center piles, player hands/face-down cards, current turn, selections
- **Initial setup**: `src/game/initialState.ts` creates shuffled deck, deals 4 face-down cards per player, 4 center piles

### Game Engine (`src/game/engine/`)
- `rules.ts`: Core game rules - adjacency checking (cards must be ±1 rank, wraps K↔A), Jokers are wild
- `deck.ts`: Deck creation (52 cards + 2 Jokers), shuffle, draw utilities
- `refresh.ts`: Deck refresh logic when deck empties (reshuffles center pile cards)

### Multiplayer (`src/lib/`)
- `supabase.ts`: Supabase client initialization (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars)
- `multiplayer.ts`: Room management (create/join/leave), game state sync via Supabase real-time subscriptions
- Database schema in `supabase-schema.sql` - `players` and `rooms` tables with RLS policies

### UI Structure
- **App.tsx**: Screen navigation (title ↔ game), theme state, multiplayer room state
- **screens/Game.tsx**: Main game UI, handles animations (deal, draw, face-down play), bot AI in singleplayer, multiplayer sync
- **screens/TitleScreen.tsx**: Start screen with singleplayer/multiplayer options, theme picker
- **components/**: Card rendering, hand layouts, pile displays, overlays

### Theming (`src/themes/`)
- `themes.ts`: Theme definitions with primary/secondary/neutral colors (gradients, solids, glows)
- Themes affect card backs, suit colors, and turn indicators
- Available themes: Classic, Taco, Bronco, Pink & Gold, Beach

### Key Patterns
- **Perspective rendering**: In multiplayer, host=P1 (bottom), guest=P2 (top); UI always shows "my" cards at bottom
- **Animation coordination**: Draw and face-down play animations run independently from state updates, dispatch actions on completion
- **Bot AI**: Simple strategy in `src/game/bot.ts` - prioritizes hand plays, then face-down gambles, then draws
