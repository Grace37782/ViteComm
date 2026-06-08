import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'

export default function DashboardVendeur() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [dashboard, setDashboard] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [dashData, ordersData] = await Promise.all([
        api.get('/vendor/dashboard'),
        api.get('/vendor/recent-orders')
      ])
      setDashboard(dashData)
      setRecentOrders(ordersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const STATUT_STYLE = {
    en_attente: { label: 'En attente', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    collecte: { label: 'Collecté', bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
    livre: { label: 'Livré', bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl" style={{ background: 'var(--border)' }} />
            <div className="flex-1"><div className="h-4 rounded w-32 mb-2" style={{ background: 'var(--border)' }} /><div className="h-3 rounded w-48" style={{ background: 'var(--border)' }} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: '#BA7517', color: '#fff' }}>Réessayer</button>
        </div>
      </div>
    )
  }

  const v = dashboard?.vendeur || {}
  const f = dashboard?.financier || {}

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* PROFIL & REPUTATION */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: '#BA7517', color: '#fff' }}>
            {(v.prenom || 'V')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{v.prenom}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.etal} · {v.marche}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg" style={{ color: '#BA7517' }}>{dashboard.score_reputation || '—'}</span>
              <span className="text-sm">⭐</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{dashboard.nb_avis || 0} avis</div>
          </div>
        </div>
      </div>

      {/* BILAN FINANCIER */}
      <div>
        <h2 className="font-black text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Bilan financier</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Revenu brut', val: f.revenu_brut || 0, color: 'var(--text-primary)', bg: 'var(--surface)', border: 'var(--border)' },
            { label: 'Gains nets', val: f.gains_nets || 0, color: isDark ? '#2DC491' : '#0F6E56', bg: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB' },
            { label: 'Commission 0,6%', val: -(f.commission_plateforme || 0), color: isDark ? '#E87D55' : '#D85A30', bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3' },
            { label: 'Pertes rejets', val: -(f.pertes_rejets || 0), color: isDark ? '#E87D55' : '#D85A30', bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="font-black text-lg" style={{ color: s.color }}>
                {s.val < 0 ? '−' : ''}{Math.abs(s.val).toLocaleString()} F
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALERTES STOCK */}
      {dashboard.alertes_stock?.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{
            background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA',
            border: `1.5px solid ${isDark ? '#BA7517' : '#FAC775'}`,
          }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-black text-sm" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>Stock faible — action requise</h3>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {dashboard.alertes_stock.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.55)' }}>
                <span className="text-xl">{a.emoji}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>{a.nom}</span>
                <span className="font-black text-xs px-2.5 py-1 rounded-full" style={{ background: '#D85A30', color: '#fff' }}>
                  {a.stock} restant{a.stock > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/vendeur/catalogue')}
            className="w-full py-2.5 rounded-xl text-xs font-black cursor-pointer"
            style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
            Mettre à jour les stocks →
          </button>
        </div>
      )}

      {/* COMMANDES RECENTES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commandes récentes</h2>
          <button onClick={() => navigate('/vendeur/commandes')}
            className="text-xs font-semibold cursor-pointer"
            style={{ color: '#BA7517', background: 'none', border: 'none' }}>
            Voir tout →
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {recentOrders.map((c) => {
            const st = STATUT_STYLE[c.statut] || STATUT_STYLE.en_attente
            return (
              <button key={c.id}
                onClick={() => navigate('/vendeur/commandes')}
                className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all active:scale-98"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex-1">
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{c.id}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.heure} · {c.articles} articles</div>
                </div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{c.total.toLocaleString()} F</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </button>
            )
          })}
          {recentOrders.length === 0 && (
            <div className="text-center py-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Aucune commande récente</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '📦', label: 'Mon catalogue', sub: 'Gérer mes produits', route: '/vendeur/catalogue' },
          { icon: '🛒', label: 'Commandes', sub: 'Gérer les remises', route: '/vendeur/commandes' },
          { icon: '↩️', label: 'Retours', sub: 'Articles rejetés', route: '/vendeur/retours' },
          { icon: '🚩', label: 'Signaler', sub: 'Client ou livreur', route: '/vendeur/signalement' },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.route)}
            className="rounded-2xl p-4 text-left cursor-pointer transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.sub}</div>
          </button>
        ))}
      </div>

    </div>
  )
}
