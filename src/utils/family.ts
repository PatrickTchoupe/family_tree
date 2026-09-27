import type { LifeEvent, Person, Relation, Sex } from '../types/family'

export const fullName = (person: Person): string => `${person.firstName} ${person.lastName}`.trim()

export const initials = (person: Person): string =>
  `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase()

export const formatDate = (value?: string): string => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export const formatYears = (person: Person): string =>
  `${person.birthDate.slice(0, 4)}${person.deathDate ? ` — ${person.deathDate.slice(0, 4)}` : ''}`

export const getSpouseIds = (person: Person): string[] => Array.from(new Set([...(person.spouseIds ?? []), ...(person.spouseId ? [person.spouseId] : [])]))

export const eventLabel = (event: LifeEvent): string => ({ birth: 'Naissance', death: 'Décès', marriage: 'Mariage', divorce: 'Divorce', place: 'Lieu de vie', profession: 'Profession', note: 'Note', custom: 'Événement' })[event.type]

// A parent cannot be a descendant of the person being edited.
export function wouldCreateCycle(people: Person[], personId: string, candidateParentId: string): boolean {
  const pending = [candidateParentId]
  const visited = new Set<string>()
  while (pending.length) {
    const id = pending.pop()!
    if (id === personId) return true
    if (visited.has(id)) continue
    visited.add(id)
    for (const child of people) {
      if (child.fatherId === id || child.motherId === id) pending.push(child.id)
    }
  }
  return false
}

export function getRelations(people: Person[]): Relation[] {
  const ids = new Set(people.map((person) => person.id))
  const relations: Relation[] = []
  for (const person of people) {
    if (person.fatherId && ids.has(person.fatherId)) relations.push({ fromId: person.fatherId, toId: person.id, type: 'father' })
    if (person.motherId && ids.has(person.motherId)) relations.push({ fromId: person.motherId, toId: person.id, type: 'mother' })
    getSpouseIds(person).forEach((spouseId) => {
      if (ids.has(spouseId) && person.id < spouseId) relations.push({ fromId: person.id, toId: spouseId, type: 'spouse' })
    })
  }
  return relations
}

export function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  const validSex: Sex[] = ['male', 'female', 'other']
  return typeof p.id === 'string' && typeof p.firstName === 'string' &&
    typeof p.lastName === 'string' && typeof p.birthDate === 'string' &&
    validSex.includes(p.sex as Sex) &&
    ['deathDate', 'photoUrl', 'fatherId', 'motherId', 'spouseId', 'birthPlace', 'deathPlace', 'profession', 'notes'].every((key) => p[key] === undefined || typeof p[key] === 'string') &&
    (p.spouseIds === undefined || (Array.isArray(p.spouseIds) && p.spouseIds.every((id) => typeof id === 'string'))) &&
    (p.events === undefined || (Array.isArray(p.events) && p.events.every((event) => event && typeof event === 'object' && typeof (event as Record<string, unknown>).id === 'string' && typeof (event as Record<string, unknown>).title === 'string')))
}
