import { RefreshCw, Sparkles, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { generatePersonas, getErrorMessage, getExperiment } from '../api/client'
import ExperimentNav from '../components/ExperimentNav'
import PersonaCard from '../components/PersonaCard'

export default function Personas() {
  const { id } = useParams()
  const [experiment, setExperiment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getExperiment(id)
      setExperiment(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function onRegenerate() {
    setGenerating(true)
    setError('')
    try {
      await generatePersonas(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <p className="p-6 text-sm text-zinc-600">Loading research run...</p>
  if (!experiment) return <p className="p-6 text-sm text-rose-300">{error || 'Experiment not found'}</p>

  const personas = experiment.personas || []

  return (
    <div className="min-h-[calc(100vh-8.5rem)]">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-400/[0.08] text-emerald-300"><Sparkles size={13} /></span>
            <p className="text-[11px] font-medium text-emerald-300">Persona agent</p>
          </div>
          <h1 className="mt-1.5 truncate text-lg font-semibold text-zinc-100">{experiment.product_name}</h1>
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-600">{experiment.research_objective}</p>
        </div>
        <span className="hidden rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-500 sm:block">
          {experiment.target_audience}
        </span>
      </header>

      <ExperimentNav experimentId={id} />

      <main className="p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Generated cohort</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-600">{personas.length} persistent participants in this run</p>
          </div>
          <button type="button" onClick={onRegenerate} disabled={generating} className="secondary-action">
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating' : 'Regenerate'}
          </button>
        </div>

        {error && <p className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm text-rose-300">{error}</p>}

        {personas.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center border border-dashed border-white/10 bg-white/[0.015] text-center">
            <div>
              <Users size={20} className="mx-auto text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">No personas generated</p>
              <button type="button" onClick={onRegenerate} disabled={generating} className="primary-action mt-4">
                <Sparkles size={14} /> Generate cohort
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {personas.map((persona) => <PersonaCard key={persona.id} persona={persona} />)}
          </div>
        )}
      </main>
    </div>
  )
}
