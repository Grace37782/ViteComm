import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import GoogleSignInButton from '../../components/GoogleSignInButton'
import { AlertTriangle, Lock, Ban, WifiOff, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'

function messageErreur(err, t) {
  const msg = err.message?.toLowerCase() || ''
  if (msg === 'network_error')
    return { texte: t('connect.err.network'), type: 'network' }
  if (msg.includes('google') || msg.includes('continuer avec google'))
    return { texte: err.message || t('connect.err.google'), type: 'google' }
  if (msg.includes('suspendu') || msg.includes('suspended'))
    return { texte: t('connect.err.suspended'), type: 'suspend' }
  if (msg.includes('banni') || msg.includes('banned'))
    return { texte: t('connect.err.banned'), type: 'ban' }
  if (msg.includes('inactif') || msg.includes('inactive'))
    return { texte: t('connect.err.inactive'), type: 'suspend' }
  if (msg.includes('invalide') || msg.includes('incorrect') || msg.includes('inexistant') || msg.includes('existe pas'))
    return { texte: t('connect.err.incorrect'), type: 'erreur' }
  if (msg.includes('connexion') && (msg.includes('erreur') || msg.includes('500')))
    return { texte: t('connect.err.server'), type: 'erreur' }
  return { texte: t('connect.err.incorrect'), type: 'erreur' }
}

const erreurStyles = {
  erreur:  { bg: 'rgba(255,80,80,0.12)',  border: 'rgba(255,100,100,0.25)', Icon: AlertTriangle, iconColor: '#E24B4A' },
  suspend: { bg: 'rgba(186,117,23,0.15)', border: 'rgba(186,117,23,0.35)', Icon: Lock, iconColor: '#BA7517' },
  ban:     { bg: 'rgba(216,90,48,0.15)',  border: 'rgba(216,90,48,0.35)',  Icon: Ban, iconColor: '#D85A30' },
  network: { bg: 'rgba(255,80,80,0.12)',  border: 'rgba(255,100,100,0.25)', Icon: WifiOff, iconColor: '#E24B4A' },
  google:  { bg: 'rgba(66,133,244,0.12)', border: 'rgba(66,133,244,0.25)', Icon: AlertTriangle, iconColor: '#4285F4' },
}

export default function Connexion() {
  const navigate = useNavigate()
  const { user, login: updateAuthContext } = useAuth()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'

  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse,  setMdp]         = useState('')
  const [showMdp,     setShowMdp]     = useState(false)
  const [erreur,      setErreur]      = useState(null)
  const [loading,     setLoading]     = useState(false)

  const alreadyLoggedIn = !!user && !!localStorage.getItem('vc_token')

  function valider() {
    if (!identifiant.trim())
      return t('connect.val.email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifiant))
      return t('connect.val.emailFormat')
    if (!motDePasse)
      return t('connect.val.password')
    return null
  }

  async function handleConnexion(e) {
    e.preventDefault()
    setErreur(null)
    const errValidation = valider()
    if (errValidation) return setErreur({ texte: errValidation, type: 'erreur' })
    setLoading(true)
    try {
      const data = await apiLogin({ email: identifiant, mot_de_passe: motDePasse })
      updateAuthContext(data.user, data.token)
      const role = data.user?.role || data.role
      const redirects = {
        admin:   '/admin/dashboard',
        client:  '/client/accueil',
        vendeur: '/vendeur/dashboard',
        livreur: '/livreur/dashboard',
      }
      navigate(redirects[role] || '/accueil')
    } catch (err) {
      setErreur(messageErreur(err, t))
    } finally {
      setLoading(false)
    }
  }

  const styleErreur = erreur ? (erreurStyles[erreur.type] || erreurStyles.erreur) : null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Hero section */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 sm:py-8 overflow-hidden">
        {/* Decorative background elements — theme-aware */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
            style={{ background: isDark ? '#1FA876' : '#1D9E75' }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: isDark ? '#BA7517' : '#BA7517' }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/accueil')}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: 'var(--text-secondary)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <span className="text-base">←</span> {t('connect.back').replace('← ', '')}
        </button>

        {/* Main card */}
        <div
          className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 md:p-10"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark
              ? '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 25px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
          }}
        >
          {/* Green accent bar at top */}
          <div
            className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full"
            style={{ background: 'linear-gradient(90deg, #1D9E75, #2DC491, #1D9E75)' }}
          />

          {/* Logo + title */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
              style={{
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(29,158,117,0.25)',
              }}
            >
              V
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              ViteComm
            </h1>
            <p className="text-sm mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
              {t('connect.subtitle')}
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleConnexion} className="flex flex-col gap-5" noValidate>
            {/* Identifiant */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'var(--surface-alt)',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <span className="pl-4 text-sm select-none">
                  <Mail size={16} color="var(--text-muted)" />
                </span>
                <input
                  type="email"
                  placeholder="exemple@gmail.com"
                  value={identifiant}
                  onChange={(e) => { setIdentifiant(e.target.value); setErreur(null) }}
                  autoComplete="username"
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('connect.password')}
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'var(--surface-alt)',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <span className="pl-4 text-sm select-none"><Lock size={16} color="var(--text-muted)" /></span>
                <input
                  type={showMdp ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => { setMdp(e.target.value); setErreur(null) }}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowMdp(!showMdp)}
                  className="px-4 text-base cursor-pointer"
                  style={{ background: 'none', border: 'none' }}
                >
                  {showMdp ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'var(--accent)' }}
              >
                {t('connect.forgotPassword')}
              </button>
            </div>

            {/* Message erreur */}
            {erreur && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium border"
                style={{
                  background: styleErreur.bg,
                  borderColor: styleErreur.border,
                  color: 'var(--text-primary)',
                }}
              >
                {styleErreur.Icon && <styleErreur.Icon size={16} color={styleErreur.iconColor} className="inline-block mr-1.5 -mt-0.5" />} {erreur.texte}
                {(erreur.type === 'suspend' || erreur.type === 'ban') && (
                  <div className="mt-1.5">
                    <a
                      href="mailto:support@vitecomm.bj"
                      className="text-xs underline underline-offset-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      Contacter le support →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Déjà connecté */}
            {alreadyLoggedIn && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium border text-center"
                style={{
                  background: isDark ? 'rgba(255,193,7,0.08)' : 'rgba(255,193,7,0.12)',
                  borderColor: isDark ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.3)',
                  color: 'var(--text-primary)',
                }}
              >
                <Lock size={14} className="inline-block mr-1 -mt-0.5" color="#BA7517" /> {t('connect.alreadyLoggedIn')} <strong>{user.prenom} {user.nom}</strong>.
                <div className="mt-2.5 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => { localStorage.clear(); window.location.href = '/connect' }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      color: 'var(--text-primary)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                  >
                    {t('connect.logout')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const r = user?.role
                      const map = { vendeur: '/vendeur/dashboard', livreur: '/livreur/dashboard', admin: '/admin/dashboard' }
                      navigate(map[r] || '/client/accueil')
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
                  >
                    {t('connect.mySpace')}
                  </button>
                </div>
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                color: '#fff',
                border: 'none',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(29,158,117,0.3)',
              }}
            >
              {loading ? <><Loader2 size={14} className="inline-block animate-spin mr-1.5" /> {t('connect.loginLoading')}</> : t('connect.loginBtn')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('connect.or')}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <GoogleSignInButton
            onError={(msg) => {
              const isGoogleProvider = msg.includes('Google') || msg.includes('connexion Google')
              setErreur({ texte: msg, type: isGoogleProvider ? 'google' : 'erreur' })
            }}
            onStart={() => setErreur(null)}
            disabled={loading}
          />

          {/* Inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('connect.noAccount')}</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-1.5 text-sm font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--accent)' }}
            >
              {t('connect.createAccount')}
            </button>
            <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              {t('connect.acceptCGU')}{' '}
              <span onClick={() => navigate('/cgu')} className="font-bold underline cursor-pointer" style={{ color: 'var(--accent)' }}>
                CGU
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
