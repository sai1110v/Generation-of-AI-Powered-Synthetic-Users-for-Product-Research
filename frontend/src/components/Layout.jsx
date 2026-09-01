import {
  Activity,
  BarChart3,
  Bot,
  FlaskConical,
  History,
  ListChecks,
  MessagesSquare,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { listExperiments } from '../api/client'
import BrandLogo from './BrandLogo'

const mainLinks = [
  { to: '/', end: true, label: 'Agent brief', icon: Sparkles },
  { to: '/runs', label: 'Recent runs', icon: History },
]

const workflowLinks = [
  { path: '', end: true, label: 'Persona agent', icon: Users },
  { path: 'survey', label: 'Survey run', icon: ListChecks },
  { path: 'interview', label: 'Interview', icon: MessagesSquare },
  { path: 'insights', label: 'Synthesis', icon: Sparkles },
  { path: 'dashboard', label: 'Report', icon: BarChart3 },
]

const navClass = ({ isActive }) =>
  `flex h-14 items-center gap-4 rounded-xl px-5 text-[21px] font-bold transition-all ${isActive
    ? 'bg-white/[0.20] text-white'
    : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
  }`
function AgentStatus({ health, compact = false }) {
  const ready = health?.llm_ready

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'}`}>
      <span
        className={`relative flex h-2 w-2 ${ready ? 'text-emerald-400' : 'text-amber-400'}`}
      >
        {ready && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-300">
            {health ? (ready ? 'Agent online' : 'Agent unavailable') : 'Connecting agent'}
          </p>
          <p className="truncate text-xs text-zinc-600">
            {health?.llm_provider || 'Checking runtime'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Layout({ health }) {
  const location = useLocation()
  const [experiments, setExperiments] = useState([])
  const experimentMatch = location.pathname.match(/^\/experiments\/(\d+)/)
  const experimentId = experimentMatch?.[1]

  useEffect(() => {
    let active = true
    const loadExperiments = () => {
      listExperiments()
        .then((response) => {
          if (active) setExperiments(response.data)
        })
        .catch(() => {
          if (active) setExperiments([])
        })
    }
    loadExperiments()
    window.addEventListener('sug:experiments-changed', loadExperiments)
    return () => {
      active = false
      window.removeEventListener('sug:experiments-changed', loadExperiments)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#09090a] text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[380px] flex-col border-r border-white/[0.07] bg-[#0d0d0f] lg:flex">
        <div className="flex h-24 flex-col justify-center border-b border-white/[0.07] px-6">
          <Link to="/" className="brand-link brand-link--sidebar relative z-10 flex w-fit items-center">
            <BrandLogo />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3.5 px-2.5 text-[20px] font-extrabold uppercase tracking-widest text-zinc-200">Workspace</p>
          <nav className="space-y-0.5">
            {mainLinks.map(({ icon: Icon, ...item }) => (
              <NavLink key={item.to} {...item} className={navClass}>
                <Icon size={18} strokeWidth={2.2} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-7">
            <div className="mb-3.5 flex items-center justify-between px-2.5">
              <p className="text-[20px] font-extrabold uppercase tracking-widest text-zinc-200">Experiments</p>
              <span className="text-sm text-zinc-500">{experiments.length}</span>
            </div>
            {experiments.length > 0 ? (
              <nav className="space-y-0.5">
                {experiments.map((experiment) => (
                  <NavLink
                    key={experiment.id}
                    to={`/experiments/${experiment.id}`}
                    className={({ isActive }) =>
                      `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-[19px] font-semibold transition-colors ${isActive
                        ? 'bg-white/[0.09] text-white'
                        : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
                      }`
                    }
                  >
                    <FlaskConical size={18} strokeWidth={2.0} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{experiment.product_name}</span>
                    <span className="text-xs text-zinc-500">#{experiment.id}</span>
                  </NavLink>
                ))}
              </nav>
            ) : (
              <p className="px-5 py-2 text-xs text-zinc-500">No experiments yet</p>
            )}
          </div>

          {experimentId && (
            <div className="mt-7">
              <div className="mb-3.5 flex items-center justify-between px-2.5">
                <p className="text-[18px] font-extrabold uppercase tracking-widest text-zinc-200">Active run</p>
                <Activity size={18} className="text-emerald-400" />
              </div>
              <nav className="space-y-0.5">
                {workflowLinks.map(({ icon: Icon, path, ...item }) => {
                  const to = path
                    ? `/experiments/${experimentId}/${path}`
                    : `/experiments/${experimentId}`
                  return (
                    <NavLink key={item.label} to={to} end={item.end} className={navClass}>
                      <Icon size={18} strokeWidth={2.2} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )}

          <div className="mt-7">
            <p className="mb-3.5 px-2.5 text-[20px] font-extrabold uppercase tracking-widest text-zinc-200">Agents</p>
            <div className="space-y-1.5 px-2.5">
              <div className="flex items-center justify-between px-4 py-2.5 text-[19px] font-semibold text-zinc-300">
                <span className="flex items-center gap-3"><Bot size={20} /> Research</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-[19px] font-semibold text-zinc-300">
                <span className="flex items-center gap-3"><FlaskConical size={20} /> Synthesis</span>
                <span className="h-2 w-2 rounded-full bg-zinc-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] p-4 px-5">
          <AgentStatus health={health} />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[380px]">
        <header className="sticky top-0 z-20 flex h-24 items-center justify-between border-b border-white/[0.07] bg-[#0d0d0f]/95 px-6 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center pl-2 gap-3">
            <Link to="/" className="brand-link brand-link--mobile lg:hidden">
              <BrandLogo className="scale-90" />
            </Link>

            <div className="flex min-w-0 items-center gap-5 text-lg font-semibold">
              <span className="hidden text-base font-semibold text-zinc-500 sm:inline"></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-md border border-white/[0.07] bg-white/[0.03] px-3.5 py-1.5 lg:hidden">
              <AgentStatus health={health} compact />
            </div>
            <Link
              to="/"
              className="inline-flex h-20 items-center gap-2 rounded-xl bg-zinc-50 px-5 text-base font-bold text-zinc-950 transition hover:bg-white"
            >
              <Plus size={30} />
              <span className="hidden sm:inline">New run</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5">
          <div className="min-h-[calc(100vh-8.5rem)] overflow-hidden rounded-lg border border-white/[0.07] bg-[#101012] shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
