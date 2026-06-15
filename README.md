# 🐠 Fishbowl

A real-time, phone-first party game (Fishbowl / Salad Bowl / Celebrities).
4+ players join a room from their phones, split into 2 teams, secretly add names to a
shared bowl, then play 3 rounds — **describe → two words → act it out** — against a 60s clock.

See [`PLAN.md`](./PLAN.md) for the full design.

## Stack

- **Server:** Node + TypeScript + Express + Socket.IO (authoritative in-memory game state)
- **Client:** React + Vite + TypeScript + Tailwind (mobile-first)
- **Shared:** TypeScript protocol/types in `shared/`

## Run it

```bash
npm run install:all   # install root + server + client deps
npm run dev           # starts server (:3001) and client (:5173) together
```

Then open **http://localhost:5173** on the host machine.

### Play from phones (same Wi-Fi)

The Vite dev server is exposed on the LAN, and the client auto-connects to the
server on the **same hostname, port 3001**. So on each phone, open:

```
http://<your-computer-LAN-IP>:5173
```

Find your IP with `ipconfig getifaddr en0` (macOS). One person taps **Create a room**,
shares the 4-letter code (or the join link), everyone else joins, picks a team, and you're off.

## How a game flows

1. **Lobby** — create/join a room, get an auto "Adjective Animal" name, pick Team A or B.
2. **Submit** — each player secretly enters 5 names.
3. **Rounds 1–3** — teams alternate; the active player has 60s to get teammates to guess.
   - The current word is shown **only** to the clue-giver.
   - **No skipping** — the only action is "Got it!". Unguessed words stay in play.
   - The timer is sent once as a timestamp; each phone counts down locally (no per-second traffic).
4. **Game over** — highest score after 3 rounds wins. Host can play again.

## Project layout

```
shared/   protocol + state types (imported by both sides)
server/   Socket.IO server + game state machine
client/   React app, one screen per phase
```
