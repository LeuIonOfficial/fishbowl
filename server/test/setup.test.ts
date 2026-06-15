import { test, before, after, afterEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createGameServer, GameServer } from '../src/server'
import { resetRooms } from '../src/game'
import { TestClient, fiveNames, tick } from './helpers'

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

/** Create a room with `count` joined players, alternating teams A/B. */
async function room(count: number) {
  const host = client()
  const { roomId } = await host.createRoom('Host')
  const all = [host]
  for (let i = 1; i < count; i++) {
    const c = client()
    await c.joinRoom(roomId!, `P${i}`)
    all.push(c)
  }
  all.forEach((c, i) => c.chooseTeam(i % 2 === 0 ? 'A' : 'B'))
  await host.waitFor((s) => s.players.length === count && s.players.every((p) => p.teamId))
  return { host, all, roomId: roomId! }
}

describe('begin_submit guards', () => {
  test('blocks with fewer than 4 players', async () => {
    const { host } = await room(2)
    host.beginSubmit()
    await tick(80)
    assert.equal(host.last!.phase, 'lobby')
    assert.ok(host.errors.some((e) => /at least 4/i.test(e)))
  })

  test('blocks when a team is empty', async () => {
    const host = client()
    const { roomId } = await host.createRoom('Host')
    const others = []
    for (let i = 1; i < 4; i++) {
      const c = client()
      await c.joinRoom(roomId!, `P${i}`)
      others.push(c)
    }
    ;[host, ...others].forEach((c) => c.chooseTeam('A')) // everyone on A
    await host.waitFor((s) => s.players.length === 4 && s.players.every((p) => p.teamId))
    host.beginSubmit()
    await tick(80)
    assert.equal(host.last!.phase, 'lobby')
    assert.ok(host.errors.some((e) => /both teams/i.test(e)))
  })

  test('non-host cannot begin_submit', async () => {
    const { all } = await room(4)
    all[1].beginSubmit() // not the host
    await tick(80)
    assert.equal(all[1].last!.phase, 'lobby')
  })

  test('host with 4 players on 2 teams advances to submit', async () => {
    const { host } = await room(4)
    host.beginSubmit()
    const s = await host.waitFor((s) => s.phase === 'submit')
    assert.equal(s.phase, 'submit')
  })
})

describe('submit_names', () => {
  test('rejects a count other than exactly 5', async () => {
    const { host } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    const res = await host.submitNames(['only', 'three', 'names'])
    assert.equal(res.ok, false)
    assert.match(res.error!, /exactly 5/i)
    assert.equal(host.me()!.hasSubmitted, false)
  })

  test('accepts exactly 5 and flags the player as submitted', async () => {
    const { host } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    const res = await host.submitNames(fiveNames('host'))
    assert.equal(res.ok, true)
    await host.waitFor((s) => !!s.players.find((p) => p.id === host.playerId)?.hasSubmitted)
  })

  test('trims blanks and rejects if fewer than 5 remain', async () => {
    const { host } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    const res = await host.submitNames(['a', 'b', '  ', 'c', ''])
    assert.equal(res.ok, false)
  })
})

describe('start_game guards & kickoff', () => {
  test('blocks until everyone on a team has submitted', async () => {
    const { host, all } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    // Only the host submits.
    await host.submitNames(fiveNames('host'))
    host.startGame()
    await tick(80)
    assert.equal(host.last!.phase, 'submit')
    assert.ok(host.errors.some((e) => /submit/i.test(e)))

    // Now everyone submits -> it starts.
    for (const c of all.slice(1)) await c.submitNames(fiveNames(c.playerId.slice(0, 4)))
    host.startGame()
    const s = await host.waitFor((st) => st.phase === 'round_intro')
    assert.equal(s.round, 1)
  })

  test('kickoff seeds round 1: bowl = all names, active player on active team', async () => {
    const { host, all } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    for (const c of all) await c.submitNames(fiveNames(c.playerId.slice(0, 4)))
    host.startGame()
    const s = await host.waitFor((st) => st.phase === 'round_intro')

    assert.equal(s.totalNames, 20) // 4 players * 5
    assert.equal(s.bowlCount, 20)
    assert.equal(s.scores.A, 0)
    assert.equal(s.scores.B, 0)
    const active = s.players.find((p) => p.id === s.activePlayerId)!
    assert.equal(active.teamId, s.activeTeam)
  })

  test('choose_team is ignored once the game has started', async () => {
    const { host, all } = await room(4)
    host.beginSubmit()
    await host.waitFor((s) => s.phase === 'submit')
    for (const c of all) await c.submitNames(fiveNames(c.playerId.slice(0, 4)))
    host.startGame()
    await host.waitFor((s) => s.phase === 'round_intro')

    const before = host.me()!.teamId
    host.chooseTeam(before === 'A' ? 'B' : 'A')
    await tick(80)
    assert.equal(host.me()!.teamId, before) // unchanged
  })
})
