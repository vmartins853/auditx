import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

export const runScan = (target, options = {}) =>
  axios.post('/api/scanner/scan', { target, ...options }, {
    timeout: 300000,
    headers: { 'Content-Type': 'application/json' },
  })

export const runDNSRecon = (domain, enumerate_subdomains = true) =>
  api.post('/dns/recon', { domain, enumerate_subdomains })

export const analyzeOutput = (tool, output) =>
  api.post('/ai/analyze', { tool, output })

export const generateReport = (data) =>
  api.post('/reports/generate', data, { responseType: 'blob' })

export default api
