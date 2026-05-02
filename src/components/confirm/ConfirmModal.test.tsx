import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmModal from '@/components/confirm/ConfirmModal'

function mountLayoutMain() {
  const main = document.createElement('main')
  main.id = 'layout-main'
  document.body.appendChild(main)
}

beforeEach(() => {
  mountLayoutMain()
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        message="Message test"
      />,
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('shows title, message and actions when open', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Titre custom"
        message="Corps du message"
        confirmLabel="OK"
        cancelLabel="Retour"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Titre custom' })).toBeInTheDocument()
    expect(screen.getByText('Corps du message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ConfirmModal isOpen onClose={onClose} onConfirm={vi.fn()} message="Sure?" />)

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ConfirmModal isOpen onClose={onClose} onConfirm={vi.fn()} message="Sure?" />)

    const overlay = document.querySelector('#layout-main .confirm-modal-overlay')
    expect(overlay).not.toBeNull()
    await user.click(overlay as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm then onClose when confirm is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(<ConfirmModal isOpen onClose={onClose} onConfirm={onConfirm} message="Go?" />)

    await user.click(screen.getByRole('button', { name: 'Confirmer' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
