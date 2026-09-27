import { useEffect, useMemo, useState } from 'react'
import { FamilyTree } from './components/FamilyTree'
import { PersonEditor } from './components/PersonEditor'
import { useFamily } from './hooks/useFamily'
import { TreeIcon } from './components/TreeIcon'
import { PersonDetail } from './components/PersonDetail'
import { exportJson, exportPdf, exportPng } from './utils/export'
import { exportGedcom, parseGedcom } from './utils/gedcom'
import { normalizeImportedPeople } from './hooks/useFamily'
import { useBackendSync } from './hooks/useBackendSync'
import { AuthPanel } from './components/AuthPanel'

export default function App() {
  const { people, storageError, addPerson, updatePerson, deletePerson, replacePeople } = useFamily()
  const backend = useBackendSync(people, replacePeople)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('arbre-familial:theme') as 'dark' | 'light' | null) ?? 'dark')
  const [showAuth, setShowAuth] = useState(false)
  const selected = people.find((person) => person.id === editingId)
  const detailPerson = people.find((person) => person.id === detailId)
  const searchResults = useMemo(() => people.filter((person) => `${person.firstName} ${person.lastName}`.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase())), [people, searchQuery])
  const close = () => { setEditingId(null); setAdding(false) }
  useEffect(() => { localStorage.setItem('arbre-familial:theme', theme) }, [theme])
  const downloadGedcom = () => { const blob = new Blob([exportGedcom(people)], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'arbre-familial.ged'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
  const importData = async (file: File) => { const text = await file.text(); try { const imported = file.name.toLowerCase().endsWith('.ged') || file.name.toLowerCase().endsWith('.gedcom') ? parseGedcom(text) : normalizeImportedPeople((JSON.parse(text).people ?? JSON.parse(text)) as typeof people); if (!imported.length) throw new Error('empty'); replacePeople(imported); setDetailId(null); setEditingId(null) } catch { window.alert('Ce fichier ne contient pas un arbre reconnu. Utilisez un fichier GEDCOM ou JSON exporté par l’application.') } }

  return (
    <div className={`app-shell ${theme === 'light' ? 'light' : ''}`}>
      <header className="site-header">
        <div className="brand"><span className="brand-mark"><TreeIcon size={25} /></span><span>Arbre<span className="brand-soft"> familial</span></span></div>
        <span className="header-note">VOTRE HISTOIRE, À VOTRE RYTHME</span>
        <div className="header-tools"><label className="file-button" title="Importer un fichier GEDCOM ou JSON">Importer<input type="file" accept=".ged,.gedcom,.json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); event.currentTarget.value = '' }} /></label>{backend.user ? <button type="button" className="account-button" onClick={backend.logout}>{backend.user.displayName || backend.user.email} · Quitter</button> : <button type="button" className="account-button" onClick={() => setShowAuth(true)}>Se connecter</button>}<button type="button" className="theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}>{theme === 'dark' ? '☼' : '☾'}</button></div>
        <button type="button" className="primary-button header-add" onClick={() => { setEditingId(null); setAdding(true) }}>+ <span>Ajouter une personne</span></button>
      </header>
      <main className="main-content">
        <div className="workspace-heading">
          <div><span className="eyebrow">VOTRE ESPACE</span><h1>L’arbre familial</h1><p>Les liens qui racontent votre histoire.</p></div>
          <div className="counter"><strong>{people.length}</strong><span>{people.length > 1 ? 'personnes' : 'personne'} dans l’arbre</span></div>
        </div>
        {storageError && <p className="storage-warning" role="alert">Le stockage de ce navigateur est indisponible. Vos modifications risquent de ne pas être conservées.</p>}
        <section className="workspace" aria-label="Visualisation de l’arbre familial">
          <div className="workspace-toolbar"><div><span className="toolbar-icon" aria-hidden="true">⌘</span><strong>Vue d’ensemble</strong><span className="toolbar-separator">/</span><span>{people.length ? 'Cliquez sur une carte pour voir sa fiche' : 'Commencez avec une personne'}</span></div><div className="toolbar-actions"><label className="search-box"><span aria-hidden="true">⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher une personne" aria-label="Rechercher une personne" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Effacer la recherche">×</button>}</label><span className="search-count">{searchQuery ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}` : ''}</span><span className="local-badge">Enregistré sur cet appareil</span></div></div>
          <FamilyTree people={people} searchQuery={searchQuery} selectedId={detailId ?? editingId ?? undefined} onSelect={(id) => { setAdding(false); setEditingId(null); setDetailId(id) }} onAdd={() => setAdding(true)} />
        </section>
        <div className="export-bar"><span>Transférer ou sauvegarder votre arbre</span><div><button type="button" className="secondary-button" onClick={() => exportJson(people)}>JSON</button><button type="button" className="secondary-button" onClick={downloadGedcom}>GEDCOM</button><button type="button" className="secondary-button" onClick={() => void exportPng(people)}>PNG</button><button type="button" className="secondary-button" onClick={() => exportPdf(people)}>PDF / imprimer</button></div></div>
        <p className="privacy-note">Vos données restent dans ce navigateur. Effacer les données du navigateur effacera aussi cet arbre.</p>
      </main>
      {detailPerson && <PersonDetail person={detailPerson} people={people} onClose={() => setDetailId(null)} onEdit={() => { setEditingId(detailPerson.id); setDetailId(null) }} />}
      {(adding || selected) && <PersonEditor key={adding ? 'new' : selected?.id} person={selected} people={people} onClose={close} onSave={(input) => { if (selected) updatePerson(selected.id, input); else addPerson(input); close() }} onDelete={selected ? () => { deletePerson(selected.id); close() } : undefined} />}
      {showAuth && <AuthPanel busy={backend.busy} error={backend.error} onClose={() => setShowAuth(false)} onLogin={(email, password) => { void backend.login(email, password).then(() => setShowAuth(false)) }} onRegister={(email, password, name) => { void backend.register(email, password, name).then(() => setShowAuth(false)) }} />}
    </div>
  )
}
