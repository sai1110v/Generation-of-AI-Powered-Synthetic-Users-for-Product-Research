import { ArrowUp, ListChecks, Play, Square } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getErrorMessage, listSurveys, runSurvey } from '../api/client'
import ExperimentNav from '../components/ExperimentNav'
import PersonaAvatar from '../components/PersonaAvatar'
import SpeakButton from '../components/SpeakButton'
import SpeakingOrb from '../components/SpeakingOrb'
import { useSpeechState } from '../hooks/useSpeechState'
import { isSpeechSupported, speakAsPersona, stopSpeaking, warmUpVoices } from '../utils/speech'

const sentimentColor = {
  positive: 'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300',
  neutral: 'border-white/[0.07] bg-white/[0.035] text-zinc-500',
  negative: 'border-rose-400/15 bg-rose-400/[0.06] text-rose-300',
}

export default function Survey() {
  const { id } = useParams()
  const [question, setQuestion] = useState('')
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(false)
  const [playingAll, setPlayingAll] = useState(false)
  const [error, setError] = useState('')
  const speech = useSpeechState()

  const load = useCallback(async () => {
    try {
      const { data } = await listSurveys(id)
      setSurveys(data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [id])

  useEffect(() => {
    warmUpVoices()
    load()
    return () => stopSpeaking()
  }, [load])

  async function onSubmit(event) {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    try {
      await runSurvey(id, question.trim())
      setQuestion('')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function playAllAnswers(survey) {
    if (!isSpeechSupported() || playingAll) return
    setPlayingAll(true)
    try {
      for (const response of survey.responses || []) {
        const persona = { id: response.persona_id, name: response.persona_name }
        await speakAsPersona(`${response.persona_name} says: ${response.answer}`, persona)
      }
    } finally {
      setPlayingAll(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8.5rem)]">
      <header className="flex min-h-20 items-center justify-between border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><ListChecks size={13} /> Survey agent</div>
          <h1 className="mt-1.5 text-lg font-semibold text-zinc-100">Cohort survey</h1>
          <p className="mt-0.5 text-xs text-zinc-600">Ask every persona the same research question</p>
        </div>
        <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-500">{surveys.length} runs</span>
      </header>
      <ExperimentNav experimentId={id} />

      <div className="grid min-h-[calc(100vh-16.25rem)] xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.07] bg-[#0d0d0f] p-4 sm:p-5 xl:border-b-0 xl:border-r">
          <form onSubmit={onSubmit}>
            <label className="workspace-label">Research question</label>
            <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.09] bg-[#141416] focus-within:border-emerald-300/30">
              <textarea rows={6} required className="block w-full resize-none border-0 bg-transparent p-3 text-sm leading-6 text-zinc-300 outline-none" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What would make you choose this product over your current alternative?" />
              <div className="flex items-center justify-between border-t border-white/[0.07] p-2">
                <span className="px-1 text-[11px] text-zinc-700">All personas</span>
                <button type="submit" disabled={loading || !question.trim()} aria-label="Ask all personas" title="Ask all personas" className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40">
                  <ArrowUp size={15} />
                </button>
              </div>
            </div>
          </form>

          {error && <p className="mt-3 rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-xs text-rose-300">{error}</p>}
          {loading && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Collecting cohort responses</p>}

          {speech.speaking && (
            <div className="mt-5 overflow-hidden border-t border-white/[0.07] pt-4">
              <SpeakingOrb compact showOnlyWhenSpeaking={false} />
            </div>
          )}
        </aside>

        <main className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-300">Responses</h2>
              <p className="mt-0.5 text-xs text-zinc-600">Latest evidence appears first</p>
            </div>
          </div>

          {surveys.length === 0 && (
            <div className="flex min-h-[390px] items-center justify-center text-center">
              <div><ListChecks size={20} className="mx-auto text-zinc-700" /><p className="mt-3 text-sm text-zinc-500">No survey evidence yet</p></div>
            </div>
          )}

          <div className="space-y-3">
            {[...surveys].reverse().map((survey) => (
              <section key={survey.question_id} className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#141416]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                  <div className="min-w-0"><p className="text-[10px] font-medium text-zinc-700">QUESTION {survey.question_id}</p><h3 className="mt-1 text-sm font-medium text-zinc-300">{survey.question}</h3></div>
                  <div className="flex gap-1">
                    <button type="button" disabled={!isSpeechSupported() || playingAll} onClick={() => playAllAnswers(survey)} aria-label="Play all answers" title="Play all answers" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"><Play size={13} /></button>
                    <button type="button" onClick={() => { stopSpeaking(); setPlayingAll(false) }} aria-label="Stop playback" title="Stop playback" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/[0.06] hover:text-zinc-300"><Square size={12} /></button>
                  </div>
                </div>
                <ul className="divide-y divide-white/[0.07]">
                  {survey.responses.map((response) => {
                    const persona = { id: response.persona_id, name: response.persona_name }
                    const active = speech.speaking && speech.persona && (speech.persona.id === response.persona_id || speech.persona.name === response.persona_name)
                    return (
                      <li key={`${survey.question_id}-${response.persona_id}`} className={`p-4 transition-colors ${active ? 'bg-emerald-400/[0.04]' : ''}`}>
                        <div className="flex gap-3">
                          <PersonaAvatar persona={persona} size={40} speaking={active} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-zinc-300">{response.persona_name}</span>
                              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${sentimentColor[response.sentiment] || sentimentColor.neutral}`}>{response.sentiment}</span>
                              <SpeakButton text={response.answer} persona={persona} label="Listen" size="xs" className="ml-auto" />
                            </div>
                            <p className="text-sm leading-6 text-zinc-500">{response.answer}</p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
