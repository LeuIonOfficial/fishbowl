import { test, expect } from '@playwright/test'
import { Player, seatFourPlayers, playFullGame } from './helpers'

test.describe('Fishbowl — real browsers', () => {
  test('4 players play a full 3-round game to a winner', async ({ browser }) => {
    const { host, players } = await seatFourPlayers(browser)

    host.startGame()
    // Everyone lands in round 1.
    await expect(host.page.getByText(/round 1 — describe/i)).toBeVisible()

    await playFullGame(players)

    // Every player sees the same game-over result.
    for (const p of players) {
      await expect(p.page.getByText(/wins!|it's a tie/i)).toBeVisible()
      await expect(p.page.getByText('TEAM A', { exact: true })).toBeVisible()
      await expect(p.page.getByText('TEAM B', { exact: true })).toBeVisible()
    }

    // Host can restart back into the submit phase.
    await host.page.getByRole('button', { name: /play again/i }).click()
    await expect(host.page.getByText(/add 5 names/i)).toBeVisible()

    for (const p of players) await p.close()
  })

  test('the secret word is visible to the clue-giver but never to teammates/opponents', async ({
    browser,
  }) => {
    const { host, players } = await seatFourPlayers(browser)
    host.startGame()
    await expect(host.page.getByText(/round 1 — describe/i)).toBeVisible()

    // Whoever is up starts their turn.
    let active: Player | null = null
    for (const p of players) {
      if (await p.page.getByRole('button', { name: /start my turn/i }).isVisible().catch(() => false)) {
        active = p
        break
      }
    }
    expect(active, 'one player should have the start-turn button').not.toBeNull()
    await active!.page.getByRole('button', { name: /start my turn/i }).click()

    // The clue-giver now sees a real word (all our names contain "WORD").
    await expect(active!.page.getByText(/WORD/).first()).toBeVisible()

    // Before any guess, no one else has the word on screen.
    for (const p of players) {
      if (p === active) continue
      await expect(p.page.getByText(/is giving clues/i)).toBeVisible()
      await expect(p.page.getByText(/WORD/)).toHaveCount(0)
    }

    for (const p of players) await p.close()
  })
})
