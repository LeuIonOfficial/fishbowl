// Shared protocol + state types used by both server and client.

export type Phase =
  | 'lobby'
  | 'submit'
  | 'round_intro'
  | 'playing'
  | 'game_over'

export type TeamId = 'A' | 'B'

export const NAMES_PER_PLAYER = 5
export const TURN_SECONDS = 60
export const MIN_PLAYERS = 4

export const ROUND_RULES: Record<number, { title: string; rule: string }> = {
  1: { title: 'Round 1 — Describe', rule: 'Say anything except the name itself. No skipping.' },
  2: { title: 'Round 2 — Two Words', rule: 'Describe using a maximum of 2 words. No skipping.' },
  3: { title: 'Round 3 — Act It Out', rule: 'Charades only — no words at all. No skipping.' },
}

export interface PublicPlayer {
  id: string
  name: string
  color: string
  teamId: TeamId | null
  connected: boolean
  hasSubmitted: boolean
}

// Sanitized state broadcast to everyone. Never contains the bowl contents
// or the current name — those would leak the game.
export interface PublicState {
  roomId: string
  hostId: string
  phase: Phase
  round: number
  players: PublicPlayer[]
  scores: Record<TeamId, number>
  activeTeam: TeamId
  activePlayerId: string | null
  bowlCount: number
  totalNames: number
  turnEndsAt: number | null // server timestamp (ms); clients count down locally
  lastGuessed: string | null
  winner: TeamId | 'tie' | null
}

// ---- Client -> Server events ----
export interface ClientToServer {
  create_room: (
    p: { playerId: string; name?: string; lang?: string },
    cb: (res: { ok: true; roomId: string } | { ok: false; error: string }) => void
  ) => void
  join_room: (
    p: { roomId: string; playerId: string; name?: string; lang?: string },
    cb: (res: { ok: true; roomId: string } | { ok: false; error: string }) => void
  ) => void
  rename: (p: { name: string }) => void
  choose_team: (p: { teamId: TeamId }) => void
  begin_submit: () => void
  submit_names: (p: { names: string[] }, cb: (res: { ok: boolean; error?: string }) => void) => void
  start_game: () => void
  begin_turn: () => void
  guess_correct: () => void
  play_again: () => void
}

// ---- Server -> Client events ----
export interface ServerToClient {
  state: (s: PublicState) => void
  current_name: (name: string | null) => void
  error_msg: (msg: string) => void
}
