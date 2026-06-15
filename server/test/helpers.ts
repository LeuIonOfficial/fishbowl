import { io, Socket } from 'socket.io-client'
import type {
  ClientToServer,
  ServerToClient,
  PublicState,
  PublicPlayer,
  TeamId,
} from '../../shared/types'
import { randomUUID } from 'crypto'

export interface Ack {
  ok: boolean
  error?: string
  roomId?: string
}

/** A scriptable test player: wraps a socket and records everything it receives. */
export class TestClient {
  readonly playerId: string
  readonly socket: Socket<ServerToClient, ClientToServer>
  readonly states: PublicState[] = []
  readonly currentNames: (string | null)[] = []
  readonly errors: string[] = []

  constructor(port: number, playerId?: string) {
    this.playerId = playerId ?? randomUUID()
    this.socket = io(`http://localhost:${port}`, { forceNew: true })
    this.socket.on('state', (s) => this.states.push(s))
    this.socket.on('current_name', (n) => this.currentNames.push(n))
    this.socket.on('error_msg', (m) => this.errors.push(m))
  }

  get last(): PublicState | undefined {
    return this.states[this.states.length - 1]
  }

  me(): PublicPlayer | undefined {
    return this.last?.players.find((p) => p.id === this.playerId)
  }

  /** Resolve once a received (past or future) state matches the predicate. */
  waitFor(pred: (s: PublicState) => boolean, timeoutMs = 3000): Promise<PublicState> {
    const hit = [...this.states].reverse().find(pred)
    if (hit) return Promise.resolve(hit)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.socket.off('state', onState)
        reject(new Error(`waitFor timed out. Last phase: ${this.last?.phase}`))
      }, timeoutMs)
      const onState = (s: PublicState) => {
        if (pred(s)) {
          clearTimeout(timer)
          this.socket.off('state', onState)
          resolve(s)
        }
      }
      this.socket.on('state', onState)
    })
  }

  /** Resolve on the next state broadcast AFTER now (ignores history). */
  nextState(pred: (s: PublicState) => boolean = () => true, timeoutMs = 3000): Promise<PublicState> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.socket.off('state', onState)
        reject(new Error(`nextState timed out. Last phase: ${this.last?.phase}`))
      }, timeoutMs)
      const onState = (s: PublicState) => {
        if (pred(s)) {
          clearTimeout(timer)
          this.socket.off('state', onState)
          resolve(s)
        }
      }
      this.socket.on('state', onState)
    })
  }

  /** Generic emit returning the server ack. */
  emitAck<T extends 'create_room' | 'join_room' | 'submit_names'>(
    event: T,
    payload: unknown
  ): Promise<Ack> {
    return new Promise((resolve) => {
      // @ts-expect-error dynamic event dispatch for test convenience
      this.socket.emit(event, payload, resolve)
    })
  }

  createRoom(name?: string): Promise<Ack> {
    return this.emitAck('create_room', { playerId: this.playerId, name })
  }

  joinRoom(roomId: string, name?: string): Promise<Ack> {
    return this.emitAck('join_room', { roomId, playerId: this.playerId, name })
  }

  submitNames(names: string[]): Promise<Ack> {
    return this.emitAck('submit_names', { names })
  }

  chooseTeam(teamId: TeamId) {
    this.socket.emit('choose_team', { teamId })
  }
  rename(name: string) {
    this.socket.emit('rename', { name })
  }
  beginSubmit() {
    this.socket.emit('begin_submit')
  }
  startGame() {
    this.socket.emit('start_game')
  }
  beginTurn() {
    this.socket.emit('begin_turn')
  }
  guessCorrect() {
    this.socket.emit('guess_correct')
  }
  playAgain() {
    this.socket.emit('play_again')
  }

  close() {
    this.socket.disconnect()
  }
}

/** Five throwaway names tagged with the player id, so totals are easy to reason about. */
export function fiveNames(tag: string): string[] {
  return [1, 2, 3, 4, 5].map((i) => `${tag}-name${i}`)
}

/** Small delay helper for letting broadcasts settle. */
export function tick(ms = 50): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Drive a room from empty to the start of round 1 with `count` players
 * (2 per team by default). Returns the connected clients; clients[0] is host.
 */
export async function startedGame(port: number, count = 4): Promise<TestClient[]> {
  const host = new TestClient(port)
  const res = await host.createRoom('Host')
  const roomId = res.roomId!
  const clients = [host]
  for (let i = 1; i < count; i++) {
    const c = new TestClient(port)
    await c.joinRoom(roomId, `P${i}`)
    clients.push(c)
  }
  // Alternate teams A, B, A, B, ...
  clients.forEach((c, i) => c.chooseTeam(i % 2 === 0 ? 'A' : 'B'))
  await host.waitFor((s) => s.players.length === count && s.players.every((p) => p.teamId))
  host.beginSubmit()
  await host.waitFor((s) => s.phase === 'submit')
  for (const c of clients) await c.submitNames(fiveNames(c.playerId.slice(0, 4)))
  await host.waitFor((s) => s.players.filter((p) => p.teamId).every((p) => p.hasSubmitted))
  host.startGame()
  await host.waitFor((s) => s.phase === 'round_intro' && s.round === 1)
  return clients
}

/** The client whose turn it currently is. */
export function activeClient(clients: TestClient[]): TestClient {
  const id = clients[0].last?.activePlayerId
  return clients.find((c) => c.playerId === id)!
}

/** Start the active player's turn and guess every name until the bowl empties. */
export async function takeTurnAndDrain(clients: TestClient[], observer: TestClient) {
  const active = activeClient(clients)
  active.beginTurn()
  await observer.nextState((s) => s.phase === 'playing')
  while (observer.last!.phase === 'playing') {
    active.guessCorrect()
    await observer.nextState()
  }
}

/** Play turns until the game ends; returns the final state. */
export async function playToGameOver(clients: TestClient[], observer: TestClient) {
  let guard = 0
  while (observer.last!.phase !== 'game_over') {
    if (guard++ > 20) throw new Error('game did not end')
    await takeTurnAndDrain(clients, observer)
  }
  return observer.last!
}
