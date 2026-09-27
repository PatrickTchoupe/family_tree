import type { Person } from '../types/family'
import { formatYears, fullName, initials } from '../utils/family'

interface Props {
  person: Person
  selected: boolean
  onClick: () => void
}

export function PersonCard({ person, selected, onClick }: Props) {
  return (
    <button className={`person-card ${selected ? 'selected' : ''}`} type="button" onClick={onClick} aria-label={`Voir la fiche de ${fullName(person)}`}>
      <span className={`avatar avatar-${person.sex}`}>
        {person.photoUrl ? <img src={person.photoUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
        <span>{initials(person)}</span>
      </span>
      <span className="card-name">{fullName(person)}</span>
      <span className="card-years">{formatYears(person)}</span>
    </button>
  )
}
