import { io, Socket } from 'socket.io-client'
import type { ClientToServer, ServerToClient } from '@shared/types'

// Persistent player id so a phone that locks/refreshes rejoins the same seat.
// `?seat=N` gives a tab its own identity, so you can test several "players"
// in one browser (otherwise all tabs share localStorage = one player).
function playerIdKey(): string {
  const seat = new URLSearchParams(location.search).get('seat')
  return seat ? `fishbowl.playerId.${seat}` : 'fishbowl.playerId'
}

export function getPlayerId(): string {
  const key = playerIdKey()
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

// In dev the API server is a separate process on port 3001 (reachable on the
// LAN via the dev machine's host). In production the same origin serves both the
// client and the socket, so we connect with no explicit URL.
const SERVER_URL = import.meta.env.DEV
  ? `${location.protocol}//${location.hostname}:3001`
  : undefined

export const socket: Socket<ServerToClient, ClientToServer> = SERVER_URL
  ? io(SERVER_URL, { autoConnect: true })
  : io({ autoConnect: true })
