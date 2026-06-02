import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import BottomNav from '../../components/client/BottomNav'

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

export default function MarcheDetail() {
  const navigate = useNavigate()
  const { marketId } = useParams()

  const [market, setMarket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [cart, setCart] = useState(null)
  const [marketProducts, setMarketProducts] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [marketRes, prodsRes, cartRes] = await Promise.all([
          api.get('/client/markets/' + marketId),
          api.get('/client/products'), // to show products in this market
          api.get('/client/cart'),
        ])
        setMarket(marketRes)
        setCart(cartRes)
        
        // Filter products that belong to sellers in this market
        const vendorIds = marketRes.vendeurs.map(v => v.id_user)
        const filteredProds = prodsRes.filter(p => vendorIds.includes(p.id_user_vendeur))
        setMarketProducts(filteredProds)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [marketId])

  const panierCount = cart?.details?.reduce((s, d) => s + d.quantite, 0) || 0

  const vendorsFiltered = market?.vendeurs?.filter((v) =>
    v.nom_etablissement.toLowerCase().includes(recherche.toLowerCase()) ||
    `${v.utilisateur.prenom} ${v.utilisateur.nom}`.toLowerCase().includes(recherche.toLowerCase())
  ) || []

  const productsFiltered = marketProducts.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.description.toLowerCase().includes(recherche.toLowerCase())
  )

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: '#F7F8F3' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-bold text-sm" style={{ color: '#888780' }}>Chargement du marché…</div>
        </div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: '#F7F8F3' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <div className="font-bold text-sm mb-4" style={{ color: '#888780' }}>Marché introuvable</div>
          <button
            onClick={() => navigate('/client/accueil')}
            className="text-sm font-bold cursor-pointer"
            style={{ color: '#1D9E75', background: 'none', border: 'none' }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={market.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80'}
          alt={market.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/client/accueil')}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer text-white text-lg font-bold"
          style={{ background: 'rgba(0,0,0,0.5)', border: 'none' }}
        >
          ←
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600">
            📍 Localmart
          </span>
          <h1 className="text-xl font-black mt-1 leading-tight">{market.nom}</h1>
          <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{market.description}</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="px-4 mt-4">
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          <span className="text-base">🔍</span>
          <input
            type="text"
            placeholder="Chercher un étal ou un produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: '#2C2C2A' }}
          />
          {recherche && (
            <button
              onClick={() => setRecherche('')}
              style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sellers List */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Étals disponibles ({vendorsFiltered.length})
          </h2>
        </div>

        {vendorsFiltered.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-2xl border border-gray-200">
            <div className="text-3xl mb-2">🏪</div>
            <p className="text-xs font-semibold text-gray-400">
              Aucun étal ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {vendorsFiltered.map((v) => (
              <button
                key={v.id_user}
                onClick={() => navigate('/client/catalogue/' + v.id_user)}
                className="w-full text-left rounded-2xl p-4 bg-white border border-gray-200 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-98"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
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
                      <h3 className="font-black text-sm truncate text-gray-800">
                        {v.nom_etablissement}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        🏪 {v._count.produits} articles
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-emerald-600">
                        📍 {v.localisation_marche}
                      </span>
                      <span className="text-xs text-gray-400">
                        ⭐ {v.score_reputation.toFixed(1)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Gérant : {v.utilisateur.prenom} {v.utilisateur.nom}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products List inside this market */}
      <div className="px-4 mt-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Produits dans ce marché ({productsFiltered.length})
          </h2>
        </div>

        {productsFiltered.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-2xl border border-gray-200">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-xs font-semibold text-gray-400">
              Aucun produit dans ce marché pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productsFiltered.map((p) => (
              <button
                key={p.id_produit}
                onClick={() => navigate('/client/catalogue/' + p.id_user_vendeur)}
                className="rounded-2xl p-3 text-center bg-white border border-gray-200 cursor-pointer transition-all hover:shadow-md active:scale-95 flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-2">{productEmoji(p.nom)}</div>
                  <div className="font-black text-xs mb-0.5 text-gray-800 line-clamp-2">{p.nom}</div>
                  <div className="text-xs font-bold text-emerald-600">{p.prix_reference.toLocaleString()} F</div>
                </div>
                <div className="text-[10px] mt-2 text-gray-400 border-t border-gray-100 pt-1">
                  Étal: {p.vendeur?.nom_etablissement}
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
