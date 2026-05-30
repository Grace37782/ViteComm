import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/api'

export default function Connexion() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [motDePasse, setMdp] = useState('')
  const [showMdp, setShowMdp] = useState(false)

  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConnexion(e) {
    e.preventDefault()
    setErreur('')

    if (!email) return setErreur('Entrez votre adresse email.')
    if (!motDePasse) return setErreur('Entrez votre mot de passe.')

    setLoading(true)
    try {
      const data = await login(email, motDePasse)
      const role = data.user.role

      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'client') navigate('/client/accueil')
      else if (role === 'vendeur') navigate('/vendeur/dashboard')
      else if (role === 'livreur') navigate('/livreur/dashboard')
      else navigate('/accueil')
    } catch (err) {
      setErreur(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (

    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)',
      }}
    >

      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl" />

      <button
        onClick={() => navigate('/accueil')}
        className="absolute top-6 left-6 z-50
                   px-4 py-2 rounded-full
                   text-sm font-semibold text-white
                   backdrop-blur-xl border"
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        ← Accueil
      </button>

      <div
        className="relative w-full max-w-sm rounded-[32px] p-8 backdrop-blur-xl border"
        style={{
          background: 'rgba(255,255,255,0.12)',
          borderColor: 'rgba(255,255,255,0.18)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        }}
      >

        <div className="flex flex-col items-center mb-8">

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center
                       text-3xl font-black mb-4"
            style={{
              background: '#fff',
              color: '#1D9E75',
            }}
          >
            V
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            ViteComm
          </h1>

          <p className="text-white/70 text-sm mt-2 text-center leading-relaxed">
            Connectez-vous à votre espace
          </p>

        </div>

        <form
          onSubmit={handleConnexion}
          className="flex flex-col gap-5"
        >

          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-white/80">
              Adresse email
            </label>

            <div
              className="flex items-center rounded-2xl overflow-hidden border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >

              <span className="px-4 text-white/70 text-sm">
                ✉️
              </span>

              <input
                type="email"
                placeholder="exemple@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent px-4 py-4 text-sm
                           text-white placeholder:text-white/40 outline-none"
              />

            </div>

          </div>

          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-white/80">
              Mot de passe
            </label>

            <div
              className="flex items-center rounded-2xl overflow-hidden border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >

              <input
                type={showMdp ? 'text' : 'password'}
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => setMdp(e.target.value)}
                className="flex-1 bg-transparent px-4 py-4 text-sm
                           text-white placeholder:text-white/40 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowMdp(!showMdp)}
                className="px-4 text-lg"
              >
                {showMdp ? '🙈' : '👁️'}
              </button>

            </div>

          </div>

          <div className="flex justify-end -mt-2">

            <button
              type="button"
              className="text-xs text-white/70 hover:text-white"
            >
              Mot de passe oublié ?
            </button>

          </div>

          {erreur && (

            <div
              className="rounded-2xl px-4 py-3 text-sm font-medium"
              style={{
                background: 'rgba(255,80,80,0.15)',
                color: '#fff',
              }}
            >
              ⚠️ {erreur}
            </div>

          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl py-4 text-base font-black
                       bg-white text-[#1D9E75]
                       hover:scale-[1.02] active:scale-95
                       transition-all"
          >
            {loading
              ? 'Connexion...'
              : 'Se connecter →'}
          </button>

        </form>

        <div className="mt-6 text-center">

          <p className="text-sm text-white/65">
            Pas encore de compte ?
          </p>

          <button
            onClick={() => navigate('/register')}
            className="mt-2 text-sm font-bold text-white underline underline-offset-4"
          >
            Créer un compte
          </button>

        </div>

      </div>

    </div>
  )
}
