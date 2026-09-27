import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { AuthProvider, User } from '@prisma/client'

const secret = () => process.env.JWT_SECRET ?? 'development-only-secret'
export interface TokenPayload { sub: string; email: string }
export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)
export const signToken = (user: Pick<User, 'id' | 'email'>) => jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '7d' })
export const readToken = (token: string): TokenPayload => jwt.verify(token, secret()) as TokenPayload
export const providerFrom = (provider: string): AuthProvider => provider.toUpperCase() as AuthProvider
