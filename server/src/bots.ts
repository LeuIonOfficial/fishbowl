/**
 * Spawns 3 bot players that join an existing room, pick teams, submit themed
 * names, and auto-play their own turns. You join as the 4th (human) player.
 *
 * Usage:
 *   1. Open the client in your browser and CREATE a room (you're the host).
 *   2. Run:  npm --prefix server run bots -- <ROOM_CODE>
 *      (or:  cd server && npm run bots -- <ROOM_CODE>)
 *   3. Back in the browser: pick your team, hit continue, submit your 5 names,
 *      then Start the game. The bots handle their own turns automatically.
 */
import { io, Socket } from 'socket.io-client'
import type { ClientToServer, ServerToClient, PublicState, TeamId } from '../../shared/types'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001'

interface Persona {
  id: string
  name: string
  team: TeamId
  names: string[]
}

// 3 bots with distinct personalities. Teams are A, B, A so both teams are
// non-empty no matter which team you (the human) pick.
const PERSONAS: Persona[] = [
  {
    id: 'bot-marla',
    name: '🎬 MovieBuff Marla',
    team: 'A',
    names: ['Darth Vader', 'Forrest Gump', 'Hermione Granger', 'James Bond', 'The Joker'],
  },
  {
    id: 'bot-hugo',
    name: '📜 HistoryNerd Hugo',
    team: 'B',
    names: ['Napoleon', 'Cleopatra', 'Albert Einstein', 'Gandhi', 'Julius Caesar'],
  },
  {
    id: 'bot-pixie',
    name: '🎤 PopStar Pixie',
    team: 'A',
    names: ['Beyoncé', 'Taylor Swift', 'Elvis Presley', 'Lady Gaga', 'Freddie Mercury'],
  },
]

const roomId = (process.argv[2] || '').toUpperCase()
if (!roomId || roomId.length !== 4) {
  console.error('\n  Usage: npm run bots -- <ROOM_CODE>\n  (Create a room in your browser first, then pass its 4-letter code.)\n')
  process.exit(1)
}

function log(persona: Persona, msg: string) {
  console.log(`  ${persona.name.padEnd(22)} ${msg}`)
}

function spawn(persona: Persona) {
  const socket: Socket<ServerToClient, ClientToServer> = io(SERVER_URL)
  let submitted = false
  let turnStarted = false

  socket.on('connect', () => {
    socket.emit('join_room', { roomId, playerId: persona.id, name: persona.name }, (res) => {
      if (res.ok) log(persona, `joined room ${roomId}`)
      else log(persona, `couldn't join: ${res.error}`)
    })
  })

  socket.on('state', (s: PublicState) => {
    const me = s.players.find((p) => p.id === persona.id)
    if (!me) return

    // Pick a team while still in the lobby/submit phase.
    if ((s.phase === 'lobby' || s.phase === 'submit') && me.teamId !== persona.team) {
      socket.emit('choose_team', { teamId: persona.team })
      log(persona, `joined Team ${persona.team}`)
    }

    // Drop 5 themed names into the bowl.
    if (s.phase === 'submit' && !me.hasSubmitted && !submitted) {
      submitted = true
      socket.emit('submit_names', { names: persona.names }, (r) => {
        log(persona, r.ok ? 'submitted 5 names' : `submit failed: ${r.error}`)
      })
    }

    // It's this bot's turn — start it.
    if (s.phase === 'round_intro' && s.activePlayerId === persona.id && !turnStarted) {
      turnStarted = true
      log(persona, `it's my turn (round ${s.round}) — starting…`)
      setTimeout(() => socket.emit('begin_turn'), 1200)
    }
    if (s.phase !== 'round_intro') turnStarted = false
  })

  // While it's my turn the server privately feeds me each word; "guess" it
  // after a short delay to simulate teammates getting it.
  socket.on('current_name', (name) => {
    if (name) {
      setTimeout(() => socket.emit('guess_correct'), 1400 + Math.random() * 1000)
    }
  })

  socket.on('error_msg', (m) => log(persona, `⚠ ${m}`))
}

console.log(`\n🤖 Spawning ${PERSONAS.length} bots into room ${roomId} at ${SERVER_URL}\n`)
PERSONAS.forEach(spawn)
console.log('\nBots are live. Go to your browser, pick a team, and start the game.')
console.log('Press Ctrl+C to remove the bots.\n')
