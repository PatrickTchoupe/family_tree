interface Props { size?: number; className?: string }

/** Small inline mark used for the brand and empty state. */
export function TreeIcon({ size = 24, className = '' }: Props) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 29V18M16 22.5 10.5 19M16 25.5 21.5 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 19c-4.8 0-8.7-2.8-8.7-6.3 0-2.6 2.3-4.8 5.7-5.8C13.3 3.6 14.5 2 16 2s2.7 1.6 3 4.9c3.4 1 5.7 3.2 5.7 5.8 0 3.5-3.9 6.3-8.7 6.3Z" fill="currentColor" opacity=".93" />
      <path d="M10 14.3c1.8 1.2 3.8 1.8 6 1.8s4.2-.6 6-1.8" stroke="#0d2132" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
    </svg>
  )
}
