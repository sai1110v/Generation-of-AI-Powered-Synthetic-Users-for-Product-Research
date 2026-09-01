import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { healthCheck } from './api/client'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ExperimentForm from './pages/ExperimentForm'
import Home from './pages/Home'
import Insights from './pages/Insights'
import Interview from './pages/Interview'
import Personas from './pages/Personas'
import Survey from './pages/Survey'

export default function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    healthCheck()
      .then((res) => setHealth(res.data))
      .catch(() =>
        setHealth({
          llm_provider: 'unknown',
          llm_ready: false,
          detail: 'API unreachable',
        })
      )
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout health={health} />}>
          <Route index element={<ExperimentForm />} />
          <Route path="runs" element={<Home />} />
          <Route path="experiments/new" element={<ExperimentForm />} />
          <Route path="experiments/:id" element={<Personas />} />
          <Route path="experiments/:id/survey" element={<Survey />} />
          <Route path="experiments/:id/interview" element={<Interview />} />
          <Route path="experiments/:id/insights" element={<Insights />} />
          <Route path="experiments/:id/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
