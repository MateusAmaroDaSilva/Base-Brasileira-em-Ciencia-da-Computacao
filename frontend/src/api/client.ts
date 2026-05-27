import axios from 'axios'

// Uses Vite's proxy in development (/api → localhost:8000)
// avoiding CORS issues entirely.
const API_BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})
