import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'

export const treesRouter = Router()
const personSchema = z.object({ id: z.string().uuid().optional(), firstName: z.string().min(1), lastName: z.string().min(1), birthDate: z.string(), deathDate: z.string().optional().nullable(), sex: z.string(), photoUrl: z.string().optional().nullable(), birthPlace: z.string().optional().nullable(), deathPlace: z.string().optional().nullable(), profession: z.string().optional().nullable(), notes: z.string().optional().nullable(), fatherId: z.string().uuid().optional().nullable(), motherId: z.string().uuid().optional().nullable(), spouseIds: z.array(z.string().uuid()).default([]), events: z.array(z.object({ id: z.string().uuid().optional(), type: z.string(), date: z.string().optional().nullable(), title: z.string(), place: z.string().optional().nullable(), description: z.string().optional().nullable() })).default([]) })
const treeSchema = z.object({ name: z.string().trim().min(1).max(120) })

async function ownedTree(treeId: string, userId: string) { return prisma.familyTree.findFirst({ where: { id: treeId, ownerId: userId } }) }
export async function treeSnapshot(treeId: string) { return prisma.familyTree.findUnique({ where: { id: treeId }, include: { people: { include: { events: true } }, relations: true } }) }

treesRouter.get('/', async (request, response) => response.json(await prisma.familyTree.findMany({ where: { ownerId: request.userId! }, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, createdAt: true, updatedAt: true, _count: { select: { people: true } } } })))
treesRouter.post('/', async (request, response) => { const parsed = treeSchema.safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Nom d’arbre invalide.' }); return response.status(201).json(await prisma.familyTree.create({ data: { name: parsed.data.name, ownerId: request.userId! } })) })
treesRouter.get('/:treeId', async (request, response) => { const tree = await ownedTree(request.params.treeId, request.userId!); if (!tree) return response.status(404).json({ error: 'Arbre introuvable.' }); return response.json(await treeSnapshot(tree.id)) })
treesRouter.patch('/:treeId', async (request, response) => { const tree = await ownedTree(request.params.treeId, request.userId!); if (!tree) return response.status(404).json({ error: 'Arbre introuvable.' }); const parsed = treeSchema.partial().safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Données invalides.' }); return response.json(await prisma.familyTree.update({ where: { id: tree.id }, data: parsed.data })) })
treesRouter.delete('/:treeId', async (request, response) => { const tree = await ownedTree(request.params.treeId, request.userId!); if (!tree) return response.status(404).json({ error: 'Arbre introuvable.' }); await prisma.familyTree.delete({ where: { id: tree.id } }); return response.status(204).send() })

treesRouter.post('/:treeId/import-local', async (request, response) => { const tree = await ownedTree(request.params.treeId, request.userId!); if (!tree) return response.status(404).json({ error: 'Arbre introuvable.' }); const parsed = z.object({ people: z.array(personSchema) }).safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Snapshot local invalide.' }); await replaceSnapshot(tree.id, parsed.data.people); return response.status(201).json(await treeSnapshot(tree.id)) })
treesRouter.put('/:treeId/snapshot', async (request, response) => { const tree = await ownedTree(request.params.treeId, request.userId!); if (!tree) return response.status(404).json({ error: 'Arbre introuvable.' }); const parsed = z.object({ people: z.array(personSchema) }).safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Snapshot invalide.' }); await replaceSnapshot(tree.id, parsed.data.people); return response.json(await treeSnapshot(tree.id)) })

async function replaceSnapshot(treeId: string, people: z.infer<typeof personSchema>[]) {
  await prisma.$transaction(async (transaction) => {
    await transaction.relation.deleteMany({ where: { treeId } }); await transaction.person.deleteMany({ where: { treeId } })
    const ids = new Set(people.map((person) => person.id).filter(Boolean))
    for (const person of people) { const id = person.id && ids.has(person.id) ? person.id : undefined; await transaction.person.create({ data: { ...(id ? { id } : {}), treeId, firstName: person.firstName, lastName: person.lastName, birthDate: person.birthDate, deathDate: person.deathDate, sex: person.sex, photoUrl: person.photoUrl, birthPlace: person.birthPlace, deathPlace: person.deathPlace, profession: person.profession, notes: person.notes, events: { create: person.events.map((event) => ({ type: event.type, date: event.date, title: event.title, place: event.place, description: event.description })) } } }) }
    const validIds = new Set(people.map((person) => person.id).filter((id): id is string => Boolean(id)))
    for (const person of people) { if (!person.id || !validIds.has(person.id)) continue; const parents = [{ id: person.fatherId, type: 'FATHER' as const }, { id: person.motherId, type: 'MOTHER' as const }]; const spouseIds = person.spouseIds ?? []; for (const relation of [...parents, ...spouseIds.map((id) => ({ id, type: 'SPOUSE' as const }))]) if (relation.id && validIds.has(relation.id)) await transaction.relation.create({ data: { treeId, fromId: relation.id, toId: person.id, type: relation.type }, }).catch(() => undefined) }
  })
}
