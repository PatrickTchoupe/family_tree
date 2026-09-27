export type Sex = 'male' | 'female' | 'other'

export type LifeEventType = 'birth' | 'death' | 'marriage' | 'divorce' | 'place' | 'profession' | 'note' | 'custom'

export interface LifeEvent {
  id: string
  type: LifeEventType
  date?: string
  title: string
  place?: string
  description?: string
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  deathDate?: string
  sex: Sex
  photoUrl?: string
  fatherId?: string
  motherId?: string
  /** Canonical relationship field. spouseId is retained for old localStorage records. */
  spouseIds?: string[]
  spouseId?: string
  birthPlace?: string
  deathPlace?: string
  profession?: string
  notes?: string
  events?: LifeEvent[]
}

export type RelationType = 'father' | 'mother' | 'spouse'

export interface Relation {
  fromId: string
  toId: string
  type: RelationType
}

export type PersonInput = Omit<Person, 'id'>
