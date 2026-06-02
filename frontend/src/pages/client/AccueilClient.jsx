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

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

export default function AccueilClient() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [markets, setMarkets] = useState([])
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
        const [marketsRes, catsRes, prodsRes, cartRes] = await Promise.all([
          api.get('/client/markets'),
          api.get('/client/categories'),
          api.get('/client/products'),
          api.get('/client/cart'),
        ])
        setMarkets(marketsRes)
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

  function setPositionMock(city) {
    setGeoErreur('')
    if (city === 'douala') {
      setGeoPosition({ lat: 4.095, lng: 9.775 }) // Logbessou, Douala
    } else if (city === 'yaounde') {
      setGeoPosition({ lat: 3.896, lng: 11.511 }) // Bastos, Yaoundé
    }
  }

  const catList = ['Tout', ...categories.map((c) => c.nom_categorie)]

  // Calculate distances and sort markets
  const marketsWithDistance = markets.map(m => {
    if (geoPosition) {
      const dist = getDistanceKm(geoPosition.lat, geoPosition.lng, m.latitude, m.longitude)
      return { ...m, distance: dist }
    }
    return { ...m, distance: null }
  })

  const sortedMarkets = [...marketsWithDistance].sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance
    }
    return 0
  })

  const marketsFiltered = sortedMarkets.filter(m =>
    m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(recherche.toLowerCase()))
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
              <div className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
                📍 Position : {geoPosition.lat.toFixed(3)}, {geoPosition.lng.toFixed(3)}
              </div>
            ) : adresse ? (
              <div className="text-white/70 text-xs mt-0.5">🏠 {adresse}</div>
            ) : (
              <div className="text-white/70 text-xs mt-0.5">Cotonou</div>
            )}
          </div>
          <button
            onClick={() => navigate('/client/panier')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
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
            placeholder="Chercher un marché (localmart)..."
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

        {/* Boutons géoloc */}
        <div className="relative z-10 mt-3 flex flex-wrap gap-2">
          <button
            onClick={demanderPosition}
            disabled={geoLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-[10px] font-bold"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              opacity: geoLoading ? 0.7 : 1,
            }}
          >
            <span>{geoLoading ? '⏳' : '📍'}</span>
            {geoLoading ? 'Localisation...' : 'Ma position GPS'}
          </button>

          <button
            onClick={() => setPositionMock('douala')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-[10px] font-bold"
            style={{
              background: geoPosition?.lat === 4.095 ? '#fff' : 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: geoPosition?.lat === 4.095 ? '#0F6E56' : '#fff',
            }}
          >
            🏢 Douala (Logbessou)
          </button>

          <button
            onClick={() => setPositionMock('yaounde')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-[10px] font-bold"
            style={{
              background: geoPosition?.lat === 3.896 ? '#fff' : 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: geoPosition?.lat === 3.896 ? '#0F6E56' : '#fff',
            }}
          >
            🏢 Yaoundé (Bastos)
          </button>

          {geoErreur && (
            <p className="text-xs mt-1 w-full" style={{ color: '#FFD6D6' }}>⚠️ {geoErreur}</p>
          )}
        </div>
      </div>

      {/* ══ SECTION PRINCIPALE : MARCHÉS LOCAUX (LOCALMARTS) ══ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Marchés à proximité (Localmarts)
          </h2>
          <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
            {marketsFiltered.length} trouvé{marketsFiltered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {marketsFiltered.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-[#E8E6DF]">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm font-semibold" style={{ color: '#888780' }}>
              Aucun marché trouvé pour "{recherche}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {marketsFiltered.map((m) => (
              <button
                key={m.id_marche}
                onClick={() => navigate('/client/market/' + m.id_marche)}
                className="w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 active:scale-98 bg-white border border-[#E8E6DF]"
                style={{
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
              >
                <div className="h-32 w-full relative">
                  <img
                    src={m.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80'}
                    alt={m.nom}
                    className="w-full h-full object-cover"
                  />
                  {m.distance !== null && (
                    <div
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ background: 'rgba(15, 110, 86, 0.9)' }}
                    >
                      📍 {m.distance.toFixed(1)} km
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-base text-gray-800">{m.nom}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F6E56]">
                      {m._count.vendeurs} étal{m._count.vendeurs !== 1 ? 's' : ''} actif{m._count.vendeurs !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══ FILTRES CATÉGORIES ══ */}
      {categories.length > 0 && (
        <div className="px-4 mb-4 overflow-x-auto mt-6">
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

      {/* ══ PRODUITS POPULAIRES ══ */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            {categorie === 'Tout' ? 'Produits populaires' : `Produits · ${categorie}`}
          </h2>
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
                className="rounded-2xl p-3 text-center cursor-pointer bg-white border border-[#E8E6DF] transition-all hover:shadow-md active:scale-95 flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-2">{productEmoji(p.nom)}</div>
                  <div className="font-black text-[10px] mb-0.5 text-gray-800 line-clamp-2">{p.nom}</div>
                  <div className="text-xs font-bold text-emerald-600">{formatPrice(p.prix_reference)}</div>
                </div>
                <div className="text-[9px] text-gray-400 mt-2 line-clamp-1 border-t border-gray-50 pt-1">
                  {p.vendeur?.localisation_marche || ''}
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
