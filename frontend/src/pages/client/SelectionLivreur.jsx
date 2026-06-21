import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Loader2, XCircle, Star, Car, Motorbike, Frown, ChevronDown, Banknote } from 'lucide-react'

const PAGE_SIZE = 10

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

export default function SelectionLivreur() {
  const { resolved } = useTheme(); const isDark = resolved === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const stateCart = location.state?.cart
  const stateTotal = location.state?.total
  const stateSousTotal = location.state?.sousTotal

  const [drivers, setDrivers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [livreurId, setLivreurId] = useState(null)
  const [placing, setPlacing]   = useState(false)
  const [toast, setToast]       = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cart, setCart] = useState(stateCart || null)

  const FRAIS_LIVRAISON = 1500
  const sousTotal = stateSousTotal || cart?.details?.reduce((s, d) => s + (d.produit?.prix_reference || 0) * d.quantite, 0) || 0
  // eslint-disable-next-line no-unused-vars
  const totalMarchandises = stateTotal || sousTotal

  useEffect(() => {
    const promises = [api.get('/client/drivers').then(setDrivers)]
    if (!stateCart) {
      promises.push(api.get('/client/cart').then(setCart))
    }
    Promise.all(promises)
      .catch(err => showToast(<><XCircle size={14} style={{verticalAlign: 'middle', marginRight: 4}} />{err.message}</>))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function confirmerCommande() {
    if (!livreurId) return
    setPlacing(true)
    try {
      const details = cart?.details || []
      const items = details.map(d => ({
        id_produit: d.id_produit,
        quantite_commandee: d.quantite,
      }))

      const orderRes = await api.post('/client/orders', {
        id_user_livreur: livreurId,
        items,
      })

      navigate('/client/suivi-commande', {
        state: {
          id_commande: orderRes.id_commande,
          code_verification: orderRes.code_verification,
          livreur: drivers.find(d => d.id_user === livreurId),
        }
      })
    } catch (err) {
      showToast(<><XCircle size={14} style={{verticalAlign: 'middle', marginRight: 4}} />{err.message}</>)
      setPlacing(false)
    }
  }

  const livreurSelected = drivers.find(d => d.id_user === livreurId)
  const totalFinal = (sousTotal || 0) + FRAIS_LIVRAISON

  const visibleItems = drivers.slice(0, visibleCount)
  const hasMore = visibleCount < drivers.length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><Motorbike size={40} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13 }}>Recherche des livreurs disponibles…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#E24B4A', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />

        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/client/panier')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Choisir un livreur</div>
            <div className="text-white/70 text-xs">
              {drivers.length} livreur{drivers.length > 1 ? 's' : ''} disponible{drivers.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {['Panier', 'Livreur', 'Confirmation'].map((etape, i) => (
            <div key={etape} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{ background: i === 1 ? '#fff' : 'rgba(255,255,255,0.3)', color: i === 1 ? '#1D9E75' : '#fff' }}>
                  {i < 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold"
                  style={{ color: i === 1 ? '#fff' : 'rgba(255,255,255,0.6)' }}>{etape}</span>
              </div>
              {i < 2 && <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {drivers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3"><Frown size={48} /></div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
              Aucun livreur disponible pour le moment.<br />Réessayez dans quelques minutes.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Livreurs disponibles</h2>

            {visibleItems.map((drv) => {
              const sel = livreurId === drv.id_user
              const nom = `${drv.utilisateur.prenom} ${drv.utilisateur.nom}`
              return (
                <button
                  key={drv.id_user}
                  onClick={() => setLivreurId(drv.id_user)}
                  className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all active:scale-98"
                  style={{
                    background: sel ? (isDark ? 'rgba(45,196,145,0.08)' : '#E1F5EE') : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                    border: `2px solid ${sel ? '#1D9E75' : 'var(--border)'}`,
                    boxShadow: sel ? '0 4px 16px rgba(29,158,117,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: sel ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: sel ? '#1D9E75' : 'var(--surface-alt)' }}><Motorbike size={24} /></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{nom}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Star size={14} /> {drv.score_reputation.toFixed(1)} · {drv.type_vehicule}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' }}>
                           <Banknote size={14} /> {formatPrice(FRAIS_LIVRAISON)} livraison
                         </span>
                         <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                           style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56' }}>
                           <Car size={14} /> {drv.immatriculation}
                         </span>
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: sel ? '#1D9E75' : 'transparent', border: `2px solid ${sel ? '#1D9E75' : 'var(--border)'}` }}>
                      {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}

            {hasMore && (
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                <ChevronDown size={14} /> Charger plus ({drivers.length - visibleCount} restant{drivers.length - visibleCount > 1 ? 's' : ''})
              </button>
            )}
          </div>
        )}

        {livreurSelected && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="font-black text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Récapitulatif</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Articles</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPrice(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Livraison — {livreurSelected.utilisateur.prenom}</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPrice(FRAIS_LIVRAISON)}</span>
              </div>
              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: '1.5px solid var(--border)' }}>
                <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="font-black text-base" style={{ color: '#1D9E75' }}>{formatPrice(totalFinal)}</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl px-3 py-2" style={{ background: isDark ? 'rgba(45,196,145,0.08)' : '#E1F5EE', border: '1px solid rgba(29,158,117,0.15)' }}>
              <p className="text-xs" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>
                Le paiement sera effectué en ligne via Mobile Money après réception et inspection de vos articles.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={confirmerCommande}
          disabled={!livreurId || placing}
          className="w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all active:scale-98"
          style={{
            background: livreurId ? '#1D9E75' : (isDark ? 'rgba(255,255,255,0.08)' : '#D3D1C7'),
            border: 'none',
            boxShadow: livreurId ? '0 6px 24px rgba(29,158,117,0.4)' : 'none',
            opacity: placing ? 0.8 : 1,
          }}
        >
          {placing
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Confirmation en cours…</span>
            : livreurId
            ? `Confirmer avec ${livreurSelected?.utilisateur?.prenom} →`
            : 'Sélectionnez un livreur'}
        </button>

        <p className="text-center text-xs pb-2" style={{ color: 'var(--text-muted)' }}>
          Paiement en ligne via Mobile Money après livraison
        </p>
      </div>

    </div>
  )
}
