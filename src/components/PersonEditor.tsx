import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LifeEvent, LifeEventType, Person, PersonInput, Sex } from '../types/family'
import { formatDate, fullName, wouldCreateCycle } from '../utils/family'

interface Props {
  person?: Person
  people: Person[]
  onSave: (input: PersonInput) => void
  onDelete?: () => void
  onClose: () => void
}

function initialValues(person?: Person): PersonInput {
  return {
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    birthDate: person?.birthDate ?? '',
    deathDate: person?.deathDate ?? undefined,
    sex: person?.sex ?? 'other',
    photoUrl: person?.photoUrl ?? undefined,
    fatherId: person?.fatherId ?? undefined,
    motherId: person?.motherId ?? undefined,
    spouseId: person?.spouseId ?? undefined,
    spouseIds: person?.spouseIds ?? (person?.spouseId ? [person.spouseId] : []),
    birthPlace: person?.birthPlace ?? undefined,
    deathPlace: person?.deathPlace ?? undefined,
    profession: person?.profession ?? undefined,
    notes: person?.notes ?? undefined,
    events: person?.events ?? [],
  }
}

export function PersonEditor({ person, people, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<PersonInput>(() => initialValues(person))
  const [error, setError] = useState('')
  const [eventDraft, setEventDraft] = useState<{ type: LifeEventType; title: string; date: string; place: string; description: string }>({ type: 'custom', title: '', date: '', place: '', description: '' })
  const set = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) => {
    setForm((previous) => ({ ...previous, [key]: value || undefined }))
    setError('')
  }
  const relatives = people.filter((candidate) => candidate.id !== person?.id)
  const parents = relatives.filter((candidate) => !person || !wouldCreateCycle(people, person.id, candidate.id))
  const spouses = relatives

  const addEvent = () => {
    if (!eventDraft.title.trim()) return
    const event: LifeEvent = { id: crypto.randomUUID(), type: eventDraft.type, title: eventDraft.title.trim(), date: eventDraft.date || undefined, place: eventDraft.place.trim() || undefined, description: eventDraft.description.trim() || undefined }
    set('events', [...(form.events ?? []), event])
    setEventDraft({ type: 'custom', title: '', date: '', place: '', description: '' })
  }
  const removeEvent = (id: string) => set('events', (form.events ?? []).filter((event) => event.id !== id))

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const clean: PersonInput = {
      ...form,
      firstName: form.firstName?.trim() ?? '',
      lastName: form.lastName?.trim() ?? '',
      photoUrl: form.photoUrl?.trim() || undefined,
    }
    if (!clean.firstName || !clean.lastName || !clean.birthDate) {
      setError('Renseignez le prénom, le nom et la date de naissance.')
      return
    }
    if (clean.deathDate && clean.deathDate < clean.birthDate) {
      setError('La date de décès doit être après la naissance.')
      return
    }
    if (clean.fatherId && clean.fatherId === clean.motherId) {
      setError('Le père et la mère doivent être deux personnes différentes.')
      return
    }
    if (person && [clean.fatherId, clean.motherId].some((id) => id && wouldCreateCycle(people, person.id, id))) {
      setError('Ce lien créerait un cycle dans la famille.')
      return
    }
    onSave(clean)
  }

  const remove = () => {
    if (person && onDelete && window.confirm(`Supprimer ${fullName(person)} de l’arbre ?`)) onDelete()
  }

  return (
    <div className="editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="editor" aria-label={person ? `Fiche de ${fullName(person)}` : 'Nouvelle personne'}>
        <div className="editor-topline"><span>FICHE PERSONNELLE</span><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer">×</button></div>
        <h2>{person ? fullName(person) : 'Nouvelle personne'}</h2>
        <p className="editor-lead">{person ? `Né·e le ${formatDate(person.birthDate)} · Modifiez sa fiche et ses liens familiaux.` : 'Renseignez les informations essentielles pour l’ajouter à l’arbre.'}</p>
        <form id="person-form" onSubmit={submit}>
          <div className="form-section-heading"><span>01</span> Identité</div>
          <div className="field-grid">
            <label>Prénom <input autoFocus required maxLength={80} value={form.firstName ?? ''} onChange={(event) => set('firstName', event.target.value)} placeholder="Ex. Marie" /></label>
            <label>Nom <input required maxLength={80} value={form.lastName ?? ''} onChange={(event) => set('lastName', event.target.value)} placeholder="Ex. Dupont" /></label>
          </div>
          <label>Sexe
            <select value={form.sex} onChange={(event) => set('sex', event.target.value as Sex)}>
              <option value="other">Autre / non précisé</option><option value="female">Femme</option><option value="male">Homme</option>
            </select>
          </label>
          <div className="field-grid">
            <label>Date de naissance <input required type="date" value={form.birthDate ?? ''} onChange={(event) => set('birthDate', event.target.value)} /></label>
            <label>Date de décès <span className="optional">facultatif</span><input type="date" value={form.deathDate ?? ''} onChange={(event) => set('deathDate', event.target.value)} /></label>
          </div>
          <label>Photo <span className="optional">URL facultative</span><input type="url" value={form.photoUrl ?? ''} onChange={(event) => set('photoUrl', event.target.value)} placeholder="https://exemple.com/photo.jpg" /></label>
          <div className="form-section-heading section-spacing"><span>02</span> Liens familiaux</div>
          <p className="field-help">Vous pouvez compléter ces liens plus tard.</p>
          <label>Père
            <select value={form.fatherId ?? ''} onChange={(event) => set('fatherId', event.target.value)}><option value="">Aucun renseigné</option>{parents.map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)}</option>)}</select>
          </label>
          <label>Mère
            <select value={form.motherId ?? ''} onChange={(event) => set('motherId', event.target.value)}><option value="">Aucune renseignée</option>{parents.map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)}</option>)}</select>
          </label>
          <label>Conjoint·es <span className="optional">plusieurs choix possibles</span>
            <select multiple value={form.spouseIds ?? []} onChange={(event) => set('spouseIds', Array.from(event.target.selectedOptions, (option) => option.value))}>{spouses.map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)}</option>)}</select>
          </label>
          <div className="field-grid">
            <label>Lieu de naissance <input value={form.birthPlace ?? ''} onChange={(event) => set('birthPlace', event.target.value)} placeholder="Ville, pays" /></label>
            <label>Lieu de décès <input value={form.deathPlace ?? ''} onChange={(event) => set('deathPlace', event.target.value)} placeholder="Ville, pays" /></label>
          </div>
          <label>Profession <input value={form.profession ?? ''} onChange={(event) => set('profession', event.target.value)} placeholder="Ex. Enseignante" /></label>
          <label>Notes biographiques <textarea value={form.notes ?? ''} onChange={(event) => set('notes', event.target.value)} placeholder="Quelques repères sur cette personne…" /></label>
          <div className="form-section-heading section-spacing"><span>03</span> Événements de vie</div>
          <div className="event-draft">
            <div className="field-grid"><select value={eventDraft.type} onChange={(event) => setEventDraft({ ...eventDraft, type: event.target.value as LifeEventType })}><option value="custom">Événement</option><option value="marriage">Mariage</option><option value="divorce">Divorce</option><option value="place">Lieu de vie</option><option value="profession">Profession</option><option value="note">Note</option></select><input type="date" value={eventDraft.date} onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })} /></div>
            <input value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="Titre de l'événement" />
            <div className="field-grid"><input value={eventDraft.place} onChange={(event) => setEventDraft({ ...eventDraft, place: event.target.value })} placeholder="Lieu (facultatif)" /><button type="button" className="secondary-button" onClick={addEvent}>Ajouter</button></div>
          </div>
          {(form.events ?? []).length > 0 && <ul className="event-list">{(form.events ?? []).map((event) => <li key={event.id}><span><strong>{event.title}</strong><small>{event.date ?? 'Date inconnue'}{event.place ? ` · ${event.place}` : ''}</small></span><button type="button" onClick={() => removeEvent(event.id)} aria-label={`Supprimer ${event.title}`}>×</button></li>)}</ul>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <div className="editor-actions">
          {person && <button type="button" className="delete-button" onClick={remove}>Supprimer</button>}
          <button type="submit" form="person-form" className="primary-button">{person ? 'Enregistrer' : 'Ajouter à l’arbre'} <span aria-hidden="true">↗</span></button>
        </div>
      </aside>
    </div>
  )
}
