import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scoreboard } from './Scoreboard'
import { makeState } from '../test/factories'

describe('Scoreboard', () => {
  it('renders both team scores', () => {
    render(<Scoreboard state={makeState({ phase: 'playing', scores: { A: 3, B: 5 } })} />)
    expect(screen.getByText('TEAM A')).toBeInTheDocument()
    expect(screen.getByText('TEAM B')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
