import { useEffect, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import {
  isSpeechSupported,
  speakAsPersona,
  stopSpeaking,
  warmUpVoices,
  getSpeechState,
  subscribeSpeech,
} from '../utils/speech'

export default function SpeakButton({
  text,
  persona = null,
  label = 'Speak',
  className = '',
  size = 'sm',
}) {
  const [speaking, setSpeaking] = useState(false)
  const supported = isSpeechSupported()

  useEffect(() => {
    warmUpVoices()
    return subscribeSpeech((s) => {
      const mine =
        s.speaking &&
        s.text === (text || '').trim() &&
        (!persona ||
          !s.persona ||
          s.persona.id === persona.id ||
          s.persona.name === persona.name)
      setSpeaking(Boolean(mine || (s.speaking && getSpeechState().text === text?.trim())))
      if (!s.speaking) setSpeaking(false)
    })
  }, [text, persona])

  if (!supported) {
    return (
      <span className="text-xs text-zinc-500" title="Speech not supported in this browser">
        TTS n/a
      </span>
    )
  }

  async function toggle(e) {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    await speakAsPersona(text, persona)
    setSpeaking(false)
  }

  const sizeClass = size === 'xs' ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition ${sizeClass} ${
        speaking
          ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200'
          : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300'
      } ${className}`}
      title={speaking ? 'Stop speaking' : 'Speak aloud (free browser voice)'}
    >
      {speaking ? <Square size={11} fill="currentColor" /> : <Volume2 size={13} />}
      <span>{speaking ? 'Stop' : label}</span>
    </button>
  )
}
