import { BarChart3, ListChecks, MessagesSquare, Sparkles, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '', end: true, label: 'Personas', icon: Users },
  { to: 'survey', label: 'Survey', icon: ListChecks },
  { to: 'interview', label: 'Interview', icon: MessagesSquare },
  { to: 'insights', label: 'Synthesis', icon: Sparkles },
  { to: 'dashboard', label: 'Report', icon: BarChart3 },
]

export default function ExperimentNav({ experimentId }) {
  const base = `/experiments/${experimentId}`

  return (
    <nav className="flex min-w-0 gap-1 overflow-x-auto border-b border-white/[0.07] bg-[#0d0d0f] px-4 sm:px-6">
      {items.map(({ icon: Icon, ...item }) => (
        <NavLink
          key={item.label}
          to={item.to ? `${base}/${item.to}` : base}
          end={item.end}
          className={({ isActive }) =>
            `relative inline-flex h-11 shrink-0 items-center gap-2 px-2.5 text-xs font-medium transition-colors ${
              isActive ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={14} strokeWidth={1.8} />
              {item.label}
              {isActive && <span className="absolute inset-x-2 bottom-0 h-px bg-zinc-100" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
