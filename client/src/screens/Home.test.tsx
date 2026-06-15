import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from './Home'
import { makeGame } from '../test/factories'

describe('Home', () => {
  it('creates a room when the create button is tapped', async () => {
    const game = makeGame()
    render(<Home game={game} />)
    await userEvent.click(screen.getByRole('button', { name: /create a room/i }))
    expect(game.createRoom).toHaveBeenCalledOnce()
  })

  it('disables Join until a 4-letter code is entered', async () => {
    const game = makeGame()
    render(<Home game={game} />)
    const join = screen.getByRole('button', { name: /join room/i })
    expect(join).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText(/room code/i), 'wxyz')
    expect(join).toBeEnabled()
  })

  it('joins with the uppercased code', async () => {
    const game = makeGame()
    render(<Home game={game} />)
    await userEvent.type(screen.getByPlaceholderText(/room code/i), 'wxyz')
    await userEvent.click(screen.getByRole('button', { name: /join room/i }))
    expect(game.joinRoom).toHaveBeenCalledWith('WXYZ')
  })
})
