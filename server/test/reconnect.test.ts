import { test, before, after, afterEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer, GameServer } from '../src/server'
import { resetRooms } from '../src/game'
import { TestClient, tick } from './helpers'

let server: GameServer
const open: TestClient[] = []
const client = (pid?: string) => {
  const c = new TestClient(server.port, pid)
  open.push(c)
  return c
}

before(async () => {
  server = await createGameServer(0)
})
after(async () => {
  await server.close()
})
afterEach(() => {
  open.forEach((c) => c.close())
  open.length = 0
  resetRooms()
})

describe('reconnection', () => {
  test('a dropped player is shown disconnected, not removed', async () => {
    const host = client()
    const { roomId } = await host.createRoom('Host')
    const guest = client()
    await guest.joinRoom(roomId!, 'Guest')
    guest.chooseTeam('B')
    await host.waitFor((s) => s.players.length === 2 && !!s.players[1].teamId)

    guest.close()
    const s = await host.waitFor((st) => st.players.some((p) => !p.connected))
    const stale = s.players.find((p) => p.id === guest.playerId)!
    assert.equal(stale.connected, false)
    assert.equal(s.players.length, 2) // still seated, not removed
    assert.equal(stale.teamId, 'B') // team retained
  })

  test('rejoining with the same playerId restores the same seat', async () => {
    const host = client()
    const { roomId } = await host.createRoom('Host')
    const guest = client()
    await guest.joinRoom(roomId!, 'Guest')
    guest.chooseTeam('B')
    await host.waitFor((s) => s.players.length === 2 && !!s.players[1].teamId)

    guest.close()
    await host.waitFor((st) => st.players.some((p) => !p.connected))

    // New socket, SAME playerId == the phone reconnecting.
    const back = client(guest.playerId)
    const res = await back.joinRoom(roomId!)
    assert.equal(res.ok, true)

    const s = await host.waitFor((st) => st.players.every((p) => p.connected))
    assert.equal(s.players.length, 2) // no duplicate seat created
    const seat = s.players.find((p) => p.id === guest.playerId)!
    assert.equal(seat.connected, true)
    assert.equal(seat.teamId, 'B') // same team after reconnect
  })

  test('reconnecting does not duplicate players', async () => {
    const host = client()
    const { roomId } = await host.createRoom('Host')
    const guest = client()
    await guest.joinRoom(roomId!, 'Guest')
    await host.waitFor((s) => s.players.length === 2)

    // Rejoin several times with the same id.
    for (let i = 0; i < 3; i++) {
      const c = client(guest.playerId)
      await c.joinRoom(roomId!)
      await tick(30)
    }
    assert.equal(host.last!.players.length, 2)
  })
})
