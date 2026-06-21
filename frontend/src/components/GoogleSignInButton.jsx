import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { googleLogin } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import GoogleRoleSelection from './GoogleRoleSelection'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function GoogleSignInButton({ onError, onStart, disabled }) {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  if (!googleClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-3 cursor-not-allowed"
        style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          color: 'var(--text-muted)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <svg viewBox="0 0 48 48" style={{ width: 20, height: 20, opacity: 0.35 }}>
          <path fill="var(--text-muted)" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="var(--text-muted)" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="var(--text-muted)" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/>
          <path fill="var(--text-muted)" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Google (non configuré)
      </button>
    )
  }

  return <GoogleSignInButtonInner onError={onError} onStart={onStart} disabled={disabled} />
}

function GoogleSignInButtonInner({ onError, onStart, disabled }) {
  const navigate = useNavigate()
  const { login: updateAuthContext } = useAuth()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [newGoogleUser, setNewGoogleUser] = useState(null)

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onStart?.()
      try {
        const data = await googleLogin(tokenResponse.access_token)
        updateAuthContext(data.user, data.token)

        if (data.is_new_google_user) {
          setNewGoogleUser(data.user)
          return
        }

        const role = data.user?.role || data.role
        const redirects = {
          admin:   '/admin/dashboard',
          client:  '/client/accueil',
          vendeur: '/vendeur/dashboard',
          livreur: '/livreur/dashboard',
        }
        navigate(redirects[role] || '/accueil')
      } catch (err) {
        onError?.(err.message || 'Échec de la connexion Google.')
      }
    },
    onError: () => onError?.('Échec de la connexion Google.'),
    flow: 'implicit',
  })

  if (newGoogleUser) {
    return <GoogleRoleSelection user={newGoogleUser} onComplete={() => setNewGoogleUser(null)} />
  }

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={disabled}
      className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-3
                 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        color: isDark ? 'var(--text-primary)' : '#1D9E75',
        opacity: disabled ? 0.6 : 1,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      <svg viewBox="0 0 48 48" style={{ width: 20, height: 20 }}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuer avec Google
    </button>
  )
}
