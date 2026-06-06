import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { login as apiLogin, googleLogin as apiGoogleLogin } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/* Détecte si la saisie est un email ou un téléphone */
function detecterTypeIdentifiant(valeur) {
  if (valeur.includes('@')) return 'email'
  if (/^\d/.test(valeur))   return 'telephone'
  return null
}

/* Messages d'erreur selon le type de problème */
function messageErreur(err) {
  const msg = err.message?.toLowerCase() || ''
  if (msg === 'network_error')
    return { texte: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.', type: 'network' }
  if (msg.includes('suspendu') || msg.includes('suspended'))
    return { texte: 'Votre compte a été suspendu. Contactez le support ViteComm.', type: 'suspend' }
  if (msg.includes('banni') || msg.includes('banned'))
    return { texte: 'Votre compte a été banni de la plateforme.', type: 'ban' }
  if (msg.includes('inactif') || msg.includes('inactive'))
    return { texte: "Votre compte est inactif. Contactez l'administrateur.", type: 'suspend' }
  if (msg.includes('invalide') || msg.includes('incorrect') || msg.includes('inexistant') || msg.includes('existe pas'))
    return { texte: 'Identifiant ou mot de passe incorrect.', type: 'erreur' }
  if (msg.includes('connexion') && (msg.includes('erreur') || msg.includes('500')))
    return { texte: 'Erreur serveur. Veuillez réessayer plus tard.', type: 'erreur' }
  return { texte: 'Identifiant ou mot de passe incorrect.', type: 'erreur' }
}

export default function Connexion() {
  const navigate = useNavigate()
  const { login: updateAuthContext } = useAuth()

  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse,  setMdp]         = useState('')
  const [showMdp,     setShowMdp]     = useState(false)
  const [erreur,      setErreur]      = useState(null)
  const [loading,     setLoading]     = useState(false)

  const typeIdent = detecterTypeIdentifiant(identifiant)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  /* ── Google Login ─────────────────────────────────── */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErreur(null)
      setLoading(true)
      try {
        const data = await apiGoogleLogin(tokenResponse.access_token)
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
        setErreur({ texte: err.message, type: 'erreur' })
      } finally {
        setLoading(false)
      }
    },
    onError: () => setErreur({ texte: 'Échec de la connexion Google.', type: 'erreur' }),
    flow: 'auth-code',
  })

  /* ── Validation ───────────────────────────────────── */
  function valider() {
    if (!identifiant.trim())
      return 'Entrez votre email ou numéro de téléphone.'
    if (typeIdent === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifiant))
      return 'Format email invalide.'
    if (typeIdent === 'telephone' && !/^\d{8,10}$/.test(identifiant.replace(/\s/g, '')))
      return 'Numéro de téléphone invalide (8 à 10 chiffres).'
    if (!motDePasse)
      return 'Entrez votre mot de passe.'
    return null
  }

  /* ── Soumission ───────────────────────────────────── */
  async function handleConnexion(e) {
    e.preventDefault()
    setErreur(null)

    const errValidation = valider()
    if (errValidation) return setErreur({ texte: errValidation, type: 'erreur' })

    setLoading(true)
    try {
      // Envoie email ou telephone selon ce que l'utilisateur a tapé
      const payload = typeIdent === 'email'
        ? { email: identifiant, mot_de_passe: motDePasse }
        : { telephone: identifiant, mot_de_passe: motDePasse }

      const data = await apiLogin(payload)

      // Met à jour le contexte global d'authentification React
      updateAuthContext(data.user, data.token)

      // Redirection automatique selon le rôle renvoyé par le backend
      const role = data.user?.role || data.role
      const redirects = {
        admin:   '/admin/dashboard',
        client:  '/client/accueil',
        vendeur: '/vendeur/dashboard',
        livreur: '/livreur/dashboard',
      }
      navigate(redirects[role] || '/accueil')

    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setLoading(false)
    }
  }

  /* ── Styles erreur selon type ─────────────────────── */
  const erreurStyles = {
    erreur:  { bg: 'rgba(255,80,80,0.15)',  border: 'rgba(255,100,100,0.3)', icon: '⚠️' },
    suspend: { bg: 'rgba(186,117,23,0.2)',  border: 'rgba(186,117,23,0.4)', icon: '🔒' },
    ban:     { bg: 'rgba(216,90,48,0.2)',   border: 'rgba(216,90,48,0.4)',  icon: '🚫' },
    network: { bg: 'rgba(255,80,80,0.15)',  border: 'rgba(255,100,100,0.3)', icon: '🌐' },
  }
  const styleErreur = erreur ? (erreurStyles[erreur.type] || erreurStyles.erreur) : null

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)' }}
    >
      {/* Décor */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl pointer-events-none" />

      {/* Retour */}
      <button
        onClick={() => navigate('/accueil')}
        className="absolute top-6 left-6 z-50 px-4 py-2 rounded-full text-sm font-semibold text-white backdrop-blur-xl border cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        ← Accueil
      </button>

      {/* Carte */}
      <div
        className="relative w-full max-w-sm rounded-[32px] p-8 backdrop-blur-xl border"
        style={{
          background:  'rgba(255,255,255,0.12)',
          borderColor: 'rgba(255,255,255,0.18)',
          boxShadow:   '0 10px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
            style={{ background: '#fff', color: '#1D9E75' }}
          >
            V
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ViteComm</h1>
          <p className="text-white/70 text-sm mt-2 text-center leading-relaxed">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleConnexion} className="flex flex-col gap-5" noValidate>

          {/* ── Identifiant : email OU téléphone ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/80">
              Email ou numéro de téléphone
            </label>
            <div
              className="flex items-center rounded-2xl overflow-hidden border transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              {/* Icône change selon le type détecté */}
              <span className="px-4 text-sm select-none">
                {typeIdent === 'telephone' ? '📱' : '✉️'}
              </span>
              <input
                type="text"
                placeholder="exemple@gmail.com ou 97000000"
                value={identifiant}
                onChange={(e) => { setIdentifiant(e.target.value); setErreur(null) }}
                autoComplete="username"
                className="flex-1 bg-transparent px-2 py-4 text-sm text-white placeholder:text-white/40 outline-none"
              />
              {/* Badge type détecté */}
              {typeIdent && (
                <span
                  className="px-3 mr-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                >
                  {typeIdent === 'email' ? 'Email' : 'Tél.'}
                </span>
              )}
            </div>
          </div>

          {/* ── Mot de passe ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/80">Mot de passe</label>
            <div
              className="flex items-center rounded-2xl overflow-hidden border"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <input
                type={showMdp ? 'text' : 'password'}
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => { setMdp(e.target.value); setErreur(null) }}
                autoComplete="current-password"
                className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder:text-white/40 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowMdp(!showMdp)}
                className="px-4 text-lg cursor-pointer"
                style={{ background: 'none', border: 'none' }}
              >
                {showMdp ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Mot de passe oublié */}
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-xs text-white/70 hover:text-white cursor-pointer"
              style={{ background: 'none', border: 'none' }}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* ── Message erreur différencié ── */}
          {erreur && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium border"
              style={{
                background:  styleErreur.bg,
                borderColor: styleErreur.border,
                color: '#fff',
              }}
            >
              {styleErreur.icon} {erreur.texte}
              {(erreur.type === 'suspend' || erreur.type === 'ban') && (
                <div className="mt-1.5">
                  <a
                    href="mailto:support@vitecomm.bj"
                    className="text-xs underline underline-offset-2 text-white/80 hover:text-white"
                  >
                    Contacter le support →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl py-4 text-base font-black bg-white text-[#1D9E75] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            {loading ? '⏳ Connexion…' : 'Se connecter →'}
          </button>

        </form>

        {/* ── Séparateur ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* ── Google Button ── */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading || !googleClientId}
          className="w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-3
                     hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          style={{
            background: '#fff',
            color: '#2C2C2A',
            opacity: (!googleClientId || loading) ? 0.6 : 1,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg viewBox="0 0 48 48" style={{ width: 20, height: 20 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleClientId
            ? (loading ? 'Connexion...' : 'Continuer avec Google')
            : 'Google (non configuré)'}
        </button>

        {/* Inscription */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/65">Pas encore de compte ?</p>
          <button
            onClick={() => navigate('/register')}
            className="mt-2 text-sm font-bold text-white underline underline-offset-4 cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            Créer un compte
          </button>
        </div>

      </div>
    </div>
  )
}