import PersonaAvatar from './PersonaAvatar'
import { useSpeechState } from '../hooks/useSpeechState'

export default function PersonaCard({ persona, selected, onClick }) {
  const traits = persona.traits || []
  const speech = useSpeechState()
  const isSpeaking =
    speech.speaking &&
    speech.persona &&
    (speech.persona.id === persona.id || speech.persona.name === persona.name)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full rounded-lg border p-4 transition-colors hover:border-white/[0.16] hover:bg-white/[0.035] ${
        selected
          ? 'border-emerald-400/35 bg-emerald-400/[0.06] ring-1 ring-emerald-400/10'
          : 'border-white/[0.08] bg-[#141416]'
      } ${isSpeaking ? 'border-emerald-400/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        <PersonaAvatar
          persona={persona}
          size={60}
          speaking={isSpeaking}
          ring={selected}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-zinc-50">
                {persona.name}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {persona.age}
                {persona.gender ? ` · ${persona.gender}` : ''} · {persona.occupation}
              </p>
              {persona.location ? (
                <p className="mt-0.5 truncate text-xs text-zinc-500">{persona.location}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-[10px] text-zinc-700">
              #{persona.id}
            </span>
          </div>
          {isSpeaking && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Speaking
            </p>
          )}
        </div>
      </div>

      {traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {traits.map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/[0.07] bg-white/[0.035] px-2 py-0.5 text-[11px] text-zinc-500"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {persona.goals?.length > 0 && (
        <div className="mt-3 border-t border-white/[0.07] pt-3">
          <p className="text-[10px] font-medium text-zinc-600">
            Goals
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{persona.goals.join(' · ')}</p>
        </div>
      )}

      {persona.pain_points?.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-medium text-zinc-600">
            Pain points
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{persona.pain_points.join(' · ')}</p>
        </div>
      )}

      {persona.psychological_profile ? (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-zinc-500">
          {persona.psychological_profile}
        </p>
      ) : null}
    </button>
  )
}
