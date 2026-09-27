import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import type { Request } from 'express'

export const peopleRouter = Router({ mergeParams: true })
const input = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), birthDate: z.string(), deathDate: z.string().optional().nullable(), sex: z.string(), photoUrl: z.string().optional().nullable(), birthPlace: z.string().optional().nullable(), deathPlace: z.string().optional().nullable(), profession: z.string().optional().nullable(), notes: z.string().optional().nullable() })
const owned = (treeId: string, userId: string) => prisma.familyTree.findFirst({ where: { id: treeId, ownerId: userId } })
const treeId = (request: Request): string => (request.params as Record<string, string>).treeId
peopleRouter.get('/', async (request, response) => { const id = treeId(request); if (!await owned(id, request.userId!)) return response.status(404).json({ error: 'Arbre introuvable.' }); return response.json(await prisma.person.findMany({ where: { treeId: id }, include: { events: true } })) })
peopleRouter.post('/', async (request, response) => { const id = treeId(request); if (!await owned(id, request.userId!)) return response.status(404).json({ error: 'Arbre introuvable.' }); const parsed = input.safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Personne invalide.' }); return response.status(201).json(await prisma.person.create({ data: { ...parsed.data, treeId: id } })) })
peopleRouter.patch('/:personId', async (request, response) => { const id = treeId(request); if (!await owned(id, request.userId!)) return response.status(404).json({ error: 'Arbre introuvable.' }); const parsed = input.partial().safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Personne invalide.' }); return response.json(await prisma.person.update({ where: { id: request.params.personId, treeId: id }, data: parsed.data })) })
peopleRouter.delete('/:personId', async (request, response) => { const id = treeId(request); if (!await owned(id, request.userId!)) return response.status(404).json({ error: 'Arbre introuvable.' }); await prisma.person.delete({ where: { id: request.params.personId, treeId: id } }); return response.status(204).send() })
