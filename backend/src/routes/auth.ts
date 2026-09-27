import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { z } from 'zod'
import { hashPassword, signToken, verifyPassword } from '../auth.js'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()
const credentials = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), password: z.string().min(8), displayName: z.string().trim().min(1).max(120).optional() })
authRouter.get('/me', requireAuth, async (request, response) => { const user = await prisma.user.findUnique({ where: { id: request.userId! } }); if (!user) return response.status(404).json({ error: 'Utilisateur introuvable.' }); return response.json(publicUser(user)) })

authRouter.post('/register', async (request, response) => {
  const parsed = credentials.safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Email valide et mot de passe de 8 caractères minimum requis.' })
  const { email, password, displayName } = parsed.data
  try { const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password), displayName } }); return response.status(201).json({ user: publicUser(user), token: signToken(user) }) } catch { return response.status(409).json({ error: 'Cet email est déjà utilisé.' }) }
})

authRouter.post('/login', async (request, response) => {
  const parsed = credentials.pick({ email: true, password: true }).safeParse(request.body); if (!parsed.success) return response.status(400).json({ error: 'Email ou mot de passe invalide.' })
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } }); if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) return response.status(401).json({ error: 'Email ou mot de passe incorrect.' })
  return response.json({ user: publicUser(user), token: signToken(user) })
})

authRouter.post('/oauth/:provider', async (request, response) => {
  const provider = request.params.provider.toLowerCase(); const idToken = z.string().min(20).safeParse(request.body?.idToken); if (!idToken.success) return response.status(400).json({ error: 'idToken requis.' })
  try {
    let email: string | undefined; let subject: string | undefined; let displayName: string | undefined
    if (provider === 'google') {
      if (!process.env.GOOGLE_CLIENT_ID) return response.status(503).json({ error: 'GOOGLE_CLIENT_ID n’est pas configuré.' })
      const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: idToken.data, audience: process.env.GOOGLE_CLIENT_ID }); const payload = ticket.getPayload(); email = payload?.email; subject = payload?.sub; displayName = payload?.name
    } else if (provider === 'apple') {
      if (!process.env.APPLE_CLIENT_ID) return response.status(503).json({ error: 'APPLE_CLIENT_ID n’est pas configuré.' })
      const verified = await jwtVerify(idToken.data, createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')), { issuer: 'https://appleid.apple.com', audience: process.env.APPLE_CLIENT_ID }); email = typeof verified.payload.email === 'string' ? verified.payload.email : undefined; subject = verified.payload.sub
    } else return response.status(400).json({ error: 'Fournisseur OAuth non pris en charge.' })
    if (!email || !subject) return response.status(401).json({ error: 'Le profil OAuth ne contient pas les informations requises.' })
    const authProvider = provider.toUpperCase() as 'GOOGLE' | 'APPLE'; const user = await prisma.user.upsert({ where: { provider_providerSub: { provider: authProvider, providerSub: subject } }, update: { email, displayName }, create: { email, displayName, provider: authProvider, providerSub: subject } })
    return response.json({ user: publicUser(user), token: signToken(user) })
  } catch { return response.status(401).json({ error: 'Jeton OAuth invalide.' }) }
})

function publicUser(user: { id: string; email: string; displayName: string | null; provider: string }) { return { id: user.id, email: user.email, displayName: user.displayName, provider: user.provider } }
