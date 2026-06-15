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

// Server runs on port 3001 on the same host the client is served from,
// so phones on the LAN reach it via the dev machine's IP automatically.
const SERVER_URL = `${location.protocol}//${location.hostname}:3001`

export const socket: Socket<ServerToClient, ClientToServer> = io(SERVER_URL, {
  autoConnect: true,
})
