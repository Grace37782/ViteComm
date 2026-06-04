import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/client/BottomNav'

const FRAIS_LIVRAISON = 1500
const COMMISSION_RATE = 0.006

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

export default function Panier() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [cart, setCart]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')

  /* ── Load cart ─────────────────────────────────────── */
  useEffect(() => {
    api.get('/client/cart')
      .then(setCart)
      .catch(err => showToast('❌ ' + err.message))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  /* ── Cart actions ───────────────────────────────────── */
  async function setQte(id_produit, newQte) {
    try {
      await api.post('/client/cart/item', { id_produit, quantite: newQte })
      const updated = await api.get('/client/cart')
      setCart(updated)
    } catch (err) {
      showToast('❌ ' + err.message)
    }
  }

  async function viderPanier() {
    try {
      await api.delete('/client/cart')
      setCart({ details: [] })
    } catch (err) {
      showToast('❌ ' + err.message)
    }
  }

  /* ── Derived data ───────────────────────────────────── */
  const details    = cart?.details || []
  const panierCount = details.reduce((s, d) => s + d.quantite, 0)
  const sousTotal  = details.reduce((s, d) => s + d.produit.prix_reference * d.quantite, 0)
  const commission = Math.round(sousTotal * COMMISSION_RATE)
  const total      = sousTotal + FRAIS_LIVRAISON

  // Group by vendor
  const parVendeur = details.reduce((acc, d) => {
    const vid  = d.produit.id_user_vendeur
    const vnom = d.produit.vendeur?.nom_etablissement || `Vendeur ${vid}`
    if (!acc[vid]) acc[vid] = { nom: vnom, items: [] }
    acc[vid].items.push(d)
    return acc
  }, {})

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8F3' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 700, color: '#888780', fontSize: 13 }}>Chargement du panier…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#2C2C2A', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/accueil')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">Mon panier</div>
            <div className="text-white/70 text-xs">
              {panierCount} article{panierCount > 1 ? 's' : ''} · {Object.keys(parVendeur).length} étal{Object.keys(parVendeur).length > 1 ? 's' : ''}
            </div>
          </div>
          {panierCount > 0 && (
            <button
              onClick={viderPanier}
              className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Vider
            </button>
          )}
        </div>
      </div>

      {/* EMPTY */}
      {details.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-black text-lg mb-2" style={{ color: '#2C2C2A' }}>Votre panier est vide</h2>
          <p className="text-sm mb-6" style={{ color: '#888780' }}>
            Ajoutez des produits depuis les catalogues des marchés.
          </p>
          <button
            onClick={() => navigate('/client/accueil')}
            className="px-6 py-3 rounded-2xl text-white font-black cursor-pointer"
            style={{ background: '#1D9E75', border: 'none' }}
          >
            Explorer les marchés →
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* ARTICLES PAR ÉTAL */}
          {Object.entries(parVendeur).map(([vid, etal]) => (
            <div key={vid} className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1.5px solid #E8E6DF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: '#F7F8F3', borderBottom: '1px solid #E8E6DF' }}>
                <span className="text-lg">🏪</span>
                <span className="font-black text-sm flex-1" style={{ color: '#2C2C2A' }}>{etal.nom}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                  {etal.items.length} article{etal.items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col divide-y" style={{ borderColor: '#F1EFE8' }}>
                {etal.items.map((d) => (
                  <div key={d.id_produit} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: '#F7F8F3' }}>
                      📦
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: '#2C2C2A' }}>{d.produit.nom}</div>
                      <div className="text-xs font-medium" style={{ color: '#1D9E75' }}>
                        {formatPrice(d.produit.prix_reference)} / unité
                      </div>
                    </div>

                    {/* Counter */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQte(d.id_produit, d.quantite - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black cursor-pointer text-sm"
                        style={{ background: '#F1EFE8', border: 'none', color: '#5F5E5A' }}>−</button>
                      <span className="w-6 text-center font-black text-sm" style={{ color: '#2C2C2A' }}>{d.quantite}</span>
                      <button onClick={() => setQte(d.id_produit, d.quantite + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer"
                        style={{ background: '#1D9E75', border: 'none', color: '#fff' }}>+</button>
                    </div>

                    <div className="text-right ml-2 flex-shrink-0">
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                        {formatPrice(d.produit.prix_reference * d.quantite)}
                      </div>
                      <button onClick={() => setQte(d.id_produit, 0)}
                        className="text-xs cursor-pointer mt-0.5"
                        style={{ color: '#E24B4A', background: 'none', border: 'none' }}>Retirer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* MODE PAIEMENT */}
          <div className="rounded-2xl p-4" style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#BA7517' }}>💵</div>
              <div>
                <div className="font-black text-sm" style={{ color: '#854F0B' }}>Paiement à la livraison</div>
                <div className="text-xs" style={{ color: '#854F0B' }}>Vous payez en espèces quand vous recevez vos articles</div>
              </div>
              <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#BA7517' }}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>
              </div>
            </div>
          </div>

          {/* RÉCAPITULATIF */}
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
            <h3 className="font-black text-sm mb-3" style={{ color: '#2C2C2A' }}>Récapitulatif</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Sous-total ({panierCount} articles)</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{formatPrice(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Frais de livraison</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{formatPrice(FRAIS_LIVRAISON)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Commission plateforme (0,6%)</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{formatPrice(commission)}</span>
              </div>
              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1.5px solid #E8E6DF' }}>
                <span className="font-black text-base" style={{ color: '#2C2C2A' }}>Total à payer</span>
                <span className="font-black text-base" style={{ color: '#1D9E75' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* BOUTON COMMANDER */}
          <button
            onClick={() => navigate('/client/selection-livreur', { state: { cart, total, sousTotal } })}
            className="w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all active:scale-98"
            style={{ background: '#1D9E75', border: 'none', boxShadow: '0 6px 24px rgba(29,158,117,0.4)' }}
          >
            Choisir un livreur — {formatPrice(total)} →
          </button>

          <p className="text-center text-xs pb-2" style={{ color: '#888780' }}>
            🔒 Paiement sécurisé · Vous inspectez avant de payer
          </p>

        </div>
      )}

      <BottomNav panierCount={panierCount} />
    </div>
  )
}