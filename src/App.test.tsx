import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders FAMAPP heading', () => {
    render(<App />)
    expect(screen.getByText('FAMAPP')).toBeInTheDocument()
  })

  it('renders coming soon message', () => {
    render(<App />)
    expect(screen.getByText('Family Organizer - Coming Soon')).toBeInTheDocument()
  })
})