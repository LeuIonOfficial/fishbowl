import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundIntro } from './RoundIntro'
import { makeGame, makeState, makePlayer } from '../test/factories'

const introState = (over = {}) =>
  makeState({
    phase: 'round_intro',
    round: 2,
    activeTeam: 'B',
    activePlayerId: 'p2',
    bowlCount: 20,
    players: [
      makePlayer({ id: 'p1', name: 'Host', teamId: 'A' }),
      makePlayer({ id: 'p2', name: 'Bea', teamId: 'B' }),
    ],
    ...over,
  })

describe('RoundIntro', () => {
  it('shows the rule for the current round and who is up', () => {
    render(<RoundIntro game={makeGame({ state: introState(), meId: 'p1' })} />)
    expect(screen.getByText(/round 2 — two words/i)).toBeInTheDocument()
    expect(screen.getByText('Bea')).toBeInTheDocument()
  })

  it('lets the active player start their turn', async () => {
    const game = makeGame({ state: introState(), meId: 'p2', isActive: true })
    render(<RoundIntro game={game} />)
    await userEvent.click(screen.getByRole('button', { name: /start my turn/i }))
    expect(game.beginTurn).toHaveBeenCalledOnce()
  })

  it('asks everyone else to wait', () => {
    render(<RoundIntro game={makeGame({ state: introState(), meId: 'p1', isActive: false })} />)
    expect(screen.getByText(/waiting for bea to start/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start my turn/i })).toBeNull()
  })
})
