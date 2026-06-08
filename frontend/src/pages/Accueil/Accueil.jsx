import { useNavigate } from 'react-router-dom'

const roles = [
  {
    id: 'client',
    emoji: '🛒',
    nom: 'Je suis client',
    desc: 'Commandez vos produits frais livrés directement à votre porte.',
    features: ['Panier multi-étals', 'Suivi en direct', 'Paiement à la livraison'],
    tag: 'Gratuit',
    bg: '#E1F5EE',
    border: '#9FE1CB',
    tagBg: '#1D9E7520',
    tagColor: '#0F6E56',
    ctaBg: '#1D9E75',
    route: '/register?role=client',
  },
  {
    id: 'vendeur',
    emoji: '🏪',
    nom: 'Je suis vendeur',
    desc: 'Vendez vos produits sans vous occuper de la livraison.',
    features: ['Étal en ligne', 'Gestion des stocks', 'Paiement sécurisé'],
    tag: 'Étal virtuel',
    bg: '#FAEEDA',
    border: '#FAC775',
    tagBg: '#BA751720',
    tagColor: '#854F0B',
    ctaBg: '#BA7517',
    route: '/register?role=vendeur',
  },
  {
    id: 'livreur',
    emoji: '🏍️',
    nom: 'Je suis livreur',
    desc: 'Collectez et livrez les commandes. Gagnez à chaque course.',
    features: ['Itinéraire optimisé', 'Commissions directes', 'Carte GPS intégrée'],
    tag: 'Gagner plus',
    bg: '#FAECE7',
    border: '#F5C4B3',
    tagBg: '#D85A3020',
    tagColor: '#993C1D',
    ctaBg: '#D85A30',
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

  return (
    <div className="w-full min-h-screen flex flex-col font-sans">

      {/* Header + Hero */}
      <div
        className="relative overflow-hidden px-6 pt-5 pb-10"
        style={{ background: '#1D9E75' }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

        {/* Logo + bouton Se connecter */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: '#fff', color: '#1D9E75' }}
            >
              V
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight leading-tight">
                ViteComm
              </div>
              <div className="text-xs text-white/70 mt-0.5">Marché en ligne · Cotonou</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/connect')}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full flex-shrink-0 cursor-pointer"
            style={{ background: '#fff', color: '#1D9E75' }}
          >
            🔐 Se connecter
          </button>
        </div>

        {/* Hero */}
        <div className="relative z-10 text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/30"
            style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
          >
            🌿 Produits frais du marché
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
            Le marché de{' '}
            <span style={{ color: '#A8EDCA' }}>Cotonou</span>,
            <br />livré chez vous
          </h1>

          <p className="text-sm md:text-base text-white/80 leading-relaxed mb-6 max-w-xl mx-auto">
            Commandez à Dantokpa, Missèbo et Akpakpa.
            Livraison rapide par zemidjan.
          </p>

          <div className="flex justify-center gap-3 flex-wrap">
            {['🍅', '🐟', '🧅', '🌶️', '🥚', '🍞'].map((e) => (
              <div
                key={e}
                className="text-2xl px-4 py-2 rounded-xl border border-white/20"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*Cartes rôles*/}
      <div className="flex-1 bg-white px-6 py-10">
        <div className="text-center mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold uppercase tracking-widest mb-2"
            style={{ color: '#f5b235' }}
          >
            Bienvenue
          </h1>
          <h2
            className="text-2xl md:text-3xl font-black mb-2"
            style={{ color: '#2C2C2A' }}
          >
            Choisissez votre profil
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#888780' }}>
            Première visite ? Créez votre compte gratuit en moins d'une minute.
          </p>
        </div>

        {/* 3 cartes côte à côte — empilées sur mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(r.route)}
              className="rounded-2xl border-2 p-5 text-left flex flex-col
                         transition-all duration-150 hover:-translate-y-1
                         hover:shadow-lg active:scale-95 cursor-pointer"
              style={{ background: r.bg, borderColor: r.border }}
            >
              {/* Emoji + tag */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl leading-none">{r.emoji}</span>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full mt-1"
                  style={{ background: r.tagBg, color: r.tagColor }}
                >
                  {r.tag}
                </span>
              </div>

              {/* Titre */}
              <p className="text-base font-black mb-2" style={{ color: r.tagColor }}>
                {r.nom}
              </p>

              {/* Description */}
              <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: '#5F5E5A' }}>
                {r.desc}
              </p>

              {/* Features */}
              <div className="flex flex-col gap-1 mb-4">
                {r.features.map((f) => (
                  <span key={f} className="text-xs font-medium" style={{ color: '#5F5E5A' }}>
                    ✓ {f}
                  </span>
                ))}
              </div>

              {/* Bouton */}
              <div
                className="flex items-center justify-center py-2.5 px-4 rounded-xl
                           text-white text-xs font-bold mt-auto"
                style={{ background: r.ctaBg }}
              >
                S'inscrire →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/*Footer*/}
      <div
        className="relative overflow-hidden px-6 py-8"
        style={{ background: '#D85A30' }}
      >
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-xl font-black text-white mb-1">Pourquoi ViteComm ?</h3>
          <p className="text-sm text-white/75 mb-5">
            Simple, rapide et fiable — conçu pour Cotonou.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustItems.map((t) => (
              <div
                key={t.txt}
                className="flex items-center gap-3 rounded-xl p-3 border border-white/20"
                style={{ background: 'rgba(255,255,255,0.12)' }}
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