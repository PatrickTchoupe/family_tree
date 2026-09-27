import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { requireAuth } from './middleware/auth.js'
import { prisma } from './db.js'
import { authRouter } from './routes/auth.js'
import { peopleRouter } from './routes/people.js'
import { relationsRouter } from './routes/relations.js'
import { treesRouter } from './routes/trees.js'

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',').map((value) => value.trim()) ?? true }))
app.use(express.json({ limit: '5mb' }))
app.get('/health', (_request, response) => response.json({ ok: true, service: 'arbre-familial-api' }))
app.use('/api/auth', authRouter)
app.use('/api/trees', requireAuth, treesRouter)
app.use('/api/trees/:treeId/people', requireAuth, peopleRouter)
app.use('/api/trees/:treeId/relations', requireAuth, relationsRouter)
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => { console.error(error); response.status(500).json({ error: 'Erreur interne du serveur.' }) })

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => console.log(`Arbre familial API listening on :${port}`))
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0) })
