import type { EventProps } from 'react-big-calendar'
import type { Reservation } from '../../../../types/reservation'
import CalendrierDispoIcon from './CalendrierDispoIcon'

export default function CalendrierEvent({ event, title }: EventProps<Reservation>) {
  const r = event as Reservation
  if (r.type === 'disponibilité') {
    return (
      <span className="calendrier-event-dispo-inner" title="Disponibilité">
        <CalendrierDispoIcon className="calendrier-event-dispo-icon" />
        <span className="sr-only">Disponibilité</span>
      </span>
    )
  }
  return <>{title}</>
}
