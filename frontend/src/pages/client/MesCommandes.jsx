import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { ClipboardList, Inbox, ShoppingCart, ShieldCheck, Motorbike, CheckCircle, ChevronDown, FileText, Smartphone, Search, XCircle } from 'lucide-react'

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getStatusConfig(statut, isDark, t) {
  const MAP = {
    'En attente': {
      label: t('order.status.pending'),
      color: isDark ? '#FBBF24' : '#F59E0B',
      bg: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7',
    },
    'Validee': {
      label: t('order.status.validated'),
      color: isDark ? '#60A5FA' : '#3B82F6',
      bg: isDark ? 'rgba(96,165,250,0.15)' : '#DBEAFE',
    },
    'En cours de collecte': {
      label: t('order.status.collecting'),
      color: isDark ? '#A78BFA' : '#8B5CF6',
      bg: isDark ? 'rgba(167,139,250,0.15)' : '#EDE9FE',
    },
    'Collectee': {
      label: t('order.status.collected'),
      color: isDark ? '#FBBF24' : '#F59E0B',
      bg: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7',
    },
    'Livree': {
      label: t('order.status.delivered'),
      color: isDark ? '#34D399' : '#1D9E75',
      bg: isDark ? 'rgba(52,211,153,0.15)' : '#D1FAE5',
    },
    'Annulee': {
      label: t('order.status.cancelled'),
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
  const { t } = useLang()
  const isDark = resolved === 'dark'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/client/orders')
      .then(setOrders)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filtres = {
    tous: orders,
    en_attente: orders.filter(o => ['En attente', 'Validee'].includes(o.statut)),
    en_cours: orders.filter(o => ['En cours de collecte', 'Collectee', 'En cours de livraison'].includes(o.statut)),
    livree: orders.filter(o => o.statut === 'Livree'),
  }

  const baseList = filtres[filtre] || orders

  const liste = search.trim()
    ? baseList.filter(o => {
        const q = search.toLowerCase().trim()
        const id = String(o.id_commande)
        const livreur = o.livraison?.livreur
          ? `${o.livraison.livreur.utilisateur?.prenom || ''} ${o.livraison.livreur.utilisateur?.nom || ''}`.toLowerCase()
          : ''
        const produits = (o.detailsCommande || []).map(d => (d.produit?.nom || '').toLowerCase()).join(' ')
        return id.includes(q) || livreur.includes(q) || produits.includes(q)
      })
    : baseList

  const hasMore = visibleCount < liste.length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><ClipboardList size={40} /></div>
          <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13 }}>{t('order.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/accueil')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('order.title')}</div>
            <div className="text-white/70 text-xs">
              {t('order.count', { count: orders.length })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* TABS */}
        <div className="flex gap-2">
          {[
            { id: 'tous', label: t('common.all') },
            { id: 'en_attente', label: t('order.filter.pending') },
            { id: 'en_cours', label: t('order.filter.inProgress') },
            { id: 'livree', label: t('order.filter.delivered') },
          ].map(ft => (
            <button key={ft.id} onClick={() => { setFiltre(ft.id); setVisibleCount(PAGE_SIZE) }}
              className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
              style={{
                background: filtre === ft.id ? '#1D9E75' : 'var(--surface)',
                color: filtre === ft.id ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${filtre === ft.id ? '#1D9E75' : 'var(--border)'}`,
              }}>
              {ft.label}
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t('order.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="cursor-pointer p-1 rounded-full transition-all"
                style={{ background: 'var(--surface-alt)', border: 'none' }}>
                <XCircle size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 24, border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><Inbox size={48} /></div>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>{t('order.empty')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {t('order.emptyDesc')}
            </div>
            <button
              onClick={() => navigate('/client/accueil')}
              style={{
                background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 16,
                padding: '14px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              }}
            >
              <ShoppingCart size={16} className="inline" /> {t('order.discover')}
            </button>
          </div>
        ) : liste.length === 0 ? (
          <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
            {search.trim() ? t('common.noResults') + ` "${search}"` : t('order.noResultsInCategory')}
            {search.trim() && (
              <button onClick={() => setSearch('')} className="block mx-auto mt-2 text-xs font-bold cursor-pointer" style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                {t('common.clearSearch')}
              </button>
            )}
          </div>
        ) : (
          liste.slice(0, visibleCount).map(order => {
            const sc = getStatusConfig(order.statut, isDark, t)
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
                        <ShieldCheck size={12} className="inline" /> {t('order.codeVerification')}
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
                      {copiedId === order.id_commande ? <><CheckCircle size={12} className="inline" /> {t('common.copied')}</> : <><ClipboardList size={12} className="inline" /> {t('common.copy')}</>}
                    </button>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('order.date')}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(order.date_creation)}</span>
                    </div>

                    {livreurNom && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Motorbike size={12} className="inline" /> {t('order.driver')}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {livreurNom}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('order.articles')}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.detailsCommande?.reduce((s, d) => s + d.quantite_commandee, 0)} {t('common.items')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{t('order.total')}</span>
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
                      <Smartphone size={12} className="inline" /> {t('order.pay')}
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
                      <FileText size={12} className="inline" /> {t('order.invoice')}
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
                    {t('order.track')}
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
            <ChevronDown size={14} /> {t('common.loadMore')} ({liste.length - visibleCount} {t('common.remaining')}{liste.length - visibleCount > 1 ? 's' : ''})
          </button>
        )}
      </div>

    </div>
  )
}
