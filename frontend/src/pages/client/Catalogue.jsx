import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../../components/client/BottomNav'

/* ── Données statiques (remplacer par API) ───────────────── */
const MARCHES = {
  1: { nom: 'Marché Dantokpa', distance: '1.2 km', etals: 42, note: 4.8 },
  2: { nom: 'Marché Missèbo',  distance: '2.1 km', etals: 28, note: 4.6 },
  3: { nom: 'Marché Ganhi',    distance: '3.4 km', etals: 35, note: 4.5 },
}

const ETALS = [
  {
    id: 1,
    nom: 'Étal Maman Adjoua',
    note: 4.9,
    avis: 120,
    emoji: '👩‍🌾',
    categorie: 'Légumes',
    produits: [
      { id: 101, emoji: '🍅', nom: 'Tomates fraîches',  prix: 250,  unite: 'kg',   stock: 7  },
      { id: 102, emoji: '🧅', nom: 'Oignons rouges',    prix: 180,  unite: 'kg',   stock: 4  },
      { id: 103, emoji: '🥬', nom: 'Gombo frais',       prix: 300,  unite: 'tas',  stock: 5  },
      { id: 104, emoji: '🌶️', nom: 'Piments frais',     prix: 150,  unite: 'tas',  stock: 8  },
    ],
  },
  {
    id: 2,
    nom: 'Étal Brice Poisson',
    note: 4.7,
    avis: 89,
    emoji: '🐟',
    categorie: 'Poisson',
    produits: [
      { id: 201, emoji: '🐟', nom: 'Poisson capitaine', prix: 1800, unite: 'kg',   stock: 3  },
      { id: 202, emoji: '🦐', nom: 'Crevettes fraîches',prix: 2500, unite: 'kg',   stock: 2  },
      { id: 203, emoji: '🐠', nom: 'Tilapia grillé',    prix: 1200, unite: 'pièce',stock: 6  },
    ],
  },
  {
    id: 3,
    nom: 'Étal Mariam Fruits',
    note: 4.8,
    avis: 67,
    emoji: '🍌',
    categorie: 'Fruits',
    produits: [
      { id: 301, emoji: '🍌', nom: 'Bananes mûres',     prix: 500,  unite: 'régime',stock: 10 },
      { id: 302, emoji: '🍍', nom: 'Ananas frais',      prix: 600,  unite: 'pièce', stock: 5  },
      { id: 303, emoji: '🥭', nom: 'Mangues',           prix: 200,  unite: 'pièce', stock: 12 },
    ],
  },
  {
    id: 4,
    nom: 'Étal Kouassi Céréales',
    note: 4.5,
    avis: 44,
    emoji: '🌾',
    categorie: 'Céréales',
    produits: [
      { id: 401, emoji: '🌽', nom: 'Maïs local',        prix: 400,  unite: 'kg',   stock: 20 },
      { id: 402, emoji: '🍚', nom: 'Riz local',         prix: 600,  unite: 'kg',   stock: 15 },
      { id: 403, emoji: '🫘', nom: 'Haricots blancs',   prix: 350,  unite: 'kg',   stock: 8  },
    ],
  },
]

const CATEGORIES = ['Tout', 'Légumes', 'Poisson', 'Fruits', 'Céréales']

