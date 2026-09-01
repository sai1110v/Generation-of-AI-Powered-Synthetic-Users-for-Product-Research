import { useEffect, useState } from 'react'
import { getSpeechState, subscribeSpeech } from '../utils/speech'
import PersonaAvatar from './PersonaAvatar'

function curveThrough(points, move = true) {
  let path = move ? `M ${points[0].x} ${points[0].y}` : `L ${points[0].x} ${points[0].y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index]
    const current = points[index]
    const next = points[index + 1]
    const after = points[index + 2] || next
    const firstControl = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    }
    const secondControl = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    }
    path += ` C ${firstControl.x.toFixed(1)} ${firstControl.y.toFixed(1)}, ${secondControl.x.toFixed(1)} ${secondControl.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
  }

  return path
}

function ribbonPath({ amplitude, frequency, phase, drift = 0 }) {
  const width = 720
  const center = 96
  const samples = 18
  const upper = []
  const lower = []

  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples
    const x = progress * width
    const envelope = Math.pow(Math.sin(Math.PI * progress), 1.6)
    const detail = 0.52 + 0.48 * Math.abs(Math.sin((progress * frequency + phase) * Math.PI))
    const offset = Math.sin((progress * 2.15 + phase) * Math.PI) * drift * envelope
    const radius = amplitude * envelope * detail
    upper.push({ x, y: center + offset - radius })
    lower.unshift({ x, y: center + offset + radius * 0.88 })
  }

  return `${curveThrough(upper)} ${curveThrough(lower, false)} Z`
}

function HorizontalVoiceWave({ active, speaking, listening, energy }) {
  const ribbons = [
    { amplitude: 44, frequency: 5.2, phase: 0.1, drift: 5, fill: 'url(#voice-spectrum-core)', className: 'voice-ribbon-core' },
    { amplitude: 34, frequency: 6.8, phase: 0.42, drift: -7, fill: 'url(#voice-spectrum-aqua)', className: 'voice-ribbon-aqua' },
    { amplitude: 39, frequency: 4.4, phase: 0.72, drift: 8, fill: 'url(#voice-spectrum-violet)', className: 'voice-ribbon-violet' },
    { amplitude: 25, frequency: 8.1, phase: 0.26, drift: -4, fill: 'url(#voice-spectrum-light)', className: 'voice-ribbon-light' },
    { amplitude: 52, frequency: 3.7, phase: 0.56, drift: 3, fill: 'url(#voice-spectrum-deep)', className: 'voice-ribbon-deep' },
  ]
  const safeEnergy = Math.min(1, Math.max(0.25, energy || 0.4))

  return (
    <svg
      className={`voice-horizontal-wave pointer-events-none absolute inset-0 h-full w-full ${active ? 'is-active' : ''} ${speaking ? 'is-speaking' : ''} ${listening ? 'is-listening' : ''}`}
      viewBox="0 0 720 192"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="voice-spectrum-core" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
          <stop offset="18%" stopColor="#f472b6" stopOpacity="0.72" />
          <stop offset="44%" stopColor="#818cf8" stopOpacity="0.86" />
          <stop offset="66%" stopColor="#38bdf8" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="voice-spectrum-aqua" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
          <stop offset="30%" stopColor="#c084fc" stopOpacity="0.5" />
          <stop offset="72%" stopColor="#67e8f9" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="voice-spectrum-violet" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
          <stop offset="38%" stopColor="#6366f1" stopOpacity="0.58" />
          <stop offset="62%" stopColor="#0ea5e9" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="voice-spectrum-light" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="voice-spectrum-deep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#7e22ce" stopOpacity="0" />
          <stop offset="40%" stopColor="#4338ca" stopOpacity="0.34" />
          <stop offset="70%" stopColor="#0369a1" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="voice-spectrum-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0" />
          <stop offset="24%" stopColor="#e879f9" stopOpacity="0.55" />
          <stop offset="74%" stopColor="#67e8f9" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="voice-wave-energy" style={{ '--voice-energy': safeEnergy }}>
        {ribbons.map((ribbon) => (
          <path
            key={ribbon.className}
            className={`voice-ribbon ${ribbon.className}`}
            d={ribbonPath(ribbon)}
            fill={ribbon.fill}
          />
        ))}
        <path
          className="voice-spectrum-line"
          d="M 0 96 C 150 94, 260 99, 360 96 S 570 94, 720 96"
          fill="none"
          stroke="url(#voice-spectrum-line)"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  )
}

