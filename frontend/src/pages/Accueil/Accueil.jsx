import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const getRoleTheme = (id, isDark) => {
  const themes = {
    client: {
      bg: isDark ? 'rgba(29, 158, 117, 0.08)' : '#E1F5EE',
      border: isDark ? 'rgba(45, 196, 145, 0.25)' : '#9FE1CB',
      tagBg: isDark ? 'rgba(45, 196, 145, 0.15)' : '#1D9E7520',
      tagColor: isDark ? '#2DC491' : '#0F6E56',
      ctaBg: '#1D9E75',
      glow: 'rgba(29, 158, 117, 0.3)',
    },
    vendeur: {
      bg: isDark ? 'rgba(186, 117, 23, 0.08)' : '#FAEEDA',
      border: isDark ? 'rgba(243, 168, 59, 0.25)' : '#FAC775',
      tagBg: isDark ? 'rgba(243, 168, 59, 0.15)' : '#BA751720',
      tagColor: isDark ? '#F3A83B' : '#854F0B',
      ctaBg: '#BA7517',
      glow: 'rgba(243, 168, 59, 0.3)',
    },
    livreur: {
      bg: isDark ? 'rgba(216, 90, 48, 0.08)' : '#FAECE7',
      border: isDark ? 'rgba(232, 125, 85, 0.25)' : '#F5C4B3',
      tagBg: isDark ? 'rgba(232, 125, 85, 0.15)' : '#D85A3020',
      tagColor: isDark ? '#E87D55' : '#993C1D',
      ctaBg: '#D85A30',
      glow: 'rgba(232, 125, 85, 0.3)',
    },
  }
  return themes[id]
}

const roles = [
  {
    id: 'client',
    emoji: '🛒',
    nom: 'Je suis client',
    desc: 'Commandez vos produits frais livrés directement à votre porte.',
    features: ['Panier multi-étals', 'Suivi en direct', 'Paiement à la livraison'],
    tag: 'Gratuit',
    route: '/register?role=client',
  },
  {
    id: 'vendeur',
    emoji: '🏪',
    nom: 'Je suis vendeur',
    desc: 'Vendez vos produits sans vous occuper de la livraison.',
    features: ['Étal en ligne', 'Gestion des stocks', 'Paiement sécurisé'],
    tag: 'Étal virtuel',
    route: '/register?role=vendeur',
  },
  {
    id: 'livreur',
    emoji: '🏍️',
    nom: 'Je suis livreur',
    desc: 'Collectez et livrez les commandes. Gagnez à chaque course.',
    features: ['Itinéraire optimisé', 'Commissions directes', 'Carte GPS intégrée'],
    tag: 'Gagner plus',
    route: '/register?role=livreur',
  },
]

const trustItems = [
  { icon: '✅', txt: 'Paiement à la livraison' },
  { icon: '📍', txt: 'Suivi en temps réel' },
  { icon: '📸', txt: 'Photo lors de la collecte' },
  { icon: '⚡', txt: 'Livraison par zemidjan' },
]

