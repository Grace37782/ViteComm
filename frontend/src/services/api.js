const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function normalizeUrls(obj) {
  if (!obj) return obj
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        const host = apiBase.replace(/\/api\/?$/, '')
        return `${host}${obj}`
      }
    }
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeUrls)
  }
  if (typeof obj === 'object') {
    const res = {}
    for (const key in obj) {
      res[key] = normalizeUrls(obj[key])
    }
    return res
  }
  return obj
}

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
  const data = await res.json()
  return normalizeUrls(data)
}

export const api = {
  get: (url, opts) => request(url, opts),
  post: (url, data, opts) => request(url, {
    ...(opts || {}),
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: data instanceof FormData ? { ...(opts?.headers || {}) } : { ...(opts?.headers || {}) },
  }),
  put: (url, data, opts) => request(url, {
    ...(opts || {}),
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: data instanceof FormData ? { ...(opts?.headers || {}) } : { ...(opts?.headers || {}) },
  }),
  delete: (url, opts) => request(url, { ...(opts || {}), method: 'DELETE' }),
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
  const normalized = normalizeUrls(data)
  localStorage.setItem('vc_user', JSON.stringify(normalized.user))
  localStorage.setItem('vc_token', normalized.token)
  return normalized
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
  const normalized = normalizeUrls(data)
  localStorage.setItem('vc_user', JSON.stringify(normalized.user))
  localStorage.setItem('vc_token', normalized.token)
  return normalized
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
  const normalized = normalizeUrls(data)
  localStorage.setItem('vc_user', JSON.stringify(normalized.user))
  return normalized
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

