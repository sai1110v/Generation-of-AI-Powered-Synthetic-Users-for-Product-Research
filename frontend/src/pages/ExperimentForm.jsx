import { ArrowUp, FlaskConical, LoaderCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createExperiment, generatePersonas, getErrorMessage } from '../api/client'
import researchLens from '../assets/research-lens.webp'

const baseInitial = {
  product_name: '',
  product_description: '',
  target_audience: '',
  research_objective: '',
  persona_count: 5,
}

export default function ExperimentForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(() => ({ ...baseInitial, ...(location.state || {}) }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      setStatus('Creating research workspace')
      const { data: experiment } = await createExperiment({
        ...form,
        persona_count: Number(form.persona_count) || 5,
      })

      setStatus('Persona agent is building the cohort')
      await generatePersonas(experiment.id)

      navigate(`/experiments/${experiment.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate flex min-h-[calc(100vh-8.5rem)] items-center justify-center overflow-hidden bg-[#0b0c0f] px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
      <img
        src={researchLens}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-[0.46] [filter:saturate(0.82)_contrast(1.06)]"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-black/35"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl">

        {/* Header */}

        <div className="mb-14 text-center">

          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.25)] backdrop-blur-md">
            <FlaskConical
              size={24}
              strokeWidth={1.6}
              className="text-red-400"
            />
          </div>

          <h1 className="bg-gradient-to-r from-red-600 via-red-500 to-rose-400 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl">
            Synthetic User Research Platform
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-zinc-300">
            Generate realistic AI personas, simulate interviews,
            run surveys, and extract actionable product insights.
          </p>

        </div>

        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-xl border border-white/[0.12] bg-[#151517]/[0.96] shadow-[0_22px_70px_rgba(0,0,0,0.48)] backdrop-blur-md"
        >

          <div className="grid gap-7 p-8 sm:grid-cols-2">

            <label className="block">
              <span className="workspace-label">Product name</span>

              <input
                required
                autoFocus
                className="workspace-input mt-2"
                value={form.product_name}
                onChange={(event) =>
                  update('product_name', event.target.value)
                }
                placeholder=""
              />
            </label>

            <label className="block">
              <span className="workspace-label">
                Target audience
              </span>

              <input
                required
                className="workspace-input mt-2"
                value={form.target_audience}
                onChange={(event) =>
                  update('target_audience', event.target.value)
                }
                placeholder=""
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="workspace-label">
                Product details
              </span>

              <textarea
                required
                rows={4}
                className="workspace-input mt-2 resize-none"
                value={form.product_description}
                onChange={(event) =>
                  update('product_description', event.target.value)
                }
                placeholder="Describe the product, its current stage, and the problem it solves."
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="workspace-label">
                Research objective
              </span>

              <textarea
                required
                rows={3}
                className="workspace-input mt-2 resize-none"
                value={form.research_objective}
                onChange={(event) =>
                  update('research_objective', event.target.value)
                }
                placeholder="What decision should this research help you make?"
              />
            </label>

          </div>

          {error && (
            <p className="mx-5 mb-4 rounded-md border border-rose-500/20 bg-rose-500/[0.07] p-3 text-base font-semibold text-rose-300 sm:mx-6">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-[#121214] p-3 pl-5 sm:pl-6">

            <label className="flex items-center gap-3">

              <span className="flex items-center gap-2 text-base font-semibold text-zinc-200">
                <Users size={16} />
                Personas
              </span>

              <input
                type="number"
                min={1}
                max={15}
                aria-label="Persona count"
                className="h-11 w-20 rounded-md border border-white/[0.09] bg-[#0d0d0f] px-2 text-center text-base font-semibold text-zinc-300 outline-none focus:border-emerald-300/30"
                value={form.persona_count}
                onChange={(event) =>
                  update('persona_count', event.target.value)
                }
              />

            </label>

            <div className="flex min-w-0 items-center gap-3">

              {status && !error && (
                <span className="hidden items-center gap-2 text-base font-semibold text-emerald-300 sm:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {status}
                </span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-500 px-6 text-sm font-bold text-white shadow-lg shadow-white-500/20 transition-all duration-300 hover:scale-105 hover:shadow-white-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ArrowUp size={18} />
                    Generate Personas
                  </>
                )}
              </button>

            </div>

          </div>

        </form>

      </div>
    </div>
  )
}