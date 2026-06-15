import { test, before, after, afterEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer, GameServer } from '../src/server'
import { resetRooms } from '../src/game'
import { TestClient } from './helpers'

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

describe('lobby & joining', () => {
  test('create_room returns a 4-letter code and seats the host', async () => {
    const host = client()
    const res = await host.createRoom('Alice')
    assert.equal(res.ok, true)
    assert.match(res.roomId!, /^[A-Z]{4}$/)

    const s = await host.waitFor((s) => s.players.length === 1)
    assert.equal(s.phase, 'lobby')
    assert.equal(s.hostId, host.playerId)
    assert.equal(s.players[0].name, 'Alice')
  })

  test('auto-generates a unique animal name + color when none given', async () => {
    const host = client()
    const res = await host.createRoom()
    const guest = client()
    await guest.joinRoom(res.roomId!)

    const s = await guest.waitFor((s) => s.players.length === 2)
    const [a, b] = s.players
    assert.match(a.name, /^\p{Lu}\p{L}+ \p{Lu}\p{L}+$/u) // "Adjectiv Animal" (supports diacritics)
    assert.notEqual(a.name, b.name)
    assert.notEqual(a.color, b.color)
  })

  test('joining a missing room returns an error', async () => {
    const guest = client()
    const res = await guest.joinRoom('ZZZZ')
    assert.equal(res.ok, false)
    assert.match(res.error!, /not found/i)
  })

  test('all players see each other join (live updates)', async () => {
    const host = client()
    const { roomId } = await host.createRoom()
    const g1 = client()
    const g2 = client()
    await g1.joinRoom(roomId!)
    await g2.joinRoom(roomId!)

    const s = await host.waitFor((s) => s.players.length === 3)
    assert.deepEqual(
      s.players.map((p) => p.id).sort(),
      [host.playerId, g1.playerId, g2.playerId].sort()
    )
  })

  test('rename updates the player name for everyone', async () => {
    const host = client()
    const { roomId } = await host.createRoom()
    const g1 = client()
    await g1.joinRoom(roomId!)

    g1.rename('Bob')
    const s = await host.waitFor((s) => s.players.some((p) => p.name === 'Bob'))
    assert.ok(s.players.find((p) => p.id === g1.playerId && p.name === 'Bob'))
  })

  test('choose_team assigns the player and is visible to all', async () => {
    const host = client()
    const { roomId } = await host.createRoom()
    const g1 = client()
    await g1.joinRoom(roomId!)

    host.chooseTeam('A')
    g1.chooseTeam('B')
    const s = await host.waitFor(
      (s) => s.players.every((p) => p.teamId) && s.players.length === 2
    )
    assert.equal(s.players.find((p) => p.id === host.playerId)!.teamId, 'A')
    assert.equal(s.players.find((p) => p.id === g1.playerId)!.teamId, 'B')
  })
})