export default function Accueil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <div className="w-full font-sans" style={{ background: 'var(--bg)' }}>

      {/* Header + Hero */}
      <div
        className="relative overflow-hidden px-6 pt-5 pb-10"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #141613 0%, #153C2F 100%)'
            : '#1D9E75',
        }}
      >
        {/* Cercles décoratifs — glassmorphic glow */}
        <div
          className="absolute -top-14 -right-14 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background: isDark ? 'rgba(45, 196, 145, 0.1)' : 'rgba(255,255,255,0.1)',
            boxShadow: isDark ? '0 0 80px 20px rgba(45, 196, 145, 0.08)' : 'none',
          }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
          style={{
            background: isDark ? 'rgba(45, 196, 145, 0.07)' : 'rgba(255,255,255,0.1)',
            boxShadow: isDark ? '0 0 60px 15px rgba(45, 196, 145, 0.06)' : 'none',
          }}
        />

        {/* Logo + bouton Se connecter */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{
                background: isDark ? 'rgba(45, 196, 145, 0.15)' : '#fff',
                color: isDark ? '#2DC491' : '#1D9E75',
              }}
            >
              V
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight leading-tight">
                ViteComm
              </div>
              <div className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)' }}>
                Marché en ligne · Cotonou
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/connect')}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: isDark ? 'rgba(45, 196, 145, 0.12)' : '#fff',
              color: isDark ? '#2DC491' : '#1D9E75',
              border: isDark ? '1px solid rgba(45, 196, 145, 0.25)' : 'none',
              boxShadow: isDark ? '0 0 20px rgba(45, 196, 145, 0.15)' : 'none',
            }}
          >
            🔐 Se connecter
          </button>
        </div>

        {/* Hero */}
        <div className="relative z-10 text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{
              background: isDark ? 'rgba(45, 196, 145, 0.1)' : 'rgba(255,255,255,0.16)',
              border: isDark ? '1px solid rgba(45, 196, 145, 0.2)' : '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            🌿 Produits frais du marché
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
            Le marché de{' '}
            <span style={{ color: isDark ? '#2DC491' : '#A8EDCA' }}>Cotonou</span>,
            <br />livré chez vous
          </h1>

          <p className="text-sm md:text-base leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.8)' }}>
            Commandez à Dantokpa, Missèbo et Akpakpa.
            Livraison rapide par zemidjan.
          </p>

          <div className="flex justify-center gap-3 flex-wrap">
            {['🍅', '🐟', '🧅', '🌶️', '🥚', '🍞'].map((e) => (
              <div
                key={e}
                className="text-2xl px-4 py-2 rounded-xl transition-all duration-300 hover:scale-110"
                style={{
                  background: isDark ? 'rgba(45, 196, 145, 0.1)' : 'rgba(255,255,255,0.15)',
                  border: isDark ? '1px solid rgba(45, 196, 145, 0.15)' : '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cartes rôles */}
      <div className="px-6 pt-12 pb-16 sm:pt-16 sm:pb-20" style={{ background: 'var(--surface)' }}>
        <div className="text-center mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold uppercase tracking-widest mb-2"
            style={{ color: isDark ? '#F3A83B' : '#f5b235' }}
          >
            Bienvenue
          </h1>
          <h2
            className="text-2xl md:text-3xl font-black mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Choisissez votre profil
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Première visite ? Créez votre compte gratuit en moins d'une minute.
          </p>
        </div>

        {/* 3 cartes côte à côte — empilées sur mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {roles.map((r) => {
            const t = getRoleTheme(r.id, isDark)
            return (
              <button
                key={r.id}
                onClick={() => navigate(r.route)}
                className="rounded-2xl border-2 p-5 text-left flex flex-col
                           transition-all duration-300 hover:-translate-y-1.5
                           hover:shadow-xl active:scale-95 cursor-pointer
                           hover:border-current"
                style={{
                  background: t.bg,
                  borderColor: t.border,
                  '--tw-shadow-color': t.glow,
                }}
              >
                {/* Emoji + tag */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl leading-none">{r.emoji}</span>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full mt-1"
                    style={{ background: t.tagBg, color: t.tagColor }}
                  >
                    {r.tag}
                  </span>
                </div>

                {/* Titre */}
                <p className="text-base font-black mb-2" style={{ color: t.tagColor }}>
                  {r.nom}
                </p>

                {/* Description */}
                <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {r.desc}
                </p>

                {/* Features */}
                <div className="flex flex-col gap-1 mb-4">
                  {r.features.map((f) => (
                    <span key={f} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {/* Bouton */}
                <div
                  className="flex items-center justify-center py-2.5 px-4 rounded-xl
                             text-white text-xs font-bold mt-auto transition-all duration-300"
                  style={{ background: t.ctaBg }}
                >
                  S'inscrire →
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative overflow-hidden px-6 py-10 sm:py-12"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #141613 0%, #4D2113 100%)'
            : '#D85A30',
        }}
      >
        <div
          className="absolute -top-12 -left-12 w-44 h-44 rounded-full pointer-events-none"
          style={{
            background: isDark ? 'rgba(232, 125, 85, 0.08)' : 'rgba(255,255,255,0.1)',
            boxShadow: isDark ? '0 0 80px 20px rgba(232, 125, 85, 0.06)' : 'none',
          }}
        />
        <div
          className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
          style={{
            background: isDark ? 'rgba(232, 125, 85, 0.06)' : 'rgba(255,255,255,0.1)',
            boxShadow: isDark ? '0 0 60px 15px rgba(232, 125, 85, 0.05)' : 'none',
          }}
        />

        <div className="relative z-10">
          <h3 className="text-xl font-black text-white mb-1">Pourquoi ViteComm ?</h3>
          <p className="text-sm mb-5" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)' }}>
            Simple, rapide et fiable — conçu pour Cotonou.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustItems.map((t) => (
              <div
                key={t.txt}
                className="flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:scale-105"
                style={{
                  background: isDark ? 'rgba(232, 125, 85, 0.08)' : 'rgba(255,255,255,0.12)',
                  border: isDark ? '1px solid rgba(232, 125, 85, 0.15)' : '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <span className="text-xl flex-shrink-0">{t.icon}</span>
                <span className="text-xs font-semibold text-white leading-snug">{t.txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}