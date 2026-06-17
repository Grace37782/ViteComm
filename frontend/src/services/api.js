const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function getToken() {
  return localStorage.getItem('vc_token')
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const headers = isFormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000)

  let res
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, signal: controller.signal })
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps à répondre — réessayez', { cause: err })
    }
    throw new Error('Impossible de contacter le serveur — vérifiez votre connexion', { cause: err })
  }
  clearTimeout(timeout)

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('vc_user')
      localStorage.removeItem('vc_token')
      window.location.href = '/connect'
      throw new Error('AUTH_ERROR')
    }
    const err = await res.json().catch(() => ({ error: 'Erreur du serveur.' }))
    throw new Error(err.error || 'Une erreur est survenue.')
  }
  return res.json()
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: data instanceof FormData ? {} : {},
  }),
  put: (url, data) => request(url, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: data instanceof FormData ? {} : {},
  }),
  delete: (url) => request(url, { method: 'DELETE' }),
}

export async function login(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur de connexion.' }))
    throw new Error(err.error || `Erreur ${res.status}`)
  }
  const data = await res.json()
  localStorage.setItem('vc_user', JSON.stringify(data.user))
  localStorage.setItem('vc_token', data.token)
  return data
}

export async function googleLogin(credential) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur de connexion Google.' }))
    throw new Error(err.error || `Erreur ${res.status}`)
  }
  const data = await res.json()
  localStorage.setItem('vc_user', JSON.stringify(data.user))
  localStorage.setItem('vc_token', data.token)
  return data
}

export async function completeGoogleRegistration(roleData) {
  const token = localStorage.getItem('vc_token')
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
  const res = await fetch(`${API_BASE}/auth/google/complete-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(roleData),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur de configuration du rôle.' }))
    throw new Error(err.error || `Erreur ${res.status}`)
  }
  const data = await res.json()
  localStorage.setItem('vc_user', JSON.stringify(data.user))
  return data
}

export async function register(data) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {}
  })
  localStorage.setItem('vc_user', JSON.stringify(res.user))
  localStorage.setItem('vc_token', res.token)
  return res
}