/** Centered persona voice visualization with a continuous spectrum behind the avatar. */
export default function SpeakingOrb({
  className = '',
  compact = false,
  showOnlyWhenSpeaking = false,
  personaOverride = null,
  listening = false,
}) {
  const [state, setState] = useState(getSpeechState)

  useEffect(() => subscribeSpeech(setState), [])

  const speaking = state.speaking
  const active = speaking || listening
  const persona = personaOverride || state.persona
  const energy = speaking ? state.energy || 0.4 : listening ? 0.64 : 0.12

  if (showOnlyWhenSpeaking && !active) return null

  const size = compact ? 96 : 148
  const stageWidth = compact ? 330 : 'min(100%, 760px)'
  const stageHeight = compact ? 150 : 210

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} aria-live="polite">
      <div
        className="relative flex max-w-full items-center justify-center overflow-hidden"
        style={{ width: stageWidth, height: stageHeight }}
      >
        <HorizontalVoiceWave active={active} speaking={speaking} listening={listening} energy={energy} />

        <div
          className={`absolute rounded-full transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-20'}`}
          style={{
            width: size + 38 + energy * 24,
            height: size + 38 + energy * 24,
            background: 'radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(103,232,249,0.07) 42%, transparent 70%)',
            animation: active ? 'orb-breathe 1.45s ease-in-out infinite' : 'none',
          }}
        />

        {active && (
          <>
            <span className="absolute animate-orb-ring rounded-full border border-cyan-300/20" style={{ width: size + 8, height: size + 8 }} />
            <span className="absolute animate-orb-ring-delayed rounded-full border border-violet-300/16" style={{ width: size + 8, height: size + 8 }} />
          </>
        )}

        <div
          className="relative z-10 flex items-center justify-center overflow-hidden rounded-full border border-zinc-700/70 bg-zinc-950"
          style={{
            width: size,
            height: size,
            transform: `scale(${1 + energy * 0.03})`,
            transition: 'transform 90ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: active
              ? `0 0 ${18 + energy * 34}px rgba(99,102,241,${0.2 + energy * 0.15}), 0 0 ${8 + energy * 12}px rgba(103,232,249,0.18)`
              : '0 12px 32px rgba(0,0,0,0.45)',
          }}
        >
          {persona ? (
            <PersonaAvatar persona={persona} size={size} shape="circle" speaking={false} />
          ) : (
            <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#a5f3fc_0%,#6366f1_48%,#18181b_100%)]" />
          )}

          <div
            className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-150"
            style={{
              opacity: active ? 0.18 : 0.16,
              background: active
                ? 'radial-gradient(circle, transparent 52%, rgba(0,0,0,0.28) 100%)'
                : 'radial-gradient(circle, transparent 42%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        </div>
      </div>

      <div className="min-h-[2.75rem] px-2 text-center">
        {active && persona ? (
          <>
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-cyan-100">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              {listening && !speaking ? 'Listening to you' : `${persona.name} is speaking`}
            </p>
            {speaking && <p className="mt-0.5 max-w-sm line-clamp-2 text-xs text-zinc-500">{state.text}</p>}
          </>
        ) : (
          <p className="text-xs text-zinc-500">
            {persona ? `Ready - ${persona.name}'s voice` : 'Persona voice visualizer'}
          </p>
        )}
      </div>
    </div>
  )
}
