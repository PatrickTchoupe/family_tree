import type { NextFunction, Request, Response } from 'express'
import { readToken } from '../auth.js'

declare global { namespace Express { interface Request { userId?: string } } }

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization')
  if (!header?.startsWith('Bearer ')) return response.status(401).json({ error: 'Authentification requise.' })
  try { request.userId = readToken(header.slice(7)).sub; next() } catch { return response.status(401).json({ error: 'Jeton invalide ou expiré.' }) }
}
