import { useMemo, useState } from 'react'
import { personaSeed } from '../utils/speech'

/**
 * Notion-style face card using free DiceBear "notionists" avatars.
 * Seeded by persona so the same person always gets the same face.
 * https://www.dicebear.com (free, no API key)
 */
export default function PersonaAvatar({
  persona,
  size = 56,
  className = '',
  ring = false,
  speaking = false,
  shape = 'rounded', // 'rounded' | 'circle'
}) {
  const [failed, setFailed] = useState(false)
  const seed = useMemo(() => personaSeed(persona), [persona])
  const name = persona?.name || '?'
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const src = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=e7e5e4,d6d3d1,fee2e2,dbeafe,dcfce7&backgroundType=solid`

  const dim = typeof size === 'number' ? size : parseInt(size, 10) || 56
  const radius = shape === 'circle' ? '9999px' : '0.6rem'

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
      title={name}
    >
      {speaking && (
        <>
          <span
            className="absolute inset-0 animate-ping bg-orange-400/25"
            style={{ borderRadius: radius }}
          />
          <span
            className="absolute -inset-1 bg-orange-500/20 blur-sm animate-pulse"
            style={{ borderRadius: radius }}
          />
        </>
      )}
      <div
        className={`relative h-full w-full overflow-hidden bg-zinc-900 shadow-sm ${
          ring || speaking
            ? 'ring-2 ring-emerald-300/70 ring-offset-2 ring-offset-[#101012]'
            : 'ring-1 ring-white/10'
        }`}
        style={{ borderRadius: radius }}
      >
        {!failed ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-zinc-200 font-semibold text-zinc-900"
            style={{ borderRadius: radius }}
          >
            <span style={{ fontSize: Math.max(12, dim / 2.8) }}>{initials}</span>
          </div>
        )}
      </div>
    </div>
  )
}
