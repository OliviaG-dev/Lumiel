import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Pagination, { getTotalPages } from '@/components/pagination/Pagination'

describe('getTotalPages', () => {
  it('returns 1 for zero or negative items', () => {
    expect(getTotalPages(0, 10)).toBe(1)
    expect(getTotalPages(-3, 10)).toBe(1)
  })

  it('returns ceil of items over page size', () => {
    expect(getTotalPages(10, 3)).toBe(4)
    expect(getTotalPages(9, 3)).toBe(3)
    expect(getTotalPages(10, 10)).toBe(1)
  })
})

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows current page and total, and navigates with buttons', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
        ariaLabel="Liste paginée"
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Liste paginée' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Précédent' }))
    expect(onPageChange).toHaveBeenCalledWith(1)

    await user.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous on first page and next on last page', () => {
    const onPageChange = vi.fn()

    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />,
    )
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Suivant' })).not.toBeDisabled()

    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Précédent' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()
  })
})
