import { Navigate } from 'react-big-calendar'
import type { ToolbarProps, View, Event } from 'react-big-calendar'

function normalizeViews<TEvent extends object>(views: ToolbarProps<TEvent>['views']): View[] {
  if (Array.isArray(views)) return views
  if (views && typeof views === 'object') {
    return (Object.keys(views) as View[]).filter((key) => {
      const v = (views as Record<string, boolean | object>)[key]
      return v !== false && v !== undefined
    })
  }
  return []
}

export default function CalendrierToolbar<TEvent extends object = Event>({
  label,
  localizer,
  onNavigate,
  onView,
  view,
  views,
}: ToolbarProps<TEvent>) {
  const messages = localizer.messages
  const viewNames = normalizeViews(views)

  return (
    <div className="rbc-toolbar calendrier-toolbar">
      <div className="calendrier-toolbar-today">
        <button type="button" onClick={() => onNavigate(Navigate.TODAY)}>
          {messages.today}
        </button>
      </div>

      <div className="calendrier-toolbar-month" aria-label="Mois affiché">
        <button
          type="button"
          className="calendrier-toolbar-arrow"
          onClick={() => onNavigate(Navigate.PREVIOUS)}
          aria-label={typeof messages.previous === 'string' ? messages.previous : 'Mois précédent'}
          title={typeof messages.previous === 'string' ? messages.previous : undefined}
        >
          ←
        </button>
        <span className="rbc-toolbar-label">{label}</span>
        <button
          type="button"
          className="calendrier-toolbar-arrow"
          onClick={() => onNavigate(Navigate.NEXT)}
          aria-label={typeof messages.next === 'string' ? messages.next : 'Mois suivant'}
          title={typeof messages.next === 'string' ? messages.next : undefined}
        >
          →
        </button>
      </div>

      {viewNames.length > 1 && (
        <div className="calendrier-toolbar-views rbc-btn-group">
          {viewNames.map((name) => (
            <button
              key={name}
              type="button"
              className={view === name ? 'rbc-active' : undefined}
              onClick={() => onView(name)}
            >
              {messages[name]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
