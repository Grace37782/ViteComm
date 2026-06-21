import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { ClipboardList, Inbox, ShoppingCart, ShieldCheck, Motorbike, CheckCircle, ChevronDown, FileText, Smartphone } from 'lucide-react'

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getStatusConfig(statut, isDark) {
  const MAP = {
    'En attente': {
      label: 'En attente',
      color: isDark ? '#FBBF24' : '#F59E0B',
      bg: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7',
    },
    'Validee': {
      label: 'Validée',
      color: isDark ? '#60A5FA' : '#3B82F6',
      bg: isDark ? 'rgba(96,165,250,0.15)' : '#DBEAFE',
    },
    'En cours de collecte': {
      label: 'Collecte en cours',
      color: isDark ? '#A78BFA' : '#8B5CF6',
      bg: isDark ? 'rgba(167,139,250,0.15)' : '#EDE9FE',
    },
    'Collectee': {
      label: 'Collectée',
      color: isDark ? '#FBBF24' : '#F59E0B',
      bg: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7',
    },
    'Livree': {
      label: 'Livrée',
      color: isDark ? '#34D399' : '#1D9E75',
      bg: isDark ? 'rgba(52,211,153,0.15)' : '#D1FAE5',
    },
    'Annulee': {
      label: 'Annulée',
      color: isDark ? '#F87171' : '#E24B4A',
      bg: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2',
    },
  }
  return MAP[statut] || { label: statut, color: 'var(--text-muted)', bg: 'var(--surface-alt)' }
}

const PAGE_SIZE = 10

function copyCode(code) {
  navigator.clipboard?.writeText(code)
}

export default function MesCommandes() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    api.get('/client/orders')
      .then(setOrders)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const visibleItems = orders.slice(0, visibleCount)
  const hasMore = visibleCount < orders.length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><ClipboardList size={40} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13 }}>Chargement de vos commandes…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
        padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('/client/accueil')}
            style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Accueil
          </button>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#fff' }}>Mes commandes</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {orders.length} commande{orders.length !== 1 ? 's' : ''} passée{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 24, border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><Inbox size={48} /></div>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune commande</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Vous n'avez pas encore passé de commande.
            </div>
            <button
              onClick={() => navigate('/client/accueil')}
              style={{
                background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 16,
                padding: '14px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              }}
            >
              <ShoppingCart size={16} className="inline" /> Découvrir les marchés
            </button>
          </div>
        ) : (
          visibleItems.map(order => {
            const sc = getStatusConfig(order.statut, isDark)
            const livreur = order.livraison?.livreur
            const livreurNom = livreur
              ? `${livreur.utilisateur?.prenom} ${livreur.utilisateur?.nom}`
              : null

            return (
              <div
                key={order.id_commande}
                style={{
                  background: 'var(--surface)', borderRadius: 20,
                  border: '1.5px solid var(--border)', overflow: 'hidden',
                }}
              >
                {/* Status bar */}
                <div style={{
                  background: sc.bg, padding: '10px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}><ClipboardList size={16} /></span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: sc.color }}>
                      #{String(order.id_commande).padStart(5, '0')}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: 800, fontSize: 11, color: sc.color,
                    background: sc.bg, padding: '3px 10px', borderRadius: 20,
                    border: `1px solid ${sc.color}33`,
                  }}>
                    {sc.label}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px' }}>
                  {/* Code verification */}
                  <div style={{
                    background: 'var(--surface-alt)', borderRadius: 14,
                    padding: '12px 14px', marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <ShieldCheck size={12} className="inline" /> Code de vérification
                      </div>
                      <div style={{
                        fontSize: 24, fontWeight: 900, letterSpacing: 6,
                        color: '#1D9E75', fontFamily: 'monospace', marginTop: 2,
                      }}>
                        {order.code_verification}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        copyCode(order.code_verification)
                        setCopiedId(order.id_commande)
                        setTimeout(() => setCopiedId(null), 2000)
                      }}
                      style={{
                        background: copiedId === order.id_commande ? (isDark ? 'rgba(29,158,117,0.15)' : '#D1FAE5') : 'var(--surface)',
                        border: `1.5px solid ${copiedId === order.id_commande ? '#1D9E75' : 'var(--border)'}`,
                        borderRadius: 12, padding: '10px 14px',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        color: copiedId === order.id_commande ? '#1D9E75' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      }}
                    >
                      {copiedId === order.id_commande ? <><CheckCircle size={12} className="inline" /> Copié</> : <><ClipboardList size={12} className="inline" /> Copier</>}
                    </button>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(order.date_creation)}</span>
                    </div>

                    {livreurNom && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Motorbike size={12} className="inline" /> Livreur</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {livreurNom}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Articles</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.detailsCommande?.reduce((s, d) => s + d.quantite_commandee, 0)} produit(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#1D9E75' }}>
                        {formatPrice(order.total_marchandises + order.frais_livraison)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div style={{
                  borderTop: '1px solid var(--border)', padding: '10px 16px',
                  display: 'flex', justifyContent: 'flex-end', gap: 8,
                }}>
                  {order.statut === 'Livree' && order.mode_paiement_status !== 'paye' && (
                    <button
                      onClick={() => {
                        const total = (order.detailsCommande || []).reduce((s, d) => s + (d.prix_vente_applique || 0) * d.quantite_commandee, 0)
                          + (order.frais_livraison || 0)
                        navigate('/client/paiement', { state: { id_commande: order.id_commande, total } })
                      }}
                      style={{
                        background: '#1D9E75', color: '#fff', borderRadius: 12,
                        padding: '8px 14px', fontSize: 12, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        border: 'none',
                      }}
                    >
                      <Smartphone size={12} className="inline" /> Payer
                    </button>
                  )}
                  {order.factures && order.factures.length > 0 && order.factures[0].statut_paiement === 'Paye' && (
                    <button
                      onClick={() => navigate('/client/mes-factures')}
                      style={{
                        background: 'none', border: 'none',
                        color: '#1D9E75', fontSize: 12, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <FileText size={12} className="inline" /> Facture
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/client/suivi-commande', {
                      state: {
                        id_commande: order.id_commande,
                        code_verification: order.code_verification,
                        livreur: order.livraison?.livreur || null,
                      }
                    })}
                    style={{
                      background: 'none', border: 'none',
                      color: '#1D9E75', fontSize: 12, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    Voir le suivi →
                  </button>
                </div>
              </div>
            )
          })
        )}

        {hasMore && (
          <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronDown size={14} /> Charger plus ({orders.length - visibleCount} restant{orders.length - visibleCount > 1 ? 's' : ''})
          </button>
        )}
      </div>

    </div>
  )
}
