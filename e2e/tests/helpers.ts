import { Browser, BrowserContext, Page, expect } from '@playwright/test'

const GAME_OVER = /wins!|it's a tie/i

/** One real browser player: an isolated context (own localStorage = own identity). */
export class Player {
  constructor(
    readonly name: string,
    readonly context: BrowserContext,
    readonly page: Page
  ) {}

  static async create(browser: Browser, name: string): Promise<Player> {
    const context = await browser.newContext()
    const page = await context.newPage()
    return new Player(name, context, page)
  }

  async createRoom(): Promise<string> {
    await this.page.goto('/')
    await this.page.getByRole('button', { name: /create a room/i }).click()
    const code = await this.page.getByTestId('room-code').innerText()
    return code.trim()
  }

  async joinRoom(code: string) {
    await this.page.goto('/')
    await this.page.getByPlaceholder(/room code/i).fill(code)
    await this.page.getByRole('button', { name: /join room/i }).click()
    await expect(this.page.getByTestId('room-code')).toHaveText(code)
  }

  async pickTeam(team: 'A' | 'B') {
    await this.page.getByRole('button', { name: new RegExp(`join ${team}`, 'i') }).click()
  }

  async continueToSubmit() {
    await this.page.getByRole('button', { name: /everyone in/i }).click()
  }

  /** Enter 5 names (all prefixed so the privacy test can spot them) and submit. */
  async submitNames(prefix: string) {
    const inputs = this.page.getByPlaceholder(/cleopatra/i)
    await expect(inputs).toHaveCount(5)
    for (let i = 0; i < 5; i++) await inputs.nth(i).fill(`${prefix}${i}`)
    await this.page.getByRole('button', { name: /submit names/i }).click()
  }

  async startGame() {
    await this.page.getByRole('button', { name: /start the game/i }).click()
  }

  isMyTurnToStart() {
    return this.page
      .getByRole('button', { name: /start my turn/i })
      .isVisible()
      .catch(() => false)
  }

  gotItVisible() {
    return this.page
      .getByRole('button', { name: /got it/i })
      .isVisible()
      .catch(() => false)
  }

  gameOverVisible() {
    return this.page
      .getByText(GAME_OVER)
      .first()
      .isVisible()
      .catch(() => false)
  }

  async close() {
    await this.context.close()
  }
}

async function anyGameOver(players: Player[]): Promise<boolean> {
  for (const p of players) if (await p.gameOverVisible()) return true
  return false
}

/** The player who currently has the "start my turn" button. */
async function activePlayer(players: Player[]): Promise<Player | null> {
  for (const p of players) if (await p.isMyTurnToStart()) return p
  return null
}

/**
 * Play the whole game by clicking real buttons: find whoever's turn it is,
 * start it, then click "Got it!" until the bowl drains — repeat until game over.
 */
export async function playFullGame(players: Player[]) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (await anyGameOver(players)) return
    const active = await activePlayer(players)
    if (!active) {
      await players[0].page.waitForTimeout(150)
      continue
    }
    await active.page.getByRole('button', { name: /start my turn/i }).click().catch(() => {})
    const gotIt = active.page.getByRole('button', { name: /got it/i })
    // Wait for the turn to actually begin before draining (avoids exiting the
    // loop during the round_intro -> playing transition).
    await gotIt.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    while (await gotIt.isVisible().catch(() => false)) {
      await gotIt.click({ timeout: 2000 }).catch(() => {})
      await active.page.waitForTimeout(60)
      if (await anyGameOver(players)) return
    }
  }
  throw new Error('Game did not reach game-over within the time budget')
}

/** Stand up a room with 4 players on two teams, all names submitted, ready to start. */
export async function seatFourPlayers(browser: Browser) {
  const host = await Player.create(browser, 'Host')
  const code = await host.createRoom()
  const others = await Promise.all([
    Player.create(browser, 'P2'),
    Player.create(browser, 'P3'),
    Player.create(browser, 'P4'),
  ])
  for (const p of others) await p.joinRoom(code)

  const players = [host, ...others]
  const teams: ('A' | 'B')[] = ['A', 'B', 'A', 'B']
  for (let i = 0; i < players.length; i++) await players[i].pickTeam(teams[i])

  // Host can only continue once everyone is on a team.
  await expect(host.page.getByRole('button', { name: /everyone in/i })).toBeEnabled()
  await host.continueToSubmit()

  const prefixes = ['WORDH', 'WORDB', 'WORDC', 'WORDD']
  for (let i = 0; i < players.length; i++) await players[i].submitNames(prefixes[i])

  await expect(host.page.getByRole('button', { name: /start the game/i })).toBeEnabled()
  return { host, players, code }
}
