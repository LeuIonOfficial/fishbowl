import { test, before, after, afterEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer, GameServer } from '../src/server'
import { resetRooms } from '../src/game'
import {
  TestClient,
  startedGame,
  activeClient,
  takeTurnAndDrain,
  playToGameOver,
  tick,
} from './helpers'

let server: GameServer
let clients: TestClient[] = []

before(async () => {
  server = await createGameServer(0)
})
after(async () => {
  await server.close()
})
afterEach(() => {
  clients.forEach((c) => c.close())
  clients = []
  resetRooms()
})

describe('turn mechanics', () => {
  test('only the active player can start the turn', async () => {
    clients = await startedGame(server.port)
    const active = activeClient(clients)
    const other = clients.find((c) => c !== active)!
    other.beginTurn() // should be ignored
    await tick(80)
    assert.equal(other.last!.phase, 'round_intro')

    active.beginTurn()
    const s = await active.waitFor((s) => s.phase === 'playing')
    assert.ok(s.turnEndsAt && s.turnEndsAt > Date.now())
  })

  test('the current name is sent ONLY to the active player', async () => {
    clients = await startedGame(server.port)
    const active = activeClient(clients)
    const others = clients.filter((c) => c !== active)

    active.beginTurn()
    await active.waitFor((s) => s.phase === 'playing')
    await tick(80)

    assert.ok(active.currentNames.some((n) => typeof n === 'string' && n.length > 0))
    for (const o of others) {
      assert.equal(o.currentNames.length, 0, 'non-active player must not receive any name')
    }
  })

  test('guess_correct scores for the active team and advances the bowl', async () => {
    clients = await startedGame(server.port)
    const active = activeClient(clients)
    active.beginTurn()
    const playing = await active.waitFor((s) => s.phase === 'playing')
    const team = playing.activeTeam
    const beforeScore = playing.scores[team]
    const beforeBowl = playing.bowlCount

    active.guessCorrect()
    const s = await active.nextState()
    assert.equal(s.scores[team], beforeScore + 1)
    assert.equal(s.bowlCount, beforeBowl - 1)
    assert.equal(s.lastGuessed && s.lastGuessed.length > 0, true)
  })

  test('a non-active player cannot guess (no stealing, no skipping)', async () => {
    clients = await startedGame(server.port)
    const active = activeClient(clients)
    const other = clients.find((c) => c !== active)!
    active.beginTurn()
    const playing = await active.waitFor((s) => s.phase === 'playing')
    const before = playing.scores

    other.guessCorrect() // ignored
    await tick(80)
    assert.deepEqual(active.last!.scores, before)
  })
})

describe('round & turn timeout', () => {
  test('when time runs out the turn passes to the other team and the word stays in play', async () => {
    process.env.TURN_MS = '300' // make the 60s clock fire fast
    try {
      clients = await startedGame(server.port)
      const observer = clients[0]
      const startTeam = observer.last!.activeTeam
      const active = activeClient(clients)

      active.beginTurn()
      const playing = await observer.waitFor((s) => s.phase === 'playing')
      assert.equal(playing.bowlCount, 19) // one drawn from 20

      // Don't guess — let it time out. (nextState: this is a re-entry into round_intro.)
      const after = await observer.nextState((s) => s.phase === 'round_intro', 3000)
      assert.notEqual(after.activeTeam, startTeam) // passed to the other team
      assert.equal(after.bowlCount, 20) // unguessed word returned to the bowl
      assert.equal(after.scores.A + after.scores.B, 0) // nothing scored
    } finally {
      delete process.env.TURN_MS
    }
  })

  test('clearing the bowl ends the round, refills it, and passes to the other team', async () => {
    clients = await startedGame(server.port)
    const observer = clients[0]
    const startTeam = observer.last!.activeTeam

    await takeTurnAndDrain(clients, observer)
    const s = await observer.waitFor((st) => st.round === 2)

    assert.equal(s.phase, 'round_intro')
    assert.equal(s.bowlCount, 20) // refilled
    assert.equal(s.scores[startTeam], 20) // the draining team scored every name
    assert.notEqual(s.activeTeam, startTeam) // next round, other team leads
  })
})

describe('full game', () => {
  test('plays 3 rounds and ends with a winner', async () => {
    clients = await startedGame(server.port)
    const observer = clients[0]
    const final = await playToGameOver(clients, observer)

    assert.equal(final.phase, 'game_over')
    assert.equal(final.scores.A + final.scores.B, 60) // 20 names * 3 rounds
    const winner = final.scores.A > final.scores.B ? 'A' : 'B'
    assert.equal(final.winner, winner)
  })

  test('play_again resets to the submit phase with cleared names and scores', async () => {
    clients = await startedGame(server.port)
    const host = clients[0]
    await playToGameOver(clients, host)

    host.playAgain()
    const s = await host.nextState((st) => st.phase === 'submit')
    assert.equal(s.scores.A, 0)
    assert.equal(s.scores.B, 0)
    assert.equal(s.totalNames, 0)
    assert.ok(s.players.every((p) => !p.hasSubmitted))
    // Teams are retained across a replay.
    assert.ok(s.players.every((p) => p.teamId))
  })
})
