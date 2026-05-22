import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const profils = [
  {
    id: 'client',
    emoji: '🛒',
    label: 'Acheter',
    color: '#1D9E75',
  },
  {
    id: 'vendeur',
    emoji: '🏪',
    label: 'Vendre',
    color: '#BA7517',
  },
  {
    id: 'livreur',
    emoji: '🏍️',
    label: 'Livrer',
    color: '#D85A30',
  },
]

export default function Inscription() {

  const navigate = useNavigate()

  const [profil, setProfil] = useState('client')

  const [showMdp, setShowMdp] = useState(false)

  return (

    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)',
      }}
    >

      {/* Décor */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl" />

      {/* Retour accueil */}
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

      {/* Carte */}
      <div
        className="relative w-full max-w-md rounded-[32px] p-8 backdrop-blur-xl border"
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
            Créer un compte
          </h1>

          <p className="text-white/70 text-sm mt-2 text-center">
            Rejoignez ViteComm en quelques secondes
          </p>

        </div>

          {/* Choix profil */}
            <div className="mb-6">

            <div className="grid grid-cols-3 gap-3">

              {profils.map((p) => {

                const actif = profil === p.id

                return (

                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfil(p.id)}
                    className="rounded-2xl py-4 border transition-all"
                    style={{
                      background: actif
                        ? p.color
                        : 'rgba(255,255,255,0.08)',

                      borderColor: actif
                        ? p.color
                        : 'rgba(255,255,255,0.12)',
                    }}
                  >

                    <div className="text-2xl mb-2">
                      {p.emoji}
                    </div>

                    <div className="text-xs font-bold text-white">
                      {p.label}
                    </div>

                  </button>

                )
              })}

            </div>

          </div>

        {/* Formulaire */}
        <form className="flex flex-col gap-5">

          {/* Nom */}
          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-white/80">
              Nom
            </label>

            <input
              type="text"
              placeholder="Votre nom"
              className="rounded-2xl px-4 py-4 text-sm text-white
                         placeholder:text-white/40 outline-none border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            />

          </div>

           {/* Prenom */}
          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-white/80">
              Prenom
            </label>

            <input
              type="text"
              placeholder="Votre prenom"
              className="rounded-2xl px-4 py-4 text-sm text-white
                         placeholder:text-white/40 outline-none border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            />

          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-white/80">
              Adresse email
            </label>

            <input
              type="email"
              placeholder="exemple@gmail.com"
              className="rounded-2xl px-4 py-4 text-sm text-white
                         placeholder:text-white/40 outline-none border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            />

          </div>

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

              <span className="px-4 text-white/70 text-sm">
                +229
              </span>

              <input
                type="tel"
                placeholder="97 00 00 00"
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

        

          {/* Champs dynamiques */}

          {profil === 'client' && (

            <div className="flex flex-col gap-2">

              <label className="text-sm font-semibold text-white/80">
                Adresse de livraison
              </label>

              <input
                type="text"
                placeholder="Ex: Akpakpa"
                className="rounded-2xl px-4 py-4 text-sm text-white
                           placeholder:text-white/40 outline-none border"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              />

            </div>

          )}

          {profil === 'vendeur' && (

            <>

              <div className="flex flex-col gap-2">

                <label className="text-sm font-semibold text-white/80">
                  Nom boutique
                </label>

                <input
                  type="text"
                  placeholder="Ex: Grâce Boutique"
                  className="rounded-2xl px-4 py-4 text-sm text-white
                             placeholder:text-white/40 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                />

              </div>

              <div className="flex flex-col gap-2">

                <label className="text-sm font-semibold text-white/80">
                  Marché
                </label>

                <input
                  type="text"
                  placeholder="Ex: Dantokpa"
                  className="rounded-2xl px-4 py-4 text-sm text-white
                             placeholder:text-white/40 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                />

              </div>

            </>

          )}

          {profil === 'livreur' && (

            <>

              <div className="flex flex-col gap-2">

                <label className="text-sm font-semibold text-white/80">
                  Type véhicule
                </label>

                <input
                  type="text"
                  placeholder="Ex: Zemidjan"
                  className="rounded-2xl px-4 py-4 text-sm text-white
                             placeholder:text-white/40 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                />

              </div>

              <div className="flex flex-col gap-2">

                <label className="text-sm font-semibold text-white/80">
                  Immatriculation
                </label>

                <input
                  type="text"
                  placeholder="RB-1234"
                  className="rounded-2xl px-4 py-4 text-sm text-white
                             placeholder:text-white/40 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                />

              </div>

            </>

          )}

          {/* Bouton */}
          <button
            type="submit"
            className="mt-2 rounded-2xl py-4 text-base font-black
                       bg-white text-[#1D9E75]
                       hover:scale-[1.02] active:scale-95
                       transition-all"
          >
            Créer mon compte →
          </button>

        </form>

        {/* Connexion */}
        <div className="mt-6 text-center">

          <p className="text-sm text-white/65">
            Vous avez déjà un compte ?
          </p>

          <button
            onClick={() => navigate('/connect')}
            className="mt-2 text-sm font-bold text-white underline underline-offset-4"
          >
            Se connecter
          </button>

        </div>

      </div>

    </div>
  )
}