import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { AddressInfo } from 'net'
import { Server } from 'socket.io'
import {
  ClientToServer,
  ServerToClient,
  TeamId,
  NAMES_PER_PLAYER,
  TURN_SECONDS,
  MIN_PLAYERS,
} from '../../shared/types'
import {
  Room,
  addPlayer,
  createRoom,
  getRoom,
  restoreRooms,
  shuffle,
  teamMembers,
  toPublic,
} from './game'
import { persistRoom, loadRooms, persistenceEnabled } from './store'

// Turn length, overridable at runtime (tests set TURN_MS low to exercise timeouts).
function turnMs(): number {
  return Number(process.env.TURN_MS) || TURN_SECONDS * 1000
}

export interface GameServer {
  io: Server<ClientToServer, ServerToClient>
  httpServer: http.Server
  port: number
  close: () => Promise<void>
}

/** Build and start the game server. `port = 0` picks a free port (tests). */
export function createGameServer(port = 0): Promise<GameServer> {
  const app = express()
  app.use(cors())
  app.get('/health', (_req, res) => res.json({ ok: true }))

  // In production the same server serves the built client (single origin, so the
  // socket connection is same-origin too). CLIENT_DIST is unset in dev/tests.
  const clientDist = process.env.CLIENT_DIST
  if (clientDist) {
    app.use(express.static(clientDist))
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  }

  const httpServer = http.createServer(app)
  const io = new Server<ClientToServer, ServerToClient>(httpServer, {
    cors: { origin: '*' },
  })

  // ---- State broadcast helpers ----

  function emitState(room: Room) {
    io.to(room.id).emit('state', toPublic(room))
    // Privately reveal the current name only to the active clue-giver.
    if (room.phase === 'playing' && room.activePlayerId) {
      const active = room.players.get(room.activePlayerId)
      if (active?.socketId) {
        io.to(active.socketId).emit('current_name', room.currentName)
      }
    }
    // Write-through to Redis (no-op without REDIS_URL). Fire-and-forget so the
    // broadcast isn't blocked on I/O.
    void persistRoom(room)
  }

  // ---- Turn / round lifecycle ----

  function refillBowl(room: Room) {
    room.bowl = shuffle(room.allNames)
    room.guessedThisRound = []
  }

  /** Advance to the next team's turn and pick that team's next clue-giver. */
  function passToNextTeam(room: Room) {
    room.turnIndex[room.activeTeam]++
    room.activeTeam = room.activeTeam === 'A' ? 'B' : 'A'
    const members = teamMembers(room, room.activeTeam)
    if (members.length === 0) {
      room.activePlayerId = null
      return
    }
    const idx = room.turnIndex[room.activeTeam] % members.length
    room.activePlayerId = members[idx].id
  }

  function clearTurnTimer(room: Room) {
    if (room.timer) {
      clearTimeout(room.timer)
      room.timer = null
    }
  }

  function drawNextName(room: Room) {
    room.currentName = room.bowl.length > 0 ? room.bowl.pop()! : null
  }

  function startRound(room: Room, round: number) {
    room.round = round
    refillBowl(room)
    room.currentName = null
    room.turnEndsAt = null
    room.phase = 'round_intro'
  }

  function endTurn(room: Room) {
    clearTurnTimer(room)
    // Unguessed current name goes back into the bowl (no skipping = it stays in play).
    if (room.currentName) {
      room.bowl.push(room.currentName)
      room.bowl = shuffle(room.bowl)
      room.currentName = null
    }
    room.turnEndsAt = null
    passToNextTeam(room)
    room.phase = 'round_intro'
    emitState(room)
  }

  function endRound(room: Room) {
    clearTurnTimer(room)
    room.currentName = null
    room.turnEndsAt = null
    if (room.round >= 3) {
      room.phase = 'game_over'
      room.winner =
        room.scores.A === room.scores.B
          ? 'tie'
          : room.scores.A > room.scores.B
            ? 'A'
            : 'B'
      emitState(room)
      return
    }
    // Next round continues with the other team.
    passToNextTeam(room)
    startRound(room, room.round + 1)
    emitState(room)
  }

  // ---- Socket wiring ----

  io.on('connection', (socket) => {
    function room(): Room | undefined {
      const id = socket.data.roomId as string | undefined
      return id ? getRoom(id) : undefined
    }
    function self() {
      const r = room()
      const pid = socket.data.playerId as string | undefined
      return r && pid ? r.players.get(pid) : undefined
    }
    function isActive(): boolean {
      const r = room()
      return !!r && r.activePlayerId === socket.data.playerId
    }
    function isHost(): boolean {
      const r = room()
      return !!r && r.hostId === socket.data.playerId
    }

    function attach(r: Room, playerId: string) {
      socket.data.roomId = r.id
      socket.data.playerId = playerId
      socket.join(r.id)
    }

    socket.on('create_room', ({ playerId, name }, cb) => {
      const r = createRoom(playerId)
      const p = addPlayer(r, playerId, name)
      p.socketId = socket.id
      attach(r, playerId)
      cb({ ok: true, roomId: r.id })
      emitState(r)
    })

    socket.on('join_room', ({ roomId, playerId, name }, cb) => {
      const r = getRoom(roomId.toUpperCase())
      if (!r) return cb({ ok: false, error: 'Room not found' })
      const existing = r.players.get(playerId)
      if (existing) {
        existing.connected = true
        existing.socketId = socket.id
      } else {
        const p = addPlayer(r, playerId, name)
        p.socketId = socket.id
      }
      attach(r, playerId)
      cb({ ok: true, roomId: r.id })
      emitState(r)
    })

    socket.on('rename', ({ name }) => {
      const p = self()
      const r = room()
      const clean = name.trim().slice(0, 24)
      if (p && r && clean) {
        p.name = clean
        emitState(r)
      }
    })

    socket.on('choose_team', ({ teamId }) => {
      const p = self()
      const r = room()
      if (!p || !r) return
      if (r.phase !== 'lobby' && r.phase !== 'submit') return
      p.teamId = teamId as TeamId
      emitState(r)
    })

    socket.on('begin_submit', () => {
      const r = room()
      if (!r || !isHost() || r.phase !== 'lobby') return
      if (r.players.size < MIN_PLAYERS) {
        socket.emit('error_msg', `Need at least ${MIN_PLAYERS} players.`)
        return
      }
      if (teamMembers(r, 'A').length === 0 || teamMembers(r, 'B').length === 0) {
        socket.emit('error_msg', 'Both teams need at least one player.')
        return
      }
      r.phase = 'submit'
      emitState(r)
    })

    socket.on('submit_names', ({ names }, cb) => {
      const p = self()
      const r = room()
      if (!p || !r || r.phase !== 'submit') return cb({ ok: false, error: 'Not accepting names' })
      const clean = names.map((n) => n.trim()).filter(Boolean)
      if (clean.length !== NAMES_PER_PLAYER) {
        return cb({ ok: false, error: `Enter exactly ${NAMES_PER_PLAYER} names.` })
      }
      p.names = clean
      cb({ ok: true })
      emitState(r)
    })

    socket.on('start_game', () => {
      const r = room()
      if (!r || !isHost() || r.phase !== 'submit') return
      const teamed = [...r.players.values()].filter((p) => p.teamId)
      if (teamed.some((p) => p.names.length !== NAMES_PER_PLAYER)) {
        socket.emit('error_msg', 'Everyone on a team must submit their names first.')
        return
      }
      r.allNames = teamed.flatMap((p) => p.names)
      r.scores = { A: 0, B: 0 }
      r.turnIndex = { A: 0, B: 0 }
      r.activeTeam = Math.random() < 0.5 ? 'A' : 'B'
      const members = teamMembers(r, r.activeTeam)
      r.activePlayerId = members[0]?.id ?? null
      startRound(r, 1)
      emitState(r)
    })

    socket.on('begin_turn', () => {
      const r = room()
      if (!r || !isActive() || r.phase !== 'round_intro') return
      if (r.bowl.length === 0) return endRound(r)
      r.phase = 'playing'
      drawNextName(r)
      r.lastGuessed = null
      r.turnEndsAt = Date.now() + turnMs()
      clearTurnTimer(r)
      r.timer = setTimeout(() => endTurn(r), turnMs())
      emitState(r)
    })

    socket.on('guess_correct', () => {
      const r = room()
      if (!r || !isActive() || r.phase !== 'playing' || !r.currentName) return
      r.scores[r.activeTeam]++
      r.guessedThisRound.push(r.currentName)
      r.lastGuessed = r.currentName
      if (r.bowl.length === 0) {
        r.currentName = null
        return endRound(r) // round completed mid-turn
      }
      drawNextName(r)
      emitState(r)
    })

    socket.on('play_again', () => {
      const r = room()
      if (!r || !isHost()) return
      for (const p of r.players.values()) p.names = []
      r.phase = 'submit'
      r.round = 0
      r.scores = { A: 0, B: 0 }
      r.allNames = []
      r.bowl = []
      r.currentName = null
      r.lastGuessed = null
      r.winner = null
      r.turnEndsAt = null
      clearTurnTimer(r)
      emitState(r)
    })

    socket.on('disconnect', () => {
      const p = self()
      const r = room()
      if (p && r) {
        p.connected = false
        p.socketId = null
        emitState(r)
      }
    })
  })

  // Restore any in-progress games from Redis and re-arm their turn timers.
  async function rehydrate() {
    if (!persistenceEnabled) return
    const restored = await loadRooms()
    restoreRooms(restored)
    const now = Date.now()
    for (const r of restored) {
      if (r.phase === 'playing' && r.turnEndsAt) {
        if (r.turnEndsAt <= now) endTurn(r) // turn expired during downtime
        else r.timer = setTimeout(() => endTurn(r), r.turnEndsAt - now)
      }
    }
    if (restored.length) console.log(`[restore] recovered ${restored.length} room(s) from Redis`)
  }

  return rehydrate().then(
    () =>
      new Promise<GameServer>((resolve) => {
        httpServer.listen(port, () => {
          const actualPort = (httpServer.address() as AddressInfo).port
          resolve({
            io,
            httpServer,
            port: actualPort,
            close: () =>
              new Promise<void>((res) => {
                io.close()
                httpServer.close(() => res())
              }),
          })
        })
      })
  )
}
