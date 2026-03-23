import { createPortal } from 'react-dom'
import './ConfirmModal.css'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const target = document.getElementById('layout-main')
  const content = (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-cancel" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-confirm confirm-modal-confirm--${variant}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return target ? createPortal(content, target) : content
}
