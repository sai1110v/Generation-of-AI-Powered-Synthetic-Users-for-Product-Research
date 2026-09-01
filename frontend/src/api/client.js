import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
})

export function getErrorMessage(err) {
  if (err?.response?.data?.detail) {
    const d = err.response.data.detail
    if (typeof d === 'string') return d
    return JSON.stringify(d)
  }
  if (err?.message) return err.message
  return 'Something went wrong'
}

export const healthCheck = () => api.get('/health')
export const listExperiments = () => api.get('/experiments')
export const createExperiment = (payload) => api.post('/experiments', payload)
export const getExperiment = (id) => api.get(`/experiments/${id}`)
export const deleteExperiment = (id) => api.delete(`/experiments/${id}`)
export const generatePersonas = (id) =>
  api.post(`/experiments/${id}/generate-personas`)
export const generatePersonasOneShot = (payload) =>
  api.post('/generate-personas', payload)
export const runSurvey = (id, question) =>
  api.post(`/experiments/${id}/survey`, { question })
export const listSurveys = (id) => api.get(`/experiments/${id}/surveys`)
export const getChatHistory = (expId, personaId) =>
  api.get(`/experiments/${expId}/personas/${personaId}/chat`)
export const sendChat = (expId, personaId, message) =>
  api.post(`/experiments/${expId}/personas/${personaId}/chat`, { message })
export const generateInsights = (id) => api.post(`/experiments/${id}/insights`)
export const getInsights = (id) => api.get(`/experiments/${id}/insights`)
export const getDashboard = (id) => api.get(`/experiments/${id}/dashboard`)
export const reportPdfUrl = (id) => `${baseURL}/experiments/${id}/report.pdf`
