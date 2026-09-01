import { Activity, Download, MessageSquare, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboard, getErrorMessage, reportPdfUrl } from '../api/client'
import ExperimentNav from '../components/ExperimentNav'

const COLORS = ['#6ee7b7', '#a1a1aa', '#f0c674', '#7dd3fc', '#fda4af', '#c4b5fd']
const axisTick = { fontSize: 11, fill: '#71717a' }
const tooltipStyle = { background: '#18181b', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#e4e4e7', fontSize: 12 }

export default function Dashboard() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard(id).then((res) => setData(res.data)).catch((err) => setError(getErrorMessage(err)))
  }, [id])

  if (error) return <p className="p-6 text-sm text-rose-300">{error}</p>
  if (!data) return <p className="p-6 text-sm text-zinc-600">Loading report...</p>

  const ageData = Object.entries(data.age_buckets || {}).map(([name, value]) => ({ name, value }))
  const occData = Object.entries(data.occupation_distribution || {}).map(([name, value]) => ({ name, value }))
  const sentData = Object.entries(data.sentiment_counts || {}).map(([name, value]) => ({ name, value }))
  const score = data.latest_insights?.product_validation_score

  return (
    <div className="min-h-[calc(100vh-8.5rem)]">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-300"><Activity size={13} /> Live research report</div>
          <h1 className="mt-1.5 text-lg font-semibold text-zinc-100">{data.experiment.product_name}</h1>
          <p className="mt-0.5 text-xs text-zinc-600">Run #{id} performance and cohort profile</p>
        </div>
        <a href={reportPdfUrl(id)} target="_blank" rel="noreferrer" className="primary-action"><Download size={14} /> <span className="hidden sm:inline">Export PDF</span></a>
      </header>
      <ExperimentNav experimentId={id} />

      <main className="p-4 sm:p-6">
        <div className="grid border border-white/[0.08] bg-[#141416] sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Users, 'Personas', data.personas?.length ?? 0],
            [Activity, 'Survey runs', data.survey_count],
            [MessageSquare, 'Interview messages', data.interview_message_count],
            [Activity, 'Validation signal', score != null ? Number(score).toFixed(1) : '—'],
          ].map(([Icon, label, value], index) => (
            <div key={label} className={`p-4 ${index ? 'border-t border-white/[0.07] sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-t xl:border-t-0' : ''}`}>
              <div className="flex items-center gap-2 text-[11px] text-zinc-600"><Icon size={13} />{label}</div>
              <p className="mt-2 text-2xl font-semibold text-zinc-200">{value}</p>
            </div>
          ))}
        </div>

        {(data.themes || []).length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border border-white/[0.08] bg-[#141416] p-4">
            <span className="mr-2 text-[11px] font-medium text-zinc-600">Themes</span>
            {data.themes.map((theme) => <span key={theme} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-500">{theme}</span>)}
          </div>
        )}

        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          <ChartPanel title="Age distribution">
            <BarChart data={ageData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: '#27272a' }} tickLine={false} /><YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.03)' }} /><Bar dataKey="value" fill="#6ee7b7" radius={[3, 3, 0, 0]} /></BarChart>
          </ChartPanel>
          <ChartPanel title="Sentiment">
            <PieChart><Pie data={sentData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={2}>{sentData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
          </ChartPanel>
          <ChartPanel title="Occupations">
            <BarChart data={occData} layout="vertical" margin={{ left: 24 }}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={{ stroke: '#27272a' }} tickLine={false} /><YAxis type="category" dataKey="name" width={105} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.03)' }} /><Bar dataKey="value" fill="#a1a1aa" radius={[0, 3, 3, 0]} /></BarChart>
          </ChartPanel>
        </div>
      </main>
    </div>
  )
}

function ChartPanel({ title, children }) {
  return (
    <section className="h-[320px] border border-white/[0.08] bg-[#141416] p-4">
      <h2 className="mb-3 text-xs font-medium text-zinc-500">{title}</h2>
      <ResponsiveContainer width="100%" height="88%">{children}</ResponsiveContainer>
    </section>
  )
}
