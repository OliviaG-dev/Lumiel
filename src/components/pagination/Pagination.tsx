import './Pagination.css'

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1
  return Math.ceil(totalItems / pageSize)
}

export interface PaginationProps {
  /** Page courante (1-based) */
  currentPage: number
  /** Nombre total de pages (≥ 1) */
  totalPages: number
  onPageChange: (page: number) => void
  /** Style dashboard (boutons compacts type tableau de bord) */
  variant?: 'default' | 'dashboard'
  className?: string
  /** Libellé accessibilité pour la navigation */
  ariaLabel?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'default',
  className = '',
  ariaLabel = 'Pagination',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const prevDisabled = safePage <= 1
  const nextDisabled = safePage >= totalPages

  const rootClass = ['pagination', variant === 'dashboard' ? 'pagination--dashboard' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className={rootClass} aria-label={ariaLabel}>
      <button
        type="button"
        className="pagination__btn"
        disabled={prevDisabled}
        onClick={() => onPageChange(safePage - 1)}
      >
        Précédent
      </button>
      <span className="pagination__status">
        Page{' '}
        <span className="pagination__status-num">{safePage}</span>
        {' '}sur{' '}
        <span className="pagination__status-num">{totalPages}</span>
      </span>
      <button
        type="button"
        className="pagination__btn"
        disabled={nextDisabled}
        onClick={() => onPageChange(safePage + 1)}
      >
        Suivant
      </button>
    </nav>
  )
}
