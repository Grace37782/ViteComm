import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import BottomNav from '../../components/client/BottomNav'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
    'ndolè': '🥬', 'frais': '🍅', 'piment': '🌶️',
    'gombo': '🥬',
  }
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

// Custom Leaflet marker icons using divIcon
const createVendorIcon = (initial) => L.divIcon({
  html: `<div style="width:40px;height:40px;border-radius:50%;background:#F59E0B;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:15px;">${initial}</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

const createMarketCenterIcon = () => L.divIcon({
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#059669;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">🏛️</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

function MapRecenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 16)
  }, [center, map])
  return null
}

export default function MarcheDetail() {
  const navigate = useNavigate()
  const { marketId } = useParams()

  const [market, setMarket] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(null)

  const [recherche, setRecherche] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tout')
  const [activeVendor, setActiveVendor] = useState(null)

  // Stable offset coordinates for vendors without precise location
  const [vendorCoords, setVendorCoords] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const [marketRes, catsRes, cartRes] = await Promise.all([
          api.get('/client/markets/' + marketId),
          api.get('/client/categories'),
          api.get('/client/cart'),
        ])
        setMarket(marketRes)
        setCategories(catsRes)
        setCart(cartRes)

        // Assign stable coordinates for each vendor stall
        const coordsMap = {}
        marketRes.vendeurs.forEach((v, index) => {
          if (v.latitude && v.longitude) {
            coordsMap[v.id_user] = [v.latitude, v.longitude]
          } else {
            const angle = (index / Math.max(marketRes.vendeurs.length, 1)) * 2 * Math.PI
            const radius = 0.0007
            const lat = marketRes.latitude + Math.sin(angle) * radius
            const lng = marketRes.longitude + Math.cos(angle) * radius
            coordsMap[v.id_user] = [lat, lng]
          }
        })
        setVendorCoords(coordsMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [marketId])

  const panierCount = cart?.details?.reduce((s, d) => s + d.quantite, 0) || 0

  // Collect all products from all vendors in this market
  const allProducts = market?.vendeurs?.flatMap(v =>
    (v.produits || []).map(p => ({ ...p, vendeur: v }))
  ) || []

  // Filter products by search + category
  const productsFiltered = allProducts.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(recherche.toLowerCase()))
    const matchCat = selectedCategory === 'Tout' || p.categorie?.nom_categorie === selectedCategory
    return matchSearch && matchCat
  })

  // Filter vendors by search
  const vendorsFiltered = (market?.vendeurs || []).filter(v =>
    v.nom_etablissement.toLowerCase().includes(recherche.toLowerCase()) ||
    `${v.utilisateur.prenom} ${v.utilisateur.nom}`.toLowerCase().includes(recherche.toLowerCase())
  )

  const catList = ['Tout', ...categories.map(c => c.nom_categorie)]

  const goToVendorCatalogue = (vendeurId) => {
    // Pass market context via state so Catalogue can navigate back here
    navigate('/client/catalogue/' + vendeurId, {
      state: { fromMarket: marketId, marketName: market?.nom }
    })
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <div className="font-bold text-sm text-gray-500">Chargement de l'étal virtuel…</div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <div className="font-bold text-sm mb-4 text-gray-500">Marché introuvable</div>
          <button onClick={() => navigate('/client/accueil')} className="text-sm font-bold text-emerald-600 cursor-pointer">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">

      {/* Top Banner */}
      <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
        <img
          src={market.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80'}
          alt={market.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent" />

        <button
          onClick={() => navigate('/client/accueil')}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl flex items-center justify-center bg-black/45 border border-white/10 text-white text-lg font-bold cursor-pointer transition-all hover:bg-black/60"
        >
          ←
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600">
            🏛️ Marché Virtuel
          </span>
          <h1 className="text-lg font-black mt-1 leading-tight">{market.nom}</h1>
          <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{market.description}</p>
        </div>
      </div>

      {/* 🗺️ Market Stalls Map */}
      <div className="w-full h-64 relative shadow-inner border-b border-gray-200 flex-shrink-0">
        <MapContainer
          center={[market.latitude, market.longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={[market.latitude, market.longitude]} />

          {/* Market Centre pin */}
          <Marker position={[market.latitude, market.longitude]} icon={createMarketCenterIcon()} />

          {/* Vendor Stall Pins */}
          {market.vendeurs.map(v => {
            const pos = vendorCoords[v.id_user]
            if (!pos) return null
            const initial = v.nom_etablissement ? v.nom_etablissement.charAt(0).toUpperCase() : '🏪'

            return (
              <Marker
                key={v.id_user}
                position={pos}
                icon={createVendorIcon(initial)}
                eventHandlers={{
                  click: () => setActiveVendor(v)
                }}
              />
            )
          })}
        </MapContainer>

        {/* Vendor Popup Card on map tap */}
        {activeVendor && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-3 shadow-xl z-20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black text-base flex-shrink-0">
              {activeVendor.nom_etablissement.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-xs text-gray-800 truncate">{activeVendor.nom_etablissement}</p>
              <p className="text-[9px] text-gray-400 truncate">{activeVendor.localisation_marche}</p>
              <div className="flex gap-2 mt-0.5 text-[9px] font-bold">
                <span className="text-amber-600">⭐ {activeVendor.score_reputation.toFixed(1)}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">📦 {activeVendor._count?.produits || 0} articles</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setActiveVendor(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-xs cursor-pointer"
              >
                ✕
              </button>
              <button
                onClick={() => goToVendorCatalogue(activeVendor.id_user)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Visiter →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search + Filters */}
      <div className="px-5 mt-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl shadow-sm">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Filtrer étals ou produits dans ce marché..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs text-gray-700 font-medium placeholder-gray-400"
          />
          {recherche && (
            <button onClick={() => setRecherche('')} className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer">✕</button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="px-5 overflow-x-auto mt-3 flex-shrink-0">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {catList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-1.5 rounded-full text-[10px] font-bold cursor-pointer whitespace-nowrap transition-all"
              style={{
                background: selectedCategory === cat ? '#059669' : '#fff',
                color: selectedCategory === cat ? '#fff' : '#5F5E5A',
                border: `1.5px solid ${selectedCategory === cat ? '#059669' : '#E8E6DF'}`,
              }}
            >
              {cat === 'Tout' ? '🏠 Tout' : `${catEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* === Vendor Stalls Horizontal Scroll === */}
      <div className="px-5 mt-5">
        <h3 className="font-black text-gray-800 text-[11px] uppercase tracking-widest mb-2.5 flex items-center justify-between">
          <span>Étals dans ce marché</span>
          <span className="font-bold text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full normal-case">
            {vendorsFiltered.length} étals actifs
          </span>
        </h3>

        {vendorsFiltered.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-2xl border border-gray-150">
            <p className="text-[10px] font-bold text-gray-400">Aucun étal trouvé.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {vendorsFiltered.map(v => (
              <div
                key={v.id_user}
                onClick={() => goToVendorCatalogue(v.id_user)}
                className="flex-shrink-0 w-36 bg-white border border-gray-150 hover:border-amber-400 p-3 rounded-2xl cursor-pointer shadow-sm transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-base mb-2">
                  {v.nom_etablissement.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-[11px] text-gray-800 truncate leading-tight">{v.nom_etablissement}</h4>
                <p className="text-[9px] text-gray-400 truncate mt-0.5">
                  {v.utilisateur.prenom} {v.utilisateur.nom}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[9px] font-bold">
                  <span className="text-amber-600">⭐ {v.score_reputation.toFixed(1)}</span>
                  <span className="text-gray-400">{v._count?.produits || 0} art.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Market Products Grid === */}
      <div className="px-5 mt-6">
        <h3 className="font-black text-gray-800 text-[11px] uppercase tracking-widest mb-2.5 flex items-center justify-between">
          <span>Catalogue du Marché</span>
          <span className="font-bold text-[10px] text-gray-500 normal-case">{productsFiltered.length} article{productsFiltered.length !== 1 ? 's' : ''}</span>
        </h3>

        {productsFiltered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-150 shadow-sm">
            <span className="text-3xl">🔍</span>
            <p className="text-[10px] font-bold text-gray-400 mt-2">Aucun produit disponible dans ce marché.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {productsFiltered.map(p => (
              <div
                key={p.id_produit}
                onClick={() => goToVendorCatalogue(p.vendeur.id_user)}
                className="bg-white border border-gray-150 p-2.5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div className="text-center">
                  <div className="text-3xl mb-1.5">{productEmoji(p.nom)}</div>
                  <h4 className="font-extrabold text-[10px] text-gray-800 line-clamp-2 leading-tight">{p.nom}</h4>
                  <p className="text-[8px] text-gray-400 truncate mt-0.5">{p.vendeur?.nom_etablissement}</p>
                </div>

                <div className="mt-2 text-center pt-1.5 border-t border-gray-100">
                  <span className="text-[10px] font-black text-emerald-600 block">
                    {p.prix_reference.toLocaleString()} F
                  </span>
                  {p.categorie && (
                    <span className="text-[8px] text-gray-400 block">{catEmoji(p.categorie.nom_categorie)} {p.categorie.nom_categorie}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav panierCount={panierCount} />
    </div>
  )
}
