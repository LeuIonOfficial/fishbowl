# Fishbowl — Multiplayer Party Game

A real-time, phone-first web party game (also known as **Salad Bowl / Celebrities / Fishbowl**).
Players join a room from their phones, split into two teams, secretly submit names into a
shared "bowl," then play three rounds describing/acting out those names against a 60-second clock.

---

## Game Rules

- **4+ players** join a **room**, split into **exactly 2 teams** (join or create teams).
- Each player secretly submits **5 names** (personalities/celebrities) → all go into one shared **bowl**.
- **3 rounds**, the *same* names are reused each round (the bowl refills between rounds):
  1. **Describe freely** — say anything except the name itself.
  2. **Two words only** — describe using a maximum of 2 words.
  3. **Act it out** — charades, no words at all.
- **No skipping, ever.** In every round the active player must keep going on the current name
  until a teammate guesses it or the 60s runs out. A name only leaves the bowl when guessed correctly.
- Teams **alternate turns**. The active player (clue-giver) has **60 seconds** to get teammates
  to guess as many names as possible.
- Each guessed name scores a point for that team. A round ends when the bowl is empty; the bowl
  then refills with all names for the next round.
- Most points after 3 rounds wins.

---

## Architecture Principle

**The server is authoritative.** The timer, turn order, bowl contents, and "only the clue-giver
sees the current name" all require a trusted server. Clients send *actions* and render whatever
the server pushes. Clients are never trusted with the bowl or the clock.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Realtime transport | **Socket.IO** (Node) | Rooms, reconnection, scoped broadcasts |
| Server | **Node + TypeScript** | Authoritative in-memory game state machine |
| Frontend | **React + Vite + TypeScript** | Fast, component-per-phase UI |
| Styling | **Tailwind CSS** | Mobile-first, quick clean responsive UI |
| State store | In-memory `Map<roomId, GameState>` | Games are ephemeral; no DB for v1 |
| Scaling (later) | Redis adapter | Only if scaling Socket.IO horizontally |

No database in v1 — games are ephemeral. Supabase can be added later for persistent stats/accounts.

---

## Repo Structure

```
105-stefan-game/
├── server/   # Socket.IO + game state machine + tests
├── client/   # React app, one component per phase, mobile-first
└── shared/   # TypeScript types shared by both
```

---

## Game State Machine

```
LOBBY → TEAM_SETUP → SUBMIT_NAMES → ROUND_INTRO → PLAYING_TURN → TURN_RESULT
   ↘ (loop turns until bowl empty) → ROUND_END → (next round) → GAME_OVER
```

---

## Data Model (server-side)

```ts
type Phase = 'lobby' | 'submit' | 'round_intro' | 'playing' | 'turn_result' | 'round_end' | 'game_over'

interface Player {
  id: string            // persistent id (stored in localStorage for reconnect)
  name: string          // auto animal name by default, renameable
  color: string         // distinct color within the room
  teamId: 'A' | 'B' | null
  connected: boolean
  submittedCount: number
}

interface GameState {
  roomId: string
  hostId: string
  phase: Phase
  players: Player[]
  teams: { A: string[]; B: string[] }     // player ids
  bowl: string[]                          // names remaining this round
  guessedThisRound: string[]
  round: 1 | 2 | 3
  activeTeam: 'A' | 'B'
  activePlayerId: string                  // current clue-giver
  turnTimer: { endsAt: number } | null    // server-authoritative timestamp
  scores: { A: number; B: number }
}
```

---

## Socket Events

```
Client → Server          Server → Clients
─────────────────        ──────────────────
create_room              room_state (full snapshot — join/reconnect only)
join_room                player_joined
choose_team              team_changed
rename                   turn_started (clue-giver also gets the current name privately)
submit_names             name_guessed
start_game               turn_ended
guess_correct            round_ended
end_turn                 score_update
                         game_over
```

There is intentionally **no `skip` event** — skipping is not allowed.

---

## Phone-First / Performance Design

Everyone is on their own phone, so a room = many concurrent sockets watching the same state.

### The key optimization: don't broadcast the timer
- On `turn_started`, the server sends **`endsAt` (a timestamp)** once.
- Each phone runs its **own local countdown** from that timestamp (client-side rendering only).
- The server keeps one authoritative timer and broadcasts only **`turn_ended`** when time is up.
- Result: ~2 messages per turn instead of ~60×N timer ticks.

### Other efficiency rules
- **Send deltas, not full snapshots.** Full `room_state` only on join/reconnect; otherwise small events.
- **Room-scoped broadcasts** via Socket.IO rooms — never global emits.
- **Private channel for the name** — only the clue-giver's socket receives the current name.
- **Debounce lobby churn** (rapid team switching) before re-broadcasting.

### Mobile UX
- One clear **primary action per phase** (Join team / Submit names / Got it! / End turn).
- **Wake-Lock API** during an active turn so the clue-giver's screen doesn't sleep.
- **Reconnect by persistent id in localStorage** — phones drop sockets often; rejoining mid-turn must be seamless.
- Large tap targets, single column, thumb-reachable buttons, no hover-dependent UI.
- Spectator view for non-active players: team, scores, whose turn, live countdown.

### Auto-generated animal identities (like Google Docs anonymous users)
On join, the server assigns a random `adjective + animal` name + a distinct color, unique within the room.
Players can rename, but it works instantly with zero typing.

```ts
const ADJECTIVES = ['Sneaky','Brave','Jolly','Witty','Calm','Mighty', /* … */]
const ANIMALS    = ['Otter','Falcon','Panda','Lynx','Gecko','Walrus', /* … */]
// pick a pair not already used in the room; pair with a distinct color
```

---

## Key Design Decisions

1. **Privacy of the current name** — only the active clue-giver's socket receives it; everyone else sees "guessing…". This is the #1 correctness requirement.
2. **Who marks a name correct?** — the clue-giver taps "Got it!" when a teammate guesses. Simple and trusted enough for a party game.
3. **Timer authority** — server tracks `endsAt`; clients render a countdown, server decides when time's up.
4. **Reconnection** — persistent player id (localStorage) rejoins the same team mid-game.
5. **Minimum 4 players / balanced teams** — block game start if a team is empty or fewer than 4 players.
6. **No skipping** — enforced by the absence of a skip action in the protocol.

---

## Milestones

1. **Lobby + rooms** — create/join room from phone, see live player list, auto animal names, pick team, live updates.
2. **Name submission** — each player submits 5 names; host sees "X/N ready"; start gate.
3. **Turn engine** — server timer, show name to clue-giver only, "Got it!" / end-turn, alternate teams, no skipping.
4. **Round progression** — bowl empties → refill → advance round → swap the rules text (free / 2 words / charades).
5. **Scoring + game over** — running scores, final screen, play again.
6. **Polish** — reconnection, wake-lock, sounds, animations, mobile layout refinement.
