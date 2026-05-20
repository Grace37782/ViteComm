import { useState } from 'react'
import { useNavigate } from 'react-router-dom'



export default function Connexion() {
  const navigate = useNavigate()
  const [telephone, setTel]     = useState('')
  const [motDePasse, setMdp]    = useState('')
  const [showMdp, setShowMdp]   = useState(false)
  const [erreur, setErreur]     = useState('')
  const [loading, setLoading]   = useState(false)

 

  function handleConnexion(e) {
    e.preventDefault()

  setErreur('')

  if (!telephone) {
    return setErreur('Entrez votre numéro.')
  }

  if (!motDePasse) {
    return setErreur('Entrez votre mot de passe.')
  }

  setLoading(true)

    // TODO : remplacer par l'appel API réel
    // const res = await fetch('/api/auth/login', { ... })
    setTimeout(() => {
      setLoading(false)
      navigate('/accueil')
    }, 1000)
  }
return (
  <div
    className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    style={{
      background:
        'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)',
    }}
  >

    {/* Cercles décoratifs */}
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl" />

    {/* Carte glass */}
    <div
      className="relative w-full max-w-sm rounded-[32px] p-8 backdrop-blur-xl border"
      style={{
        background: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.18)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
      }}
    >

      {/* Logo */}
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
          Connectez-vous pour accéder à votre espace
        </p>

      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleConnexion}
        className="flex flex-col gap-5"
      >

        {/* Téléphone */}
        <div className="flex flex-col gap-2">

          <label className="text-sm font-semibold text-white/80">
            Téléphone
          </label>

          <div
            className="flex items-center rounded-2xl overflow-hidden border"
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >

            <span className="px-4 text-white/70 text-sm font-medium">
              +229
            </span>

            <input
              type="tel"
              placeholder="97 00 00 00"
              value={telephone}
              onChange={(e) => setTel(e.target.value)}
              className="flex-1 bg-transparent px-4 py-4 text-sm
                         text-white placeholder:text-white/40 outline-none"
            />

          </div>

        </div>

        {/* Mot de passe */}
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

        {/* Erreur */}
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

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-2xl py-4 text-base font-black
                     text-white transition-all duration-200
                     hover:scale-[1.02] active:scale-95"
          style={{
            background: '#fff',
            color: '#1D9E75',
          }}
        >
          {loading
            ? 'Connexion...'
            : 'Se connecter →'}
        </button>

      </form>

      {/* Inscription */}
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