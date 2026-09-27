import { useMemo, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { Person } from '../types/family'
import { getRelations, fullName } from '../utils/family'
import { CARD_HEIGHT, CARD_WIDTH, createTreeLayout } from '../utils/layout'
import { PersonCard } from './PersonCard'
import { TreeIcon } from './TreeIcon'

interface Props { people: Person[]; selectedId?: string; searchQuery?: string; onSelect: (id: string) => void; onAdd: () => void }

export function FamilyTree({ people, selectedId, searchQuery = '', onSelect, onAdd }: Props) {
  const layout = useMemo(() => createTreeLayout(people), [people])
  const relations = useMemo(() => getRelations(people), [people])
  const positioned = new Map(layout.nodes.map((node) => [node.person.id, node]))
  const matches = useMemo(() => people.filter((person) => fullName(person).toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase())), [people, searchQuery])
  const matchIds = new Set(matches.map((person) => person.id))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { if (event.button === 0) { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y } } }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => { if (drag.current) setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y }) }
  const onPointerUp = () => { drag.current = null }
  const onWheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); setZoom((current) => Math.min(1.65, Math.max(.55, current * (event.deltaY > 0 ? .92 : 1.08)))) }
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  if (!people.length) return <div className="empty-state"><div className="empty-symbol"><TreeIcon size={48} /></div><h2>Une histoire à construire</h2><p>Ajoutez une première personne pour commencer votre arbre familial.</p><button type="button" className="primary-button" onClick={onAdd}>Ajouter une personne <span aria-hidden="true">↗</span></button></div>

  return <div className="tree-stage">
    <div className="tree-controls" aria-label="Contrôles de la vue"><button type="button" onClick={() => setZoom((value) => Math.min(1.65, value + .1))} aria-label="Zoomer">+</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.max(.55, value - .1))} aria-label="Dézoomer">−</button><button type="button" onClick={resetView}>Réinitialiser</button></div>
    <div className="tree-scroll" tabIndex={0} aria-label="Arbre généalogique, glissez pour déplacer la vue" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
      <div className="tree-viewport" style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg className="tree-lines" width={layout.width} height={layout.height} aria-hidden="true">{relations.map((relation) => { const from = positioned.get(relation.fromId); const to = positioned.get(relation.toId); if (!from || !to) return null; if (relation.type === 'spouse') { const left = from.x < to.x ? from : to; const right = from.x < to.x ? to : from; return <path key={`spouse-${relation.fromId}-${relation.toId}`} className="spouse-line" d={`M ${left.x + CARD_WIDTH} ${left.y + CARD_HEIGHT / 2} L ${right.x} ${right.y + CARD_HEIGHT / 2}`} /> } const x1 = from.x + CARD_WIDTH / 2; const y1 = from.y + CARD_HEIGHT; const x2 = to.x + CARD_WIDTH / 2; const y2 = to.y; const mid = y1 + (y2 - y1) / 2; return <path key={`${relation.type}-${relation.fromId}-${relation.toId}`} className="parent-line" d={`M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`} /> })}</svg>
        {layout.nodes.map(({ person, x, y }) => <div key={person.id} className={`tree-node ${searchQuery && !matchIds.has(person.id) ? 'dimmed' : ''}`} style={{ left: x, top: y }}><PersonCard person={person} selected={selectedId === person.id || matchIds.has(person.id)} onClick={() => onSelect(person.id)} /></div>)}
        {Array.from({ length: layout.generations }, (_, index) => <span key={index} className="generation-label" style={{ top: 32 + index * 212 }}>GÉNÉRATION {String(index + 1).padStart(2, '0')}</span>)}
      </div>
    </div>
    <p className="tree-hint">Faites glisser pour déplacer l’arbre · molette ou boutons pour zoomer</p>
  </div>
}
