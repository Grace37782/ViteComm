import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import BottomNav from '../../components/client/BottomNav'

const CATEGORY_EMOJI = {
  'Légumes': '🥬',
  'Épices & Condiments': '🌶️',
  'Huiles & Matières Grasses': '🫒',
}

function catEmoji(name) {
  return CATEGORY_EMOJI[name] || '📦'
}

function productEmoji(name) {
  const map = {
    'tomate': '🍅', 'piment': '🌶️', 'oignon': '🧅',
    'banane': '🍌', 'poisson': '🐟', 'épice': '🌶️',
    'huile': '🫒', 'palme': '🌴', 'crevette': '🦐',
    'tilapia': '🐠', 'maïs': '🌽', 'riz': '🍚',
    'haricot': '🫘', 'gombo': '🥬', 'mangue': '🥭',
    'ananas': '🍍', 'pain': '🍞', 'œuf': '🥚', 'poulet': '🍗',
    'ndolè': '🥬', 'frais': '🍅',
  }
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

function formatPrice(price) {
  return price.toLocaleString() + ' F'
}

export default function AccueilClient() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('Tout')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoPosition, setGeoPosition] = useState(null)
  const [geoErreur, setGeoErreur] = useState('')

  const prenom = user?.prenom || 'Client'
  const adresse = user?.profil?.adresse_livraison || null
  const panierCount = cart?.details?.reduce((s, d) => s + d.quantite, 0) || 0

  useEffect(() => {
    async function loadData() {
      try {
        const [vendorsRes, catsRes, prodsRes, cartRes] = await Promise.all([
          api.get('/client/vendors'),
          api.get('/client/categories'),
          api.get('/client/products'),
          api.get('/client/cart'),
        ])
        setVendors(vendorsRes)
        setCategories(catsRes)
        setAllProducts(prodsRes)
        setCart(cartRes)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function demanderPosition() {
    if (!navigator.geolocation) {
      setGeoErreur('Géolocalisation non disponible sur cet appareil.')
      return
    }
    setGeoLoading(true)
    setGeoErreur('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => {
        setGeoErreur("Impossible d'obtenir votre position.")
        setGeoLoading(false)
      }
    )
  }

  const catList = ['Tout', ...categories.map((c) => c.nom_categorie)]

  // Vendors: filter by text search only (vendors have no single category)
  const vendorsFiltered = vendors.filter((v) =>
    v.nom_etablissement.toLowerCase().includes(recherche.toLowerCase()) ||
    v.localisation_marche.toLowerCase().includes(recherche.toLowerCase())
  )

  // Popular products: filter by selected category chip
  const popularProducts = allProducts
    .filter((p) => {
      if (categorie === 'Tout') return true
      return p.categorie?.nom_categorie === categorie
    })
    .slice(0, 6)

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: '#F7F8F3' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-bold text-sm" style={{ color: '#888780' }}>Chargement…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 72 }}>
      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-black text-lg leading-tight">
              Bonjour {prenom} 👋
            </div>
            {geoPosition ? (
              <div className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                📍 Position détectée
              </div>
            ) : adresse ? (
              <div className="text-white/70 text-xs mt-0.5">{adresse}</div>
            ) : (
              <div className="text-white/70 text-xs mt-0.5">Cotonou</div>
            )}
          </div>
          <button
            onClick={() => navigate('/client/panier')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-xl">🛒</span>
            {panierCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white font-black flex items-center justify-center"
                style={{ background: '#E24B4A', fontSize: 9 }}
              >
                {panierCount}
              </div>
            )}
          </button>
        </div>

        {/* Barre de recherche */}
        <div
          className="relative z-10 flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="text-base">🔍</span>
          <input
            type="text"
            placeholder="Chercher un étal ou marché…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: '#fff' }}
          />
          {recherche && (
            <button
              onClick={() => setRecherche('')}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Bouton géoloc */}
        <div className="relative z-10 mt-3">
          <button
            onClick={demanderPosition}
            disabled={geoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-xs font-semibold"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              opacity: geoLoading ? 0.7 : 1,
            }}
          >
            <span>{geoLoading ? '⏳' : '📍'}</span>
            {geoLoading ? 'Localisation en cours…' : geoPosition ? 'Position détectée ✓' : 'Utiliser ma position'}
          </button>
          {geoErreur && (
            <p className="text-xs mt-1.5" style={{ color: '#FFD6D6' }}>⚠️ {geoErreur}</p>
          )}
        </div>
      </div>

      {/* ══ FILTRES CATÉGORIES ══ */}
      {categories.length > 0 && (
        <div className="px-4 mb-4 overflow-x-auto mt-4">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {catList.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all"
                style={{
                  background: categorie === cat ? '#1D9E75' : '#fff',
                  color: categorie === cat ? '#fff' : '#5F5E5A',
                  border: `1.5px solid ${categorie === cat ? '#1D9E75' : '#E8E6DF'}`,
                }}
              >
                {cat === 'Tout' ? '🏠 Tous' : `${catEmoji(cat)} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ ÉTALS / VENDEURS ══ */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Étals disponibles
          </h2>
          <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
            {vendorsFiltered.length} trouvé{vendorsFiltered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {vendorsFiltered.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm font-semibold" style={{ color: '#888780' }}>
              Aucun étal trouvé pour "{recherche}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {vendorsFiltered.map((v) => (
              <button
                key={v.id_user}
                onClick={() => navigate('/client/catalogue/' + v.id_user)}
                className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-98"
                style={{
                  background: '#fff',
                  border: '1.5px solid #E8E6DF',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 font-black"
                    style={{ background: '#E1F5EE', color: '#0F6E56' }}
                  >
                    {v.nom_etablissement.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-black text-sm truncate" style={{ color: '#2C2C2A' }}>
                        {v.nom_etablissement}
                      </h3>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: '#E1F5EE',
                          color: '#0F6E56',
                        }}
                      >
                        🏪 {v._count.produits} produit{v._count.produits !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
                        📍 {v.localisation_marche}
                      </span>
                      <span className="text-xs" style={{ color: '#888780' }}>
                        ⭐ {v.score_reputation.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: '#F7F8F3', color: '#5F5E5A' }}
                      >
                        {v.utilisateur.prenom} {v.utilisateur.nom}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══ PRODUITS POPULAIRES ══ */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            {categorie === 'Tout' ? 'Produits populaires' : `Produits · ${categorie}`}
          </h2>
          {vendors[0] && (
            <button
              onClick={() => navigate('/client/catalogue/' + vendors[0].id_user)}
              className="text-xs font-semibold cursor-pointer"
              style={{ color: '#1D9E75', background: 'none', border: 'none' }}
            >
              Voir tout →
            </button>
          )}
        </div>

        {popularProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm font-semibold" style={{ color: '#888780' }}>
              Aucun produit dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {popularProducts.map((p) => (
              <button
                key={p.id_produit}
                onClick={() => navigate('/client/catalogue/' + p.id_user_vendeur)}
                className="rounded-2xl p-3 text-center cursor-pointer transition-all hover:shadow-md active:scale-95"
                style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
              >
                <div className="text-3xl mb-2">{productEmoji(p.nom)}</div>
                <div className="font-black text-xs mb-0.5" style={{ color: '#2C2C2A' }}>{p.nom}</div>
                <div className="text-xs font-medium" style={{ color: '#1D9E75' }}>{formatPrice(p.prix_reference)}</div>
                <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                  {p.categorie?.nom_categorie || p.vendeur?.localisation_marche || ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav panierCount={panierCount} />
    </div>
  )
}
