import {
  PublicState,
  PublicPlayer,
  TeamId,
  Phase,
} from '../../shared/types'
import { generateAnimalName, pickColor } from './animals'

export interface Player {
  id: string
  name: string
  color: string
  teamId: TeamId | null
  connected: boolean
  socketId: string | null
  names: string[] // names this player submitted into the bowl
}

export interface Room {
  id: string
  hostId: string
  phase: Phase
  round: number
  players: Map<string, Player> // keyed by playerId, insertion order preserved
  scores: Record<TeamId, number>
  activeTeam: TeamId
  turnIndex: Record<TeamId, number> // rotation pointer per team
  activePlayerId: string | null
  allNames: string[] // master list, used to refill the bowl each round
  bowl: string[] // names remaining this round
  currentName: string | null // only revealed privately to the active player
  guessedThisRound: string[]
  turnEndsAt: number | null
  timer: ReturnType<typeof setTimeout> | null
  lastGuessed: string | null
  winner: TeamId | 'tie' | null
}

const rooms = new Map<string, Room>()

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O to avoid confusion

export function genRoomCode(): string {
  let code = ''
  do {
    code = ''
    for (let i = 0; i < 4; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
  } while (rooms.has(code))
  return code
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id)
}

export function createRoom(hostId: string): Room {
  const room: Room = {
    id: genRoomCode(),
    hostId,
    phase: 'lobby',
    round: 0,
    players: new Map(),
    scores: { A: 0, B: 0 },
    activeTeam: 'A',
    turnIndex: { A: 0, B: 0 },
    activePlayerId: null,
    allNames: [],
    bowl: [],
    currentName: null,
    guessedThisRound: [],
    turnEndsAt: null,
    timer: null,
    lastGuessed: null,
    winner: null,
  }
  rooms.set(room.id, room)
  return room
}

export function deleteRoom(id: string): void {
  const room = rooms.get(id)
  if (room?.timer) clearTimeout(room.timer)
  rooms.delete(id)
}

/** Clear all rooms and their pending turn timers (used to isolate tests). */
export function resetRooms(): void {
  for (const room of rooms.values()) {
    if (room.timer) clearTimeout(room.timer)
  }
  rooms.clear()
}

export function addPlayer(room: Room, playerId: string, name?: string): Player {
  const taken = new Set([...room.players.values()].map((p) => p.name))
  const player: Player = {
    id: playerId,
    name: name?.trim() || generateAnimalName(taken),
    color: pickColor(room.players.size),
    teamId: null,
    connected: true,
    socketId: null,
    names: [],
  }
  room.players.set(playerId, player)
  return player
}

export function teamMembers(room: Room, team: TeamId): Player[] {
  return [...room.players.values()].filter((p) => p.teamId === team)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function toPublic(room: Room): PublicState {
  const players: PublicPlayer[] = [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    teamId: p.teamId,
    connected: p.connected,
    hasSubmitted: p.names.length > 0,
  }))
  return {
    roomId: room.id,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    players,
    scores: room.scores,
    activeTeam: room.activeTeam,
    activePlayerId: room.activePlayerId,
    bowlCount: room.bowl.length,
    totalNames: room.allNames.length,
    turnEndsAt: room.turnEndsAt,
    lastGuessed: room.lastGuessed,
    winner: room.winner,
  }
}
