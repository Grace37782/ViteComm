import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Package, Loader2, XCircle, Building2, Search, Star, MapPin, Home, Leaf, Flame, Droplets, Wheat, Fish, Egg, Beef, Apple } from 'lucide-react'

const CATEGORY_ICONS = {
  'Légumes': Leaf,
  'Épices & Condiments': Flame,
  'Huiles & Matières Grasses': Droplets,
}

function catIcon(name) {
  return CATEGORY_ICONS[name] || Package
}

function productIcon(name) {
  const map = {
    'tomate': Apple, 'piment': Flame, 'oignon': Leaf,
    'banane': Package, 'poisson': Fish, 'épice': Flame,
    'huile': Droplets, 'palme': Leaf, 'crevette': Package,
    'tilapia': Fish, 'maïs': Wheat, 'riz': Wheat,
    'haricot': Leaf, 'gombo': Leaf, 'mangue': Apple,
    'ananas': Package, 'pain': Package, 'œuf': Egg, 'poulet': Beef,
    'ndolè': Leaf, 'frais': Apple,
  }
  const lower = name.toLowerCase()
  for (const [key, Icon] of Object.entries(map)) {
    if (lower.includes(key)) return Icon
  }
  return Package
}

const createVendorIcon = (initial) => L.divIcon({
  html: `<div style="width:40px;height:40px;border-radius:50%;background:#F59E0B;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:15px;">${initial}</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

const createMarketCenterIcon = () => L.divIcon({
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#059669;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>`,
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
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

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
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="mb-3 flex justify-center"><Loader2 size={32} className="animate-spin" /></div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Chargement de l'étal virtuel…</div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="mb-3 flex justify-center"><XCircle size={32} /></div>
          <div className="font-bold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Marché introuvable</div>
          <button onClick={() => navigate('/client/accueil')} className="text-sm font-bold text-emerald-600 cursor-pointer">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col pb-20" style={{ background: 'var(--bg)' }}>
      <style>{`#marche-search::placeholder { color: var(--text-muted); opacity: 0.7; }`}</style>

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
            <Building2 size={10} className="inline align-middle" /> Marché Virtuel
          </span>
          <h1 className="text-lg font-black mt-1 leading-tight">{market.nom}</h1>
          <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{market.description}</p>
        </div>
      </div>

      {/* Market Stalls Map */}
      <div className="w-full h-64 relative shadow-inner border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
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
            const initial = v.nom_etablissement ? v.nom_etablissement.charAt(0).toUpperCase() : 'V'

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
          <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md rounded-2xl p-3 shadow-xl z-20 flex items-center gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: isDark ? 'rgba(243,168,59,0.12)' : '#FEF3C7', color: isDark ? '#F3A83B' : '#D97706' }}>
              {activeVendor.nom_etablissement.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{activeVendor.nom_etablissement}</p>
              <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{activeVendor.localisation_marche}</p>
              <div className="flex gap-2 mt-0.5 text-[9px] font-bold">
                <span className="text-amber-600"><Star size={10} className="inline align-middle" /> {activeVendor.score_reputation.toFixed(1)}</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-muted)' }}><Package size={10} className="inline align-middle" /> {activeVendor._count?.produits || 0} articles</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setActiveVendor(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6', color: 'var(--text-muted)' }}
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
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}><Search size={14} /></span>
          <input
            id="marche-search"
            type="text"
            placeholder="Filtrer étals ou produits dans ce marché..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          />
          {recherche && (
            <button onClick={() => setRecherche('')} className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>✕</button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="px-5 overflow-x-auto mt-3 flex-shrink-0">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {catList.map(cat => {
            const Icon = cat === 'Tout' ? Home : catIcon(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-full text-[10px] font-bold cursor-pointer whitespace-nowrap transition-all"
                style={{
                  background: selectedCategory === cat ? '#059669' : (isDark ? 'rgba(255,255,255,0.06)' : '#fff'),
                  color: selectedCategory === cat ? '#fff' : (isDark ? '#9CA3AF' : '#5F5E5A'),
                  border: `1.5px solid ${selectedCategory === cat ? '#059669' : 'var(--border)'}`,
                }}
              >
                <Icon size={12} className="inline align-middle" /> {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* === Vendor Stalls Horizontal Scroll === */}
      <div className="px-5 mt-5">
        <h3 className="font-black text-[11px] uppercase tracking-widest mb-2.5 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span>Étals dans ce marché</span>
          <span className="font-bold text-[10px] text-emerald-600 px-2.5 py-0.5 rounded-full normal-case" style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#ECFDF5' }}>
            {vendorsFiltered.length} étals actifs
          </span>
        </h3>

        {vendorsFiltered.length === 0 ? (
          <div className="text-center py-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Aucun étal trouvé.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {vendorsFiltered.map(v => (
              <div
                key={v.id_user}
                onClick={() => goToVendorCatalogue(v.id_user)}
                className="flex-shrink-0 w-36 hover:border-amber-400 p-3 rounded-2xl cursor-pointer shadow-sm transition-all hover:shadow-md"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base mb-2" style={{ background: isDark ? 'rgba(243,168,59,0.12)' : '#FEF3C7', color: isDark ? '#F3A83B' : '#D97706' }}>
                  {v.nom_etablissement.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-[11px] truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{v.nom_etablissement}</h4>
                <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {v.utilisateur.prenom} {v.utilisateur.nom}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 text-[9px] font-bold" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-amber-600"><Star size={10} className="inline align-middle" /> {v.score_reputation.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{v._count?.produits || 0} art.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Market Products Grid === */}
      <div className="px-5 mt-6">
        <h3 className="font-black text-[11px] uppercase tracking-widest mb-2.5 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span>Catalogue du Marché</span>
          <span className="font-bold text-[10px] normal-case" style={{ color: 'var(--text-muted)' }}>{productsFiltered.length} article{productsFiltered.length !== 1 ? 's' : ''}</span>
        </h3>

        {productsFiltered.length === 0 ? (
          <div className="text-center py-10 rounded-2xl shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-3xl flex justify-center"><Search size={24} /></span>
            <p className="text-[10px] font-bold mt-2" style={{ color: 'var(--text-muted)' }}>Aucun produit disponible dans ce marché.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {productsFiltered.map(p => {
              const PIcon = productIcon(p.nom);
              return (
                <div
                  key={p.id_produit}
                  onClick={() => goToVendorCatalogue(p.vendeur.id_user)}
                  className="p-2.5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="text-center">
                    <div className="mb-1.5 flex justify-center"><PIcon size={24} /></div>
                    <h4 className="font-extrabold text-[10px] line-clamp-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{p.nom}</h4>
                    <p className="text-[8px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.vendeur?.nom_etablissement}</p>
                  </div>

                  <div className="mt-2 text-center pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-[10px] font-black text-emerald-600 block">
                      {p.prix_reference.toLocaleString()} F
                    </span>
                    {p.categorie && (() => {
                      const CIcon = catIcon(p.categorie.nom_categorie);
                      return <span className="text-[8px] block" style={{ color: 'var(--text-muted)' }}><CIcon size={10} className="inline align-middle" /> {p.categorie.nom_categorie}</span>;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  )
}
