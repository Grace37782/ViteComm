import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../../services/api'

const CATEGORY_EMOJI = {
  'Légumes': '🥬',
  'Épices & Condiments': '🌶️',
  'Huiles & Matières Grasses': '🫒',
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

export default function Catalogue() {
  const navigate = useNavigate()
  const location = useLocation()
  const { vendeurId } = useParams()

  // If navigated from a market, we can go back to it
  const fromMarket = location.state?.fromMarket
  const marketName = location.state?.marketName
  const handleBack = () => {
    if (fromMarket) {
      navigate('/client/market/' + fromMarket)
    } else {
      navigate('/client/accueil')
    }
  }

  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cartItems, setCartItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('Tout')

  useEffect(() => {
    async function load() {
      try {
        const [vendorRes, prodsRes, catsRes, cartRes] = await Promise.all([
          api.get('/client/vendors/' + vendeurId),
          api.get('/client/products?vendeur_id=' + vendeurId),
          api.get('/client/categories'),
          api.get('/client/cart'),
        ])
        setVendor(vendorRes)
        setProducts(prodsRes)
        setCategories(catsRes)

        const cartMap = {}
        if (cartRes?.details) {
          for (const d of cartRes.details) {
            if (d.produit.id_user_vendeur === parseInt(vendeurId)) {
              cartMap[d.id_produit] = d.quantite
            }
          }
        }
        setCartItems(cartMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [vendeurId])

  async function ajouterAuPanier(prod) {
    const newQte = (cartItems[prod.id_produit] || 0) + 1
    try {
      await api.post('/client/cart/item', { id_produit: prod.id_produit, quantite: newQte })
      setCartItems(prev => ({ ...prev, [prod.id_produit]: newQte }))
      setToast(`✅ ${prod.nom} ajouté au panier`)
    } catch (err) {
      setToast(`❌ ${err.message}`)
    }
    setTimeout(() => setToast(''), 2000)
  }

  async function retirerDuPanier(prod) {
    const newQte = (cartItems[prod.id_produit] || 0) - 1
    try {
      await api.post('/client/cart/item', { id_produit: prod.id_produit, quantite: Math.max(0, newQte) })
      setCartItems(prev => {
        const n = { ...prev }
        if (newQte <= 0) delete n[prod.id_produit]
        else n[prod.id_produit] = newQte
        return n
      })
    } catch (err) {
      setToast(`❌ ${err.message}`)
    }
    setTimeout(() => setToast(''), 2000)
  }

  const panierCount = Object.values(cartItems).reduce((s, q) => s + q, 0)
  const panierTotal = products.reduce((s, p) => s + (cartItems[p.id_produit] || 0) * p.prix_reference, 0)

  const catList = ['Tout', ...categories.map((c) => c.nom_categorie)]

  const productsFiltered = products.filter((p) => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase())
    const catName = categories.find((c) => c.id_categorie === p.id_categorie)?.nom_categorie || ''
    const matchCat = categorie === 'Tout' || catName === categorie
    return matchRecherche && matchCat
  })

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <div className="font-bold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Étal introuvable</div>
          <button onClick={() => navigate('/client/accueil')} className="text-sm font-bold cursor-pointer" style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{vendor.nom_etablissement}</div>
            <div className="text-white/70 text-xs">
              {fromMarket && <span>🏛️ {marketName} · </span>}
              📍 {vendor.localisation_marche} · 🏪 {vendor._count.produits} produit{vendor._count.produits !== 1 ? 's' : ''} · ⭐ {vendor.score_reputation.toFixed(1)}
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
            placeholder="Chercher un produit…"
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
      {categories.length > 0 && (
        <div className="px-4 py-3 overflow-x-auto bg-white" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {catList.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all"
                style={{
                  background: categorie === cat ? '#1D9E75' : 'var(--surface-alt)',
                  color: categorie === cat ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${categorie === cat ? '#1D9E75' : 'var(--border)'}`,
                }}
              >
                {cat === 'Tout' ? '🏠 Tous' : `${CATEGORY_EMOJI[cat] || '📦'} ${cat}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ GRILLE PRODUITS ══ */}
      <div className="px-4 py-4">
        {productsFiltered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
              Aucun produit trouvé{recherche ? ` pour "${recherche}"` : ''}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productsFiltered.map((prod) => {
              const qteAuPanier = cartItems[prod.id_produit] || 0
              const stockFaible = prod.stock_disponible <= 3

              return (
                <div
                  key={prod.id_produit}
                  className="rounded-xl p-3 flex flex-col"
                  style={{ background: '#fff', border: '1.5px solid var(--border)' }}
                >
                  {/* Emoji produit */}
                  <div className="text-4xl text-center mb-2">{productEmoji(prod.nom)}</div>

                  {/* Nom */}
                  <div className="font-black text-xs mb-0.5 text-center" style={{ color: 'var(--text-primary)' }}>
                    {prod.nom}
                  </div>

                  {/* Prix */}
                  <div className="text-xs font-bold text-center mb-1" style={{ color: '#1D9E75' }}>
                    {formatPrice(prod.prix_reference)}
                  </div>

                  {/* Catégorie */}
                  <div className="text-center mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      {prod.categorie?.nom_categorie || ''}
                    </span>
                  </div>

                  {/* Stock faible */}
                  {stockFaible && (
                    <div className="text-center mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                        ⚠️ {prod.stock_disponible} restant{prod.stock_disponible !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Bouton ajouter / compteur */}
                  {qteAuPanier === 0 ? (
                    <button
                      onClick={() => ajouterAuPanier(prod)}
                      className="w-full py-2 rounded-xl text-white text-xs font-black cursor-pointer mt-auto"
                      style={{ background: '#1D9E75', border: 'none' }}
                    >
                      + Ajouter
                    </button>
                  ) : (
                    <div className="flex items-center justify-between mt-auto rounded-xl overflow-hidden" style={{ border: '1.5px solid #1D9E75' }}>
                      <button
                        onClick={() => retirerDuPanier(prod)}
                        className="w-8 h-8 flex items-center justify-center text-lg font-black cursor-pointer"
                        style={{ background: '#E1F5EE', border: 'none', color: '#0F6E56' }}
                      >
                        −
                      </button>
                      <span className="text-xs font-black flex-1 text-center" style={{ color: '#1D9E75' }}>
                        {qteAuPanier}
                      </span>
                      <button
                        onClick={() => ajouterAuPanier(prod)}
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
        )}
      </div>

      {/* ══ BARRE PANIER FLOTTANTE ══ */}
      {panierCount > 0 && (
        <div className="fixed left-4 right-4 z-40" style={{ bottom: 84 }}>
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

    </div>
  )
}
