import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer } from '../src/server'
import { resetRooms, getRoom } from '../src/game'
import { closeStore } from '../src/store'
import { startedGame, activeClient, tick } from './helpers'

// Only runs when a Redis instance is provided (CI service container / VPS).
// Without REDIS_URL the whole game is in-memory and there is nothing to restore.
const HAS_REDIS = !!process.env.REDIS_URL

describe('resilience (requires REDIS_URL)', { skip: !HAS_REDIS }, () => {
  after(async () => {
    resetRooms()
    await closeStore()
  })

  test('an in-progress game is restored after a server restart', async () => {
    // --- boot, play partway ---
    const s1 = await createGameServer(0)
    const clients = await startedGame(s1.port)
    const active = activeClient(clients)
    active.beginTurn()
    await active.waitFor((s) => s.phase === 'playing')
    active.guessCorrect()
    const mid = await active.nextState()

    const roomId = mid.roomId
    const expectedScores = { ...mid.scores }
    const expectedRound = mid.round
    assert.equal(mid.scores[mid.activeTeam], 1)

    await tick(200) // let the write-through flush to Redis

    // --- simulate a crash: drop sockets, stop the server, wipe memory ---
    clients.forEach((c) => c.close())
    await s1.close()
    resetRooms()
    assert.equal(getRoom(roomId), undefined) // gone from memory

    // --- restart: it should rehydrate from Redis ---
    const s2 = await createGameServer(0)
    const room = getRoom(roomId)
    assert.ok(room, 'room restored from Redis')
    assert.equal(room!.round, expectedRound)
    assert.deepEqual(room!.scores, expectedScores)
    assert.equal(room!.players.size, 4)
    assert.ok(
      [...room!.players.values()].every((p) => !p.connected),
      'restored players start disconnected until their phones reconnect'
    )

    resetRooms() // clear the re-armed turn timer
    await s2.close()
  })
})
