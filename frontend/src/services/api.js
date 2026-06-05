const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('vc_token')
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('vc_user')
      localStorage.removeItem('vc_token')
      window.location.href = '/connect'
      return new Promise(() => {}) // Halt execution
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Erreur ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
}

export async function login(credentials) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    headers: {}
  })
  localStorage.setItem('vc_user', JSON.stringify(data.user))
  localStorage.setItem('vc_token', data.token)
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