export default function Catalogue() {
  const navigate   = useNavigate()
  const { marcheId } = useParams()
  const marche     = MARCHES[marcheId] || MARCHES[1]

  const [recherche,  setRecherche]  = useState('')
  const [categorie,  setCategorie]  = useState('Tout')
  const [panier,     setPanier]     = useState({}) // { produitId: { ...prod, etalNom, qte } }
  const [toast,      setToast]      = useState('')

  /* ── Panier ──────────────────────────────────────────── */
  function ajouterAuPanier(prod, etal) {
    setPanier((prev) => {
      const existant = prev[prod.id]
      return {
        ...prev,
        [prod.id]: {
          ...prod,
          etalId:  etal.id,
          etalNom: etal.nom,
          qte:     existant ? existant.qte + 1 : 1,
        },
      }
    })
    setToast(`${prod.emoji} ${prod.nom} ajouté au panier`)
    setTimeout(() => setToast(''), 2000)
  }

  function retirerDuPanier(prodId) {
    setPanier((prev) => {
      const n = { ...prev }
      if (n[prodId]?.qte > 1) n[prodId] = { ...n[prodId], qte: n[prodId].qte - 1 }
      else delete n[prodId]
      return n
    })
  }

  const panierCount  = Object.values(panier).reduce((s, p) => s + p.qte, 0)
  const panierTotal  = Object.values(panier).reduce((s, p) => s + p.prix * p.qte, 0)

  /* ── Filtres ─────────────────────────────────────────── */
  const etalsFiltres = ETALS.filter((e) => {
    const matchCat  = categorie === 'Tout' || e.categorie === categorie
    const matchText = e.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      e.produits.some((p) => p.nom.toLowerCase().includes(recherche.toLowerCase()))
    return matchCat && matchText
  })

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        {/* Barre haut */}
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/client/accueil')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{marche.nom}</div>
            <div className="text-white/70 text-xs">
              📍 {marche.distance} · 🏪 {marche.etals} étals · ⭐ {marche.note}
            </div>
          </div>
          <button
            onClick={() => navigate('/client/panier')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-xl">🛒</span>
            {panierCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-black"
                style={{ background: '#E24B4A', fontSize: 9 }}
              >
                {panierCount}
              </div>
            )}
          </button>
        </div>

        {/* Recherche */}
        <div
          className="relative z-10 flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="text-base">🔍</span>
          <input
            type="text"
            placeholder="Chercher un produit ou étal…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: '#fff' }}
          />
          {recherche && (
            <button onClick={() => setRecherche('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
          )}
        </div>
      </div>

      {/* ══ FILTRES CATÉGORIES ══ */}
      <div className="px-4 py-3 overflow-x-auto bg-white" style={{ borderBottom: '1px solid #E8E6DF' }}>
        <div className="flex gap-2" style={{ width: 'max-content' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all"
              style={{
                background: categorie === cat ? '#1D9E75' : '#F7F8F3',
                color:      categorie === cat ? '#fff'    : '#5F5E5A',
                border:     `1.5px solid ${categorie === cat ? '#1D9E75' : '#E8E6DF'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ══ LISTE ÉTALS ══ */}
      <div className="px-4 py-4 flex flex-col gap-5">
        {etalsFiltres.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-bold text-sm" style={{ color: '#888780' }}>
              Aucun résultat pour "{recherche}"
            </p>
          </div>
        ) : (
          etalsFiltres.map((etal) => (
            <div
              key={etal.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1.5px solid #E8E6DF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              {/* En-tête étal */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#F7F8F3', borderBottom: '1px solid #E8E6DF' }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: '#E1F5EE' }}
                >
                  {etal.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{etal.nom}</div>
                  <div className="text-xs" style={{ color: '#888780' }}>
                    ⭐ {etal.note} · {etal.avis} avis
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: '#E1F5EE', color: '#0F6E56' }}
                >
                  {etal.categorie}
                </span>
              </div>

              {/* Grille produits */}
              <div className="grid grid-cols-2 gap-3 p-3">
                {etal.produits.map((prod) => {
                  const qteAuPanier = panier[prod.id]?.qte || 0
                  const stockFaible = prod.stock <= 3

                  return (
                    <div
                      key={prod.id}
                      className="rounded-xl p-3 flex flex-col"
                      style={{ background: '#FAFAF7', border: '1px solid #E8E6DF' }}
                    >
                      {/* Emoji produit */}
                      <div className="text-4xl text-center mb-2">{prod.emoji}</div>

                      {/* Nom */}
                      <div className="font-black text-xs mb-0.5 text-center" style={{ color: '#2C2C2A' }}>
                        {prod.nom}
                      </div>

                      {/* Prix */}
                      <div className="text-xs font-bold text-center mb-1" style={{ color: '#1D9E75' }}>
                        {prod.prix.toLocaleString()} F/{prod.unite}
                      </div>

                      {/* Stock */}
                      {stockFaible && (
                        <div className="text-center mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                            ⚠️ {prod.stock} restants
                          </span>
                        </div>
                      )}

                      {/* Bouton ajouter / compteur */}
                      {qteAuPanier === 0 ? (
                        <button
                          onClick={() => ajouterAuPanier(prod, etal)}
                          className="w-full py-2 rounded-xl text-white text-xs font-black cursor-pointer mt-auto"
                          style={{ background: '#1D9E75', border: 'none' }}
                        >
                          + Ajouter
                        </button>
                      ) : (
                        <div className="flex items-center justify-between mt-auto rounded-xl overflow-hidden" style={{ border: '1.5px solid #1D9E75' }}>
                          <button
                            onClick={() => retirerDuPanier(prod.id)}
                            className="w-8 h-8 flex items-center justify-center text-lg font-black cursor-pointer"
                            style={{ background: '#E1F5EE', border: 'none', color: '#0F6E56' }}
                          >
                            −
                          </button>
                          <span className="text-xs font-black flex-1 text-center" style={{ color: '#1D9E75' }}>
                            {qteAuPanier}
                          </span>
                          <button
                            onClick={() => ajouterAuPanier(prod, etal)}
                            className="w-8 h-8 flex items-center justify-center text-lg font-black cursor-pointer"
                            style={{ background: '#1D9E75', border: 'none', color: '#fff' }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ BARRE PANIER FLOTTANTE ══ */}
      {panierCount > 0 && (
        <div
          className="fixed left-4 right-4 z-40"
          style={{ bottom: 84 }}
        >
          <button
            onClick={() => navigate('/client/panier')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer"
            style={{
              background: '#1D9E75',
              boxShadow: '0 8px 32px rgba(29,158,117,0.45)',
              border: 'none',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
            >
              {panierCount}
            </div>
            <span className="text-white font-black text-sm">Voir mon panier</span>
            <span className="text-white font-black text-sm">
              {panierTotal.toLocaleString()} F →
            </span>
          </button>
        </div>
      )}

      {/* ══ TOAST ══ */}
      {toast && (
        <div
          className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl text-white text-sm font-bold text-center"
          style={{ background: '#2C2C2A', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          {toast}
        </div>
      )}

      <BottomNav panierCount={panierCount} />
    </div>
  )
}