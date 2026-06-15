import { vi } from 'vitest'
import type { PublicState, PublicPlayer } from '@shared/types'
import type { Game } from '../useGame'

export function makePlayer(over: Partial<PublicPlayer> = {}): PublicPlayer {
  return {
    id: 'p1',
    name: 'Sneaky Otter',
    color: '#3b82f6',
    teamId: null,
    connected: true,
    hasSubmitted: false,
    ...over,
  }
}

export function makeState(over: Partial<PublicState> = {}): PublicState {
  return {
    roomId: 'WXYZ',
    hostId: 'p1',
    phase: 'lobby',
    round: 0,
    players: [makePlayer()],
    scores: { A: 0, B: 0 },
    activeTeam: 'A',
    activePlayerId: null,
    bowlCount: 0,
    totalNames: 0,
    turnEndsAt: null,
    lastGuessed: null,
    winner: null,
    ...over,
  }
}

/**
 * A mock Game with every action stubbed as a spy. Pass `meId` to control which
 * player `game.me()` returns (defaults to the first player).
 */
export function makeGame(over: Partial<Game> & { meId?: string } = {}): Game {
  const state = over.state ?? makeState()
  const meId = over.meId ?? state?.players[0]?.id

  return {
    state,
    currentName: over.currentName ?? null,
    error: over.error ?? null,
    me: over.me ?? (() => state?.players.find((p) => p.id === meId)),
    isHost: over.isHost ?? false,
    isActive: over.isActive ?? false,
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    rename: vi.fn(),
    chooseTeam: vi.fn(),
    beginSubmit: vi.fn(),
    submitNames: vi.fn().mockResolvedValue({ ok: true }),
    startGame: vi.fn(),
    beginTurn: vi.fn(),
    guessCorrect: vi.fn(),
    playAgain: vi.fn(),
    ...over,
  }
}
