import { useEffect, useState } from 'react'
import type { Person, PersonInput } from '../types/family'
import { getSpouseIds, isPerson } from '../utils/family'

const STORAGE_KEY = 'arbre-familial:v1'

function loadPeople(): Person[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter(isPerson).map(migratePerson) : []
  } catch {
    return []
  }
}

function migratePerson(person: Person): Person {
  return { ...person, spouseIds: getSpouseIds(person), events: person.events ?? [] }
}

export function useFamily() {
  const [people, setPeople] = useState<Person[]>(loadPeople)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [people])

  const addPerson = (input: PersonInput): string => {
    const id = crypto.randomUUID()
    setPeople((current) => linkSpouses([...current, { ...input, id, spouseIds: input.spouseIds ?? [] }], id, input.spouseIds ?? []))
    return id
  }

  const updatePerson = (id: string, input: PersonInput): void => {
    setPeople((current) => linkSpouses(current.map((person) => person.id === id ? { ...input, id, spouseIds: input.spouseIds ?? [] } : person), id, input.spouseIds ?? []))
  }

  const deletePerson = (id: string): void => {
    setPeople((current) => current.filter((person) => person.id !== id).map((person) => ({
      ...person,
      fatherId: person.fatherId === id ? undefined : person.fatherId,
      motherId: person.motherId === id ? undefined : person.motherId,
      spouseId: person.spouseId === id ? undefined : person.spouseId,
      spouseIds: getSpouseIds(person).filter((spouseId) => spouseId !== id),
      events: person.events ?? [],
    })))
  }

  const replacePeople = (nextPeople: Person[]): void => setPeople(nextPeople.map(migratePerson))

  return { people, storageError, addPerson, updatePerson, deletePerson, replacePeople }
}

function linkSpouses(people: Person[], id: string, spouseIds: string[]): Person[] {
  const wanted = new Set(spouseIds)
  return people.map((person) => {
    if (person.id === id) return { ...person, spouseIds: [...wanted], spouseId: undefined }
    const current = new Set(getSpouseIds(person))
    if (wanted.has(person.id)) current.add(id)
    else current.delete(id)
    return { ...person, spouseIds: [...current], spouseId: undefined }
  })
}

export function normalizeImportedPeople(people: Person[]): Person[] { return people.map(migratePerson) }

export type PersonMutation = (id: string, update: (person: Person) => Person) => void
