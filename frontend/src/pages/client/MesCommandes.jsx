import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_LABELS = {
  'En attente': { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7' },
  'Validee': { label: 'Validée', color: '#3B82F6', bg: '#DBEAFE' },
  'En cours de collecte': { label: 'Collecte en cours', color: '#8B5CF6', bg: '#EDE9FE' },
  'Collectee': { label: 'Collectée', color: '#F59E0B', bg: '#FEF3C7' },
  'Livree': { label: 'Livrée', color: '#1D9E75', bg: '#D1FAE5' },
  'Annulee': { label: 'Annulée', color: '#E24B4A', bg: '#FEE2E2' },
}

function getStatusConfig(statut) {
  return STATUS_LABELS[statut] || { label: statut, color: '#888780', bg: '#F3F4F6' }
}

function copyCode(code) {
  navigator.clipboard?.writeText(code)
}

export default function MesCommandes() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    api.get('/client/orders')
      .then(setOrders)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8F3' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, color: '#888780', fontSize: 13 }}>Chargement de vos commandes…</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8F3', fontFamily: 'sans-serif', paddingBottom: 80 }}>

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
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 24, border: '1.5px solid #E8E6DF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#2C2C2A', marginBottom: 6 }}>Aucune commande</div>
            <div style={{ fontSize: 13, color: '#888780', marginBottom: 20 }}>
              Vous n'avez pas encore passé de commande.
            </div>
            <button
              onClick={() => navigate('/client/accueil')}
              style={{
                background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 16,
                padding: '14px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              }}
            >
              🛒 Découvrir les marchés
            </button>
          </div>
        ) : (
          orders.map(order => {
            const sc = getStatusConfig(order.statut)
            const livreur = order.livraison?.livreur
            const livreurNom = livreur
              ? `${livreur.utilisateur?.prenom} ${livreur.utilisateur?.nom}`
              : null

            return (
              <div
                key={order.id_commande}
                style={{
                  background: '#fff', borderRadius: 20,
                  border: '1.5px solid #E8E6DF', overflow: 'hidden',
                }}
              >
                {/* Status bar */}
                <div style={{
                  background: sc.bg, padding: '10px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: '#2C2C2A' }}>
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
                    background: '#F7F8F3', borderRadius: 14,
                    padding: '12px 14px', marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        🔐 Code de vérification
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
                        background: copiedId === order.id_commande ? '#D1FAE5' : '#fff',
                        border: `1.5px solid ${copiedId === order.id_commande ? '#1D9E75' : '#E8E6DF'}`,
                        borderRadius: 12, padding: '10px 14px',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        color: copiedId === order.id_commande ? '#1D9E75' : '#5F5E5A',
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      }}
                    >
                      {copiedId === order.id_commande ? '✓ Copié' : '📋 Copier'}
                    </button>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#888780' }}>Date</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2A' }}>{formatDate(order.date_creation)}</span>
                    </div>

                    {livreurNom && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#888780' }}>🏍️ Livreur</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2A' }}>
                          {livreurNom}
                          {livreur?.utilisateur?.telephone && ` · ${livreur.utilisateur.telephone}`}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#888780' }}>Articles</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2A' }}>
                        {order.detailsCommande?.reduce((s, d) => s + d.quantite_commandee, 0)} produit(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #E8E6DF' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#2C2C2A' }}>Total</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#1D9E75' }}>
                        {formatPrice(order.total_marchandises + order.frais_livraison)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div style={{
                  borderTop: '1px solid #E8E6DF', padding: '10px 16px',
                  display: 'flex', justifyContent: 'flex-end',
                }}>
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
      </div>

    </div>
  )
}
