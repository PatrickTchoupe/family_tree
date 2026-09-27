import type { Person } from '../types/family'
import { getSpouseIds } from './family'

export const CARD_WIDTH = 206
export const CARD_HEIGHT = 116
export const UNIT_GAP = 44
export const STEP_Y = 212
export const PADDING_X = 74
export const PADDING_Y = 76

export interface PositionedPerson { person: Person; x: number; y: number; generation: number }
export interface TreeLayout { nodes: PositionedPerson[]; width: number; height: number; generations: number }
interface FamilyUnit { members: Person[]; width: number; desired: number; x: number }

/** Couples are laid out as one unit and every generation receives a minimum gap. */
export function createTreeLayout(people: Person[]): TreeLayout {
  const byId = new Map(people.map((person) => [person.id, person]))
  const depth = new Map<string, number>()
  const depthOf = (id: string, visiting = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!
    if (visiting.has(id)) return 0
    visiting.add(id)
    const person = byId.get(id)
    const parents = [person?.fatherId, person?.motherId].filter((parentId): parentId is string => Boolean(parentId && byId.has(parentId)))
    const value = parents.length ? 1 + Math.max(...parents.map((parentId) => depthOf(parentId, visiting))) : 0
    visiting.delete(id)
    depth.set(id, value)
    return value
  }
  people.forEach((person) => depthOf(person.id))
  for (let pass = 0; pass < people.length; pass += 1) {
    let changed = false
    for (const person of people) {
      const spouseDepth = person.spouseId ? depth.get(person.spouseId) : undefined
      if (spouseDepth !== undefined && spouseDepth > depth.get(person.id)!) { depth.set(person.id, spouseDepth); changed = true }
    }
    if (!changed) break
  }
  const grouped = new Map<number, Person[]>()
  people.forEach((person) => { const generation = depth.get(person.id) ?? 0; grouped.set(generation, [...(grouped.get(generation) ?? []), person]) })
  const positions = new Map<string, PositionedPerson>()
  const unitByPerson = new Map<string, FamilyUnit>()
  for (const generation of [...grouped.keys()].sort((a, b) => a - b)) {
    const row = grouped.get(generation) ?? []
    const units: FamilyUnit[] = []
    const seen = new Set<string>()
    for (const person of row) {
      if (seen.has(person.id)) continue
      const spouses = getSpouseIds(person).map((spouseId) => byId.get(spouseId)).filter((spouse): spouse is Person => Boolean(spouse && depth.get(spouse.id) === generation && !seen.has(spouse.id)))
      const members = [person, ...spouses]
      const unit: FamilyUnit = { members, width: members.length * CARD_WIDTH + (members.length - 1) * 18, desired: 0, x: 0 }
      units.push(unit); members.forEach((member) => { seen.add(member.id); unitByPerson.set(member.id, unit) })
    }
    for (const unit of units) {
      const parentCenters = unit.members.flatMap((member) => [member.fatherId, member.motherId]).map((id) => id ? unitByPerson.get(id) : undefined).filter((parent): parent is FamilyUnit => Boolean(parent)).map((parent) => parent.x + parent.width / 2)
      unit.desired = parentCenters.length ? parentCenters.reduce((sum, value) => sum + value, 0) / parentCenters.length - unit.width / 2 : PADDING_X
    }
    units.sort((a, b) => a.desired - b.desired)
    let cursor = PADDING_X
    for (const unit of units) { unit.x = Math.max(cursor, unit.desired); cursor = unit.x + unit.width + UNIT_GAP }
    units.forEach((unit) => unit.members.forEach((person, index) => positions.set(person.id, { person, x: unit.x + index * (CARD_WIDTH + 18), y: PADDING_Y + generation * STEP_Y, generation })))
  }
  const nodes = people.map((person) => positions.get(person.id)!).filter(Boolean)
  const maxX = Math.max(...nodes.map((node) => node.x + CARD_WIDTH), 0)
  const maxGeneration = Math.max(...nodes.map((node) => node.generation), 0)
  return { nodes, width: Math.max(820, maxX + PADDING_X), height: PADDING_Y * 2 + maxGeneration * STEP_Y + CARD_HEIGHT, generations: maxGeneration + 1 }
}
