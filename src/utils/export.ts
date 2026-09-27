import type { Person } from '../types/family'
import { formatYears, fullName, getRelations } from './family'
import { CARD_HEIGHT, CARD_WIDTH, createTreeLayout } from './layout'

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportJson(people: Person[]): void {
  download(new Blob([JSON.stringify({ version: 2, people }, null, 2)], { type: 'application/json' }), 'arbre-familial.json')
}

function treeSvg(people: Person[]): string {
  const layout = createTreeLayout(people); const positioned = new Map(layout.nodes.map((node) => [node.person.id, node]))
  const lines = getRelations(people).map((relation) => { const from = positioned.get(relation.fromId); const to = positioned.get(relation.toId); if (!from || !to) return ''; if (relation.type === 'spouse') return `<path d="M${from.x + CARD_WIDTH} ${from.y + CARD_HEIGHT / 2}H${to.x}" stroke="#58cdbb" stroke-width="2" stroke-dasharray="6 5" fill="none"/>`; const x1 = from.x + CARD_WIDTH / 2; const y1 = from.y + CARD_HEIGHT; const x2 = to.x + CARD_WIDTH / 2; const y2 = to.y; const mid = y1 + (y2 - y1) / 2; return `<path d="M${x1} ${y1}V${mid}H${x2}V${y2}" stroke="#6e879c" stroke-width="2" fill="none"/>` }).join('')
  const cards = layout.nodes.map(({ person, x, y }) => `<g><rect x="${x}" y="${y}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="#1a2a40" stroke="#527087"/><circle cx="${x + 28}" cy="${y + 28}" r="18" fill="#416176"/><text x="${x + 28}" y="${y + 33}" fill="#e7f7f5" font-family="Arial" font-size="12" text-anchor="middle">${escapeXml(`${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase())}</text><text x="${x + 56}" y="${y + 31}" fill="#eef5fd" font-family="Arial" font-weight="700" font-size="14">${escapeXml(fullName(person))}</text><text x="${x + 16}" y="${y + 78}" fill="#a7bbcc" font-family="Arial" font-size="12">${escapeXml(formatYears(person))}</text></g>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}"><rect width="100%" height="100%" fill="#111b2e"/>${lines}${cards}</svg>`
}

function escapeXml(value: string): string { return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!) }

export async function exportPng(people: Person[]): Promise<void> {
  const svg = treeSvg(people); const image = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = image.width * 2; canvas.height = image.height * 2; const context = canvas.getContext('2d'); if (!context) return; context.scale(2, 2); context.drawImage(image, 0, 0); canvas.toBlob((blob) => { if (blob) download(blob, 'arbre-familial.png'); URL.revokeObjectURL(url) }, 'image/png') }
  image.src = url
}

export function exportPdf(people: Person[]): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer'); if (!printWindow) return
  printWindow.document.write(`<html><head><title>Arbre familial</title><style>@page{size:landscape;margin:12mm}body{margin:0;background:#111b2e;display:grid;place-items:center;min-height:100vh}svg{max-width:100%;height:auto}</style></head><body>${treeSvg(people)}</body></html>`)
  printWindow.document.close(); printWindow.focus(); printWindow.print()
}
