import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Play } from './Play'
import { makeGame, makeState, makePlayer } from '../test/factories'

const playingState = (over = {}) =>
  makeState({
    phase: 'playing',
    round: 1,
    activeTeam: 'A',
    activePlayerId: 'p1',
    turnEndsAt: Date.now() + 30_000,
    bowlCount: 12,
    players: [
      makePlayer({ id: 'p1', name: 'Host', teamId: 'A' }),
      makePlayer({ id: 'p2', name: 'Bea', teamId: 'B' }),
    ],
    ...over,
  })

describe('Play — clue-giver', () => {
  it('shows the secret word and scores it on "Got it!"', async () => {
    const game = makeGame({
      state: playingState(),
      meId: 'p1',
      isActive: true,
      currentName: 'Cleopatra',
    })
    render(<Play game={game} />)
    expect(screen.getByText('Cleopatra')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(game.guessCorrect).toHaveBeenCalledOnce()
  })

  it('offers no skip action (no skipping rule)', () => {
    const game = makeGame({
      state: playingState(),
      meId: 'p1',
      isActive: true,
      currentName: 'Cleopatra',
    })
    render(<Play game={game} />)
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull()
  })
})

describe('Play — everyone else', () => {
  it('never renders the secret word for non-active players', () => {
    const game = makeGame({
      state: playingState({ activePlayerId: 'p1' }),
      meId: 'p2',
      isActive: false,
      currentName: null, // server never sends it to non-active sockets
    })
    render(<Play game={game} />)
    expect(screen.getByText(/host is giving clues/i)).toBeInTheDocument()
    expect(screen.queryByText('Cleopatra')).toBeNull()
    expect(screen.queryByRole('button', { name: /got it/i })).toBeNull()
  })
})
