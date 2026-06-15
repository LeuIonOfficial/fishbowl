import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameOver } from './GameOver'
import { makeGame, makeState } from '../test/factories'

describe('GameOver', () => {
  it('announces the winning team', () => {
    const state = makeState({ phase: 'game_over', winner: 'A', scores: { A: 40, B: 20 } })
    render(<GameOver game={makeGame({ state })} />)
    expect(screen.getByText(/team a wins/i)).toBeInTheDocument()
  })

  it('shows a tie when scores are equal', () => {
    const state = makeState({ phase: 'game_over', winner: 'tie', scores: { A: 30, B: 30 } })
    render(<GameOver game={makeGame({ state })} />)
    expect(screen.getByText(/it's a tie/i)).toBeInTheDocument()
  })

  it('lets the host start a new game', async () => {
    const state = makeState({ phase: 'game_over', winner: 'B', scores: { A: 20, B: 40 } })
    const game = makeGame({ state, isHost: true })
    render(<GameOver game={game} />)
    await userEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(game.playAgain).toHaveBeenCalledOnce()
  })
})
