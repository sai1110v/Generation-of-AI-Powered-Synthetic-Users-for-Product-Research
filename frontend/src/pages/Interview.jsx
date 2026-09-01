import { ArrowUp, MessagesSquare, Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getChatHistory, getErrorMessage, getExperiment, sendChat } from '../api/client'
import ExperimentNav from '../components/ExperimentNav'
import PersonaAvatar from '../components/PersonaAvatar'
import SpeakButton from '../components/SpeakButton'
import SpeakingOrb from '../components/SpeakingOrb'
import { useSpeechState } from '../hooks/useSpeechState'
import { isSpeechSupported, speakAsPersona, stopSpeaking, warmUpVoices } from '../utils/speech'

export default function Interview() {
  const { id } = useParams()
  const [personas, setPersonas] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(() => {
    try { return localStorage.getItem('su_auto_speak') !== '0' } catch { return true }
  })
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const speech = useSpeechState()
  const voiceInputSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    warmUpVoices()
    return () => recognitionRef.current?.abort()
  }, [])

  useEffect(() => {
    getExperiment(id)
      .then((res) => {
        const list = res.data.personas || []
        setPersonas(list)
        if (list.length) setSelectedId(list[0].id)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [id])

  useEffect(() => {
    if (!selectedId) return
    stopSpeaking()
    recognitionRef.current?.abort()
    getChatHistory(id, selectedId).then((res) => setHistory(res.data)).catch((err) => setError(getErrorMessage(err)))
  }, [id, selectedId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  useEffect(() => {
    try { localStorage.setItem('su_auto_speak', autoSpeak ? '1' : '0') } catch { /* ignore */ }
  }, [autoSpeak])

  async function onSend(event) {
    event.preventDefault()
    if (!message.trim() || !selectedId) return
    recognitionRef.current?.stop()
    setLoading(true)
    setError('')
    try {
      const { data } = await sendChat(id, selectedId, message.trim())
      setHistory(data.history)
      setMessage('')
      if (autoSpeak && isSpeechSupported() && data.reply) {
        await speakAsPersona(data.reply, personas.find((persona) => persona.id === selectedId))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function toggleVoiceInput() {
    if (!voiceInputSupported || loading || !selectedId) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    const existingMessage = message.trim()

    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setError('')
      setListening(true)
    }

    recognition.onresult = (event) => {
      let transcript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript
      }
      setMessage([existingMessage, transcript.trim()].filter(Boolean).join(' '))
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(
          event.error === 'not-allowed'
            ? 'Microphone access was blocked. Allow microphone access in the browser to use voice input.'
            : `Voice input stopped: ${event.error}`
        )
      }
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const selected = personas.find((persona) => persona.id === selectedId)

  return (
    <div className="min-h-[calc(100vh-8.5rem)]">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><MessagesSquare size={13} /> Interview agent</div>
          <h1 className="mt-1.5 text-lg font-semibold text-zinc-100">Live persona interview</h1>
          <p className="mt-0.5 text-xs text-zinc-600">Persistent context and voice-enabled responses</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
          <span className="hidden sm:inline">Auto voice</span>
          <input type="checkbox" className="peer sr-only" checked={autoSpeak} onChange={(event) => { setAutoSpeak(event.target.checked); if (!event.target.checked) stopSpeaking() }} disabled={!isSpeechSupported()} />
          <span className="relative h-5 w-9 rounded-full bg-zinc-800 transition peer-checked:bg-emerald-400/40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-emerald-200" />
        </label>
      </header>
      <ExperimentNav experimentId={id} />

      {error && <p className="m-4 rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm text-rose-300">{error}</p>}

      <div className="grid min-h-[calc(100vh-16.25rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.07] bg-[#0d0d0f] p-3 lg:border-b-0 lg:border-r">
          <p className="px-2 py-2 text-[11px] font-medium text-zinc-600">Participants</p>
          <div className="space-y-1">
            {personas.map((persona) => {
              const active = persona.id === selectedId
              return (
                <button key={persona.id} type="button" onClick={() => setSelectedId(persona.id)} className={`flex w-full items-center gap-3 rounded-md p-2.5 text-left transition ${active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                  <PersonaAvatar persona={persona} size={38} speaking={speech.speaking && speech.persona?.id === persona.id} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-300">{persona.name}</span><span className="mt-0.5 block truncate text-[11px] text-zinc-600">{persona.occupation}</span></span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </button>
              )
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <section className={`relative flex min-h-[260px] items-center justify-center overflow-hidden border-b transition-colors ${speech.speaking || listening ? 'border-cyan-300/20 bg-cyan-300/[0.02]' : 'border-white/[0.07] bg-[#111113]'}`}>
            <SpeakingOrb personaOverride={selected} listening={listening} className="mx-auto w-full px-4" />
            {speech.speaking && (
              <button type="button" onClick={stopSpeaking} aria-label="Stop speaking" title="Stop speaking" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-black/20 text-zinc-500 hover:text-zinc-200"><Square size={12} /></button>
            )}
          </section>

          <section className="flex min-h-[420px] flex-1 flex-col bg-[#101012]">
            <div className="flex h-12 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex min-w-0 items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><p className="truncate text-xs font-medium text-zinc-400">{selected ? `Interviewing ${selected.name}` : 'Select a participant'}</p></div>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-700"><Volume2 size={12} /> Browser voice</span>
            </div>

            <div className="max-h-[42vh] flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {history.length === 0 && <div className="flex min-h-40 items-center justify-center text-center"><p className="max-w-sm text-sm text-zinc-600">Ask a focused question to begin the interview.</p></div>}
              {history.map((entry) => (
                <div key={entry.id} className={`flex max-w-[88%] gap-2 ${entry.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {entry.role === 'assistant' && selected && <PersonaAvatar persona={selected} size={32} />}
                  <div className={`rounded-lg border px-3 py-2.5 text-sm leading-6 ${entry.role === 'user' ? 'border-white/10 bg-zinc-100 text-zinc-950' : 'border-white/[0.08] bg-[#18181a] text-zinc-400'}`}>
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                    {entry.role === 'assistant' && <SpeakButton text={entry.content} persona={selected} label="Listen" size="xs" className="mt-2" />}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSend} className="m-3 flex items-end gap-2 rounded-lg border border-white/[0.09] bg-[#161618] p-2 focus-within:border-emerald-300/30 sm:m-4">
              <textarea rows={2} className="min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-zinc-300 outline-none" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={listening ? 'Listening...' : 'Ask a follow-up question...'} disabled={!selectedId || loading} />
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={!selectedId || loading || !voiceInputSupported}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                aria-pressed={listening}
                title={voiceInputSupported ? (listening ? 'Stop voice input' : 'Speak your question') : 'Voice input is not supported in this browser'}
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-30 ${
                  listening
                    ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200'
                    : 'border-white/[0.08] bg-white/[0.035] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-200'
                }`}
              >
                {listening && <span className="absolute inset-0 animate-ping rounded-md border border-emerald-300/30" />}
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button type="submit" disabled={!selectedId || loading || !message.trim()} aria-label="Send message" title="Send message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40"><ArrowUp size={15} /></button>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}
