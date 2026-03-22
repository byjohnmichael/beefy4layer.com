# Beefy 4 Layer — Game Rules

## Overview
A 2-player card game. Players take turns playing cards onto shared center piles following adjacency rules. **First player to empty their hand AND all face-down slots wins.**

---

## Setup
- Deck: 52 standard cards + 2 Jokers (54 total)
- Each player receives **4 face-down cards** (unknown to the owner)
- **4 center piles** are initialized, each with 1 face-up card
- Both players start with an **empty hand**
- P1 goes first

---

## Card Adjacency Rule
A card can be played on a pile if its rank is **±1** from the pile's top card.

| Rank | Value |
|------|-------|
| A    | 1     |
| 2–10 | face  |
| J    | 11    |
| Q    | 12    |
| K    | 13    |

- **Wrap-around**: K (13) is adjacent to A (1), and vice versa
- **Jokers are fully wild**: A Joker can be played on any pile. Any card can be played on top of a Joker.

---

## Turn Actions
On your turn, choose one of the following:

### 1. Play from Hand
- Select a hand card → select a target pile
- The card must satisfy the adjacency rule for that pile
- A hand card can only be selected if it has ≥1 legal pile available
- **Success → card plays, you get an extra turn** (keep chaining!)

### 2. Gamble a Face-Down Card
- Select one of your face-down slots → select a target pile
- The card is revealed; the pile is chosen blind
- **Success** (card is adjacent to pile top): card plays, you get an extra turn
- **Failure** (card is not adjacent): card moves to your hand, a replacement card is drawn from the deck into that slot, **your turn ends**

### 3. Draw from Deck (Regular)
- Draw the top card of the deck into your hand
- **Turn ends immediately**

### 4. Draw Gamble
- Peek at the top card of the deck, then choose a pile to attempt
- **Success**: card plays onto pile, you get an extra turn
- **Failure**: card goes to your hand, **turn ends**

---

## Win Condition
A player wins when they have:
- **0 cards in hand**, AND
- **All 4 face-down slots empty** (all null)

This is checked after every successful play action.

---

## Deck Refresh
When the deck runs out of cards, the center pile cards (all except the bottom card of each pile) are collected, reshuffled, and become the new deck. The center piles each retain their bottom card as the new top.

---

## State Shape (for code context)
```ts
GameState {
  deck: Card[]                        // Remaining draw pile
  centerPiles: Card[][]               // 4 piles, index into last element for top card
  players: {
    P1: { hand: Card[], faceDown: (Card | null)[] }  // faceDown has 4 slots, null = empty
    P2: { hand: Card[], faceDown: (Card | null)[] }
  }
  currentPlayer: 'P1' | 'P2'
  winner: 'P1' | 'P2' | null
  selectedCard: { source: 'hand' | 'faceDown', index: number } | null
  revealedCard: Card | null           // Last revealed card (for animation)
  pendingPileIndex: number | null     // Pile targeted in last face-down/draw gamble
  pendingDrawGamble: Card | null      // Card peeked from deck, awaiting pile selection
  log: string[]                       // Move history
}
```

---

## Key Rules Summary
| Scenario | Result |
|---|---|
| Play hand card (legal) | Card plays, **extra turn** |
| Play hand card (illegal) | Not selectable |
| Gamble face-down (legal) | Card plays, **extra turn** |
| Gamble face-down (illegal) | Card → hand, replacement drawn, **turn ends** |
| Regular draw | Card → hand, **turn ends** |
| Draw gamble (legal) | Card plays, **extra turn** |
| Draw gamble (illegal) | Card → hand, **turn ends** |
| Deck empties | Center piles reshuffled into new deck |
| Hand = 0 + faceDown all null | **Win** |
