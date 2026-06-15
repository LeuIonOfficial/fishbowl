import { io, Socket } from 'socket.io-client'
import type { ClientToServer, ServerToClient } from '@shared/types'

// Persistent player id so a phone that locks/refreshes rejoins the same seat.
// `?seat=N` gives a tab its own identity, so you can test several "players"
// in one browser (otherwise all tabs share localStorage = one player).
function playerIdKey(): string {
  const seat = new URLSearchParams(location.search).get('seat')
  return seat ? `fishbowl.playerId.${seat}` : 'fishbowl.playerId'
}

// crypto.randomUUID() only exists in a secure context (HTTPS / localhost). Over
// plain HTTP on an IP it's undefined, so fall back to getRandomValues / Math.random.
function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const b = crypto.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
    return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function getPlayerId(): string {
  const key = playerIdKey()
  let id = localStorage.getItem(key)
  if (!id) {
    id = uuid()
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
