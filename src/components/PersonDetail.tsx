import type { Person } from '../types/family'
import { eventLabel, formatDate, fullName, getSpouseIds, initials } from '../utils/family'

interface Props { person: Person; people: Person[]; onEdit: () => void; onClose: () => void }

export function PersonDetail({ person, people, onEdit, onClose }: Props) {
  const events = [...(person.events ?? [])]
  if (person.birthDate) events.push({ id: `${person.id}-birth`, type: 'birth', title: 'Naissance', date: person.birthDate, place: person.birthPlace })
  if (person.deathDate) events.push({ id: `${person.id}-death`, type: 'death', title: 'Décès', date: person.deathDate, place: person.deathPlace })
  events.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  const spouseNames = getSpouseIds(person).map((id) => people.find((candidate) => candidate.id === id)).filter(Boolean).map((candidate) => fullName(candidate!))

  return <div className="editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="detail-panel" aria-label={`Fiche détaillée de ${fullName(person)}`}>
      <div className="editor-topline"><span>FICHE DÉTAILLÉE</span><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer">×</button></div>
      <div className="detail-hero"><div className={`detail-avatar avatar-${person.sex}`}>{person.photoUrl ? <img src={person.photoUrl} alt="" /> : <span>{initials(person)}</span>}</div><div><h2>{fullName(person)}</h2><p>{person.birthDate ? `Né·e le ${formatDate(person.birthDate)}` : 'Date de naissance inconnue'}{person.birthPlace ? ` · ${person.birthPlace}` : ''}</p></div></div>
      <div className="detail-actions"><button type="button" className="secondary-button" onClick={onEdit}>Modifier la fiche</button></div>
      <div className="detail-facts">{person.profession && <div><span>Profession</span><strong>{person.profession}</strong></div>}{spouseNames.length > 0 && <div><span>Conjoint·es</span><strong>{spouseNames.join(' · ')}</strong></div>}{person.notes && <div className="fact-wide"><span>Notes</span><p>{person.notes}</p></div>}</div>
      <h3 className="timeline-title">Chronologie de vie</h3>
      {events.length ? <ol className="timeline">{events.map((event) => <li key={event.id}><span className="timeline-dot" /><div><small>{event.date ? formatDate(event.date) : 'Date inconnue'} · {eventLabel(event)}</small><strong>{event.title}</strong>{event.place && <span>{event.place}</span>}{event.description && <p>{event.description}</p>}</div></li>)}</ol> : <p className="empty-detail">Ajoutez des événements depuis la modification de la fiche.</p>}
    </aside>
  </div>
}
