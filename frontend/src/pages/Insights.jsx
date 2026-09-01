import { Download, Gauge, LoaderCircle, MessageCircle, Sparkles, Split, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { generateInsights, getErrorMessage, getInsights, reportPdfUrl } from '../api/client'
import ExperimentNav from '../components/ExperimentNav'

export default function Insights() {
  const { id } = useParams()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await getInsights(id)
      setInsights(data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function onGenerate() {
    setLoading(true)
    setError('')
    try {
      const { data } = await generateInsights(id)
      setInsights(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8.5rem)]">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><Sparkles size={13} /> Synthesis agent</div>
          <h1 className="mt-1.5 text-lg font-semibold text-zinc-100">Research synthesis</h1>
          <p className="mt-0.5 text-xs text-zinc-600">Evidence, themes, tensions, and validation signal</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={reportPdfUrl(id)} target="_blank" rel="noreferrer" className="secondary-action"><Download size={14} /><span className="hidden sm:inline">PDF</span></a>
          <button type="button" onClick={onGenerate} disabled={loading} className="primary-action">
            {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Analyzing' : insights ? 'Run again' : 'Generate'}
          </button>
        </div>
      </header>

      <ExperimentNav experimentId={id} />

      <main className="p-4 sm:p-6">
        {error && <p className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm text-rose-300">{error}</p>}

        {!insights && !loading && (
          <div className="flex min-h-[430px] items-center justify-center text-center">
            <div className="max-w-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-zinc-500"><Sparkles size={19} /></span>
              <h2 className="mt-4 text-sm font-semibold text-zinc-300">Ready to synthesize</h2>
              <p className="mt-2 text-xs leading-5 text-zinc-600">Run a survey or interview, then ask the synthesis agent to extract the strongest evidence.</p>
            </div>
          </div>
        )}

        {insights && (
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="flex min-h-40 items-center justify-between rounded-lg border border-white/[0.08] bg-[#141416] p-5 lg:col-span-2">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-500"><Gauge size={14} /> Validation signal</div>
                <p className="mt-3 text-4xl font-semibold text-zinc-100">{Number(insights.product_validation_score).toFixed(1)}<span className="ml-1 text-base font-normal text-zinc-600">/ 100</span></p>
              </div>
              <div className="hidden h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] text-sm font-medium text-emerald-300 sm:flex">Signal</div>
            </section>

            <section className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 lg:col-span-2">
              <h2 className="text-xs font-medium text-zinc-500">Emerging themes</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(insights.themes || []).map((theme) => <span key={theme} className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-xs text-zinc-400">{theme}</span>)}
              </div>
            </section>

            {[
              [MessageCircle, 'Sentiment', insights.sentiment_summary],
              [Split, 'Agreement and tension', insights.agreement_disagreement],
              [TrendingUp, 'Behaviour trends', insights.behaviour_trends],
            ].map(([Icon, title, copy], index) => (
              <section key={title} className={`rounded-lg border border-white/[0.08] bg-[#141416] p-5 ${index === 2 ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Icon size={14} className="text-zinc-600" />{title}</div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{copy}</p>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
