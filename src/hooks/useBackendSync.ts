import { useEffect, useRef, useState } from 'react'
import type { Person } from '../types/family'
import { apiRequest, authApi, tokenStore, type AuthResponse, type AuthUser } from '../api/client'

interface RemoteTree { id: string; name: string; people: Array<Person & { events?: Person['events'] }>; relations: Array<{ fromId: string; toId: string; type: 'FATHER' | 'MOTHER' | 'SPOUSE' }> }
const treeKey = 'arbre-familial:remote-tree'; const migrationKey = 'arbre-familial:backend-migrated'
function fromRemote(tree: RemoteTree): Person[] { return tree.people.map((person) => ({ ...person, fatherId: tree.relations.find((relation) => relation.toId === person.id && relation.type === 'FATHER')?.fromId, motherId: tree.relations.find((relation) => relation.toId === person.id && relation.type === 'MOTHER')?.fromId, spouseIds: tree.relations.filter((relation) => relation.type === 'SPOUSE' && relation.fromId === person.id).map((relation) => relation.toId), events: person.events ?? [] })) }

export function useBackendSync(localPeople: Person[], replacePeople: (people: Person[]) => void) {
  const [user, setUser] = useState<AuthUser | null>(null); const [treeId, setTreeId] = useState<string | null>(() => localStorage.getItem(treeKey)); const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const firstSync = useRef(true)
  const applyAuth = async (result: AuthResponse) => { tokenStore.set(result.token); setUser(result.user); setBusy(true); try { const trees = await apiRequest<Array<{ id: string; name: string }>>('/trees'); const tree = trees[0] ?? await apiRequest<{ id: string; name: string }>('/trees', { method: 'POST', body: JSON.stringify({ name: 'Mon arbre familial' }) }); setTreeId(tree.id); localStorage.setItem(treeKey, tree.id); const hasLocal = localPeople.length > 0; if (hasLocal && !localStorage.getItem(migrationKey)) { await apiRequest(`/trees/${tree.id}/import-local`, { method: 'POST', body: JSON.stringify({ people: localPeople }) }); localStorage.setItem(migrationKey, 'true') } else { const remote = await apiRequest<RemoteTree>(`/trees/${tree.id}`); replacePeople(fromRemote(remote)) } setReady(true) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Connexion au serveur impossible.'); tokenStore.clear(); setUser(null) } finally { setBusy(false) } }
  useEffect(() => {
    const token = tokenStore.get()
    if (!token) return
    apiRequest<AuthUser>('/me')
      .then((currentUser) => applyAuth({ user: currentUser, token }))
      .catch(() => { tokenStore.clear(); setUser(null) })
  }, [])
  useEffect(() => { if (!ready || !treeId || firstSync.current) { firstSync.current = false; return } const timer = window.setTimeout(() => { void apiRequest(`/trees/${treeId}/snapshot`, { method: 'PUT', body: JSON.stringify({ people: localPeople }) }).catch(() => undefined) }, 450); return () => window.clearTimeout(timer) }, [localPeople, ready, treeId])
  const login = async (email: string, password: string) => { setError(''); setBusy(true); try { await applyAuth(await authApi.login(email, password)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Connexion impossible.'); setBusy(false) } }
  const register = async (email: string, password: string, displayName: string) => { setError(''); setBusy(true); try { await applyAuth(await authApi.register(email, password, displayName)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Inscription impossible.'); setBusy(false) } }
  const logout = () => { tokenStore.clear(); setUser(null); setReady(false) }
  return { user, busy, error, login, register, logout, isConnected: Boolean(user && ready) }
}
