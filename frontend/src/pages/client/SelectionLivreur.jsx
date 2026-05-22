import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/client/BottomNav'

/* ── Données statiques (remplacer par API) ───────────────── */
const LIVREURS = [
  {
    id: 1,
    nom: 'Rodrigue K.',
    emoji: '🏍️',
    type: 'Zemidjan',
    note: 4.9,
    avis: 134,
    livraisons: 312,
    distance: '0.4 km',
    temps: '8 min',
    tarif: 450,
    disponible: true,
    badge: 'Meilleur de la zone',
    badgeColor: '#1D9E75',
  },
  {
    id: 2,
    nom: 'Kofi A.',
    emoji: '🏍️',
    type: 'Zemidjan',
    note: 4.7,
    avis: 98,
    livraisons: 201,
    distance: '0.9 km',
    temps: '12 min',
    tarif: 450,
    disponible: true,
    badge: null,
    badgeColor: null,
  },
  {
    id: 3,
    nom: 'Mensah T.',
    emoji: '🛺',
    type: 'Tricycle',
    note: 4.8,
    avis: 76,
    livraisons: 189,
    distance: '1.2 km',
    temps: '15 min',
    tarif: 600,
    disponible: true,
    badge: 'Gros volumes',
    badgeColor: '#BA7517',
  },
  {
    id: 4,
    nom: 'Olivier D.',
    emoji: '🏍️',
    type: 'Zemidjan',
    note: 4.5,
    avis: 52,
    livraisons: 98,
    distance: '1.8 km',
    temps: '20 min',
    tarif: 450,
    disponible: false,
    badge: null,
    badgeColor: null,
  },
]

const TOTAL_COMMANDE = 2750 // TODO : depuis contexte panier

export default function SelectionLivreur() {
  const navigate = useNavigate()
  const [livreurId, setLivreurId] = useState(null)
  const [loading, setLoading]     = useState(false)

  const livreur = LIVREURS.find((l) => l.id === livreurId)
  const totalFinal = livreur ? TOTAL_COMMANDE - 450 + livreur.tarif : TOTAL_COMMANDE

  function confirmerCommande() {
    if (!livreurId) return
    setLoading(true)
    // TODO : POST /api/commandes { livreurId, ... }
    setTimeout(() => {
      setLoading(false)
      navigate('/client/suivi')
    }, 1200)
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/client/panier')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Choisir un livreur</div>
            <div className="text-white/70 text-xs">Livreurs disponibles près de vous</div>
          </div>
        </div>

        {/* Étapes commande */}
        <div className="relative z-10 flex items-center gap-2">
          {['Panier', 'Livreur', 'Suivi'].map((etape, i) => (
            <div key={etape} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{
                    background: i === 1 ? '#fff' : 'rgba(255,255,255,0.3)',
                    color: i === 1 ? '#1D9E75' : '#fff',
                  }}
                >
                  {i < 1 ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: i === 1 ? '#fff' : 'rgba(255,255,255,0.6)' }}
                >
                  {etape}
                </span>
              </div>
              {i < 2 && <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ══ RÉSUMÉ COMMANDE ══ */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: '#E1F5EE', border: '1.5px solid #9FE1CB' }}
        >
          <span className="text-2xl">🛒</span>
          <div className="flex-1">
            <div className="font-black text-sm" style={{ color: '#0F6E56' }}>
              Commande · 3 articles · 2 étals
            </div>
            <div className="text-xs" style={{ color: '#1D9E75' }}>
              Dantokpa — livraison à Akpakpa
            </div>
          </div>
          <div className="font-black text-sm" style={{ color: '#0F6E56' }}>
            {(TOTAL_COMMANDE - 450).toLocaleString()} F
          </div>
        </div>

        {/* ══ LISTE LIVREURS ══ */}
        <div>
          <h2 className="font-black text-base mb-3" style={{ color: '#2C2C2A' }}>
            Livreurs disponibles
          </h2>

          <div className="flex flex-col gap-3">
            {LIVREURS.map((l) => {
              const selectionne = livreurId === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => l.disponible && setLivreurId(l.id)}
                  disabled={!l.disponible}
                  className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all active:scale-98"
                  style={{
                    background:   selectionne ? '#E1F5EE' : '#fff',
                    border:       `2px solid ${selectionne ? '#1D9E75' : '#E8E6DF'}`,
                    boxShadow:    selectionne ? '0 4px 16px rgba(29,158,117,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                    opacity:      l.disponible ? 1 : 0.5,
                    transform:    selectionne ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3">

                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: selectionne ? '#1D9E75' : '#F7F8F3' }}
                    >
                      {l.emoji}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-black text-sm" style={{ color: '#2C2C2A' }}>{l.nom}</span>
                        {l.badge && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: l.badgeColor + '20', color: l.badgeColor }}
                          >
                            {l.badge}
                          </span>
                        )}
                        {!l.disponible && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#F1EFE8', color: '#888780' }}
                          >
                            Indisponible
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs" style={{ color: '#888780' }}>
                          ⭐ {l.note} · {l.avis} avis
                        </span>
                        <span className="text-xs" style={{ color: '#888780' }}>
                          🚀 {l.livraisons} courses
                        </span>
                        <span className="text-xs" style={{ color: '#888780' }}>
                          {l.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: '#E1F5EE', color: '#0F6E56' }}
                        >
                          📍 {l.distance}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: '#E6F1FB', color: '#185FA5' }}
                        >
                          ⏱ {l.temps}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: '#FAEEDA', color: '#854F0B' }}
                        >
                          💵 {l.tarif.toLocaleString()} F
                        </span>
                      </div>
                    </div>

                    {/* Indicateur sélection */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{
                        background: selectionne ? '#1D9E75' : 'transparent',
                        border: `2px solid ${selectionne ? '#1D9E75' : '#E8E6DF'}`,
                      }}
                    >
                      {selectionne && (
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>
                      )}
                    </div>

                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ RÉCAP FINAL ══ */}
        {livreur && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
          >
            <h3 className="font-black text-sm mb-3" style={{ color: '#2C2C2A' }}>Récapitulatif final</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Articles</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>
                  {(TOTAL_COMMANDE - 450).toLocaleString()} F
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Livraison — {livreur.nom}</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>
                  {livreur.tarif.toLocaleString()} F
                </span>
              </div>
              <div
                className="flex justify-between pt-2 mt-1"
                style={{ borderTop: '1.5px solid #E8E6DF' }}
              >
                <span className="font-black text-base" style={{ color: '#2C2C2A' }}>Total COD</span>
                <span className="font-black text-base" style={{ color: '#1D9E75' }}>
                  {totalFinal.toLocaleString()} F
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══ BOUTON CONFIRMER ══ */}
        <button
          onClick={confirmerCommande}
          disabled={!livreurId || loading}
          className="w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all active:scale-98"
          style={{
            background: livreurId ? '#1D9E75' : '#D3D1C7',
            border: 'none',
            boxShadow: livreurId ? '0 6px 24px rgba(29,158,117,0.4)' : 'none',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading
            ? '⏳ Confirmation en cours…'
            : livreurId
            ? `Confirmer avec ${livreur?.nom} →`
            : 'Sélectionnez un livreur'}
        </button>

        <p className="text-center text-xs pb-2" style={{ color: '#888780' }}>
          💵 Vous payez {totalFinal.toLocaleString()} F en espèces à la réception
        </p>

      </div>

      <BottomNav panierCount={3} />
    </div>
  )
}