import {
  Clock3,
  FlaskConical,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteExperiment, getErrorMessage, listExperiments } from '../api/client'

export default function Home() {
  const [experiments, setExperiments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    listExperiments()
      .then((res) => setExperiments(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function onDelete(exp) {
    const confirmed = window.confirm(
      `Delete “${exp.product_name}”? This permanently removes its personas, surveys, interviews, insights, and reports.`
    )
    if (!confirmed) return

    setDeletingId(exp.id)
    setError('')
    try {
      await deleteExperiment(exp.id)
      setExperiments((current) => current.filter((item) => item.id !== exp.id))
      window.dispatchEvent(new Event('sug:experiments-changed'))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] flex-col">
      <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Research runs</h1>
          <p className="text-[11px] text-zinc-600">All synthetic research experiments</p>
        </div>
        <Link
          to="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 hover:bg-white/[0.08]"
        >
          <Plus size={14} /> New run
        </Link>
      </div>

      <section className="flex-1 px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">All experiments</h2>
            <p className="mt-0.5 text-xs text-zinc-600">Continue where your agents left off.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {experiments.length} total
          </div>
        </div>

        {loading && <p className="py-8 text-sm text-zinc-600">Loading research runs...</p>}
        {error && (
          <p className="rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm text-rose-300">{error}</p>
        )}

        {!loading && !error && experiments.length === 0 && (
          <div className="flex min-h-40 items-center justify-center border border-dashed border-white/10 bg-white/[0.015] text-center">
            <div>
              <FlaskConical size={19} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-sm text-zinc-500">No research runs yet</p>
            </div>
          </div>
        )}

        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {experiments.map((exp) => (
            <li key={exp.id} className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#141416] transition hover:border-white/[0.16] hover:bg-[#171719]">
              <Link to={`/experiments/${exp.id}`} className="block min-h-40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                    <Sparkles size={15} />
                  </span>
                  <MoreHorizontal size={16} className="text-zinc-700" />
                </div>
                <h3 className="mt-4 truncate text-sm font-semibold text-zinc-200">{exp.product_name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">{exp.research_objective}</p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600">
                  <span className="flex items-center gap-1.5"><Clock3 size={12} /> Run #{exp.id}</span>
                  <span>{exp.persona_count} personas</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(exp)}
                disabled={deletingId === exp.id}
                aria-label={`Delete ${exp.product_name}`}
                title={`Delete ${exp.product_name}`}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
