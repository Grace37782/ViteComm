import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { api } from '../services/api'
import { Search, CheckCircle, XCircle, Loader2, Package, Truck, Star, Shield, Inbox } from 'lucide-react'

const TYPE_COLORS = {
  order: { bg: isDark => isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark => isDark ? '#F3A83B' : '#854F0B', icon: Package },
  payment: { bg: isDark => isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark => isDark ? '#34D399' : '#0F6E56', icon: CheckCircle },
  delivery: { bg: isDark => isDark ? 'rgba(216,90,48,0.15)' : '#FAECE7', color: isDark => isDark ? '#E87D55' : '#993C1D', icon: Truck },
  feedback: { bg: isDark => isDark ? 'rgba(99,102,241,0.15)' : '#EDE9FE', color: isDark => isDark ? '#A78BFA' : '#8B5CF6', icon: Star },
  system: { bg: isDark => isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6', color: isDark => isDark ? '#9CA3AF' : '#6B7280', icon: Shield },
}

function relativeTime(dateStr, t) {
  const diff = +new Date() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('notification.time.justNow')
  if (mins < 60) return t('notification.time.minutesAgo', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('notification.time.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('notification.time.daysAgo', { count: days })
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function getRouteForNavigation(reference, basePath) {
  if (!reference) return null
  const [type, id] = reference.split(':')
  if (type === 'order') return basePath === '/admin/dashboard' ? null : `${basePath.replace('/notifications', '')}/mes-commandes`
  if (type === 'delivery') return { pathname: `${basePath.replace('/notifications', '')}/suivi-commande`, state: { id_commande: Number(id) } }
  if (type === 'payment') return basePath === '/admin/dashboard' ? null : `${basePath.replace('/notifications', '')}/mes-commandes`
  if (type === 'feedback') return basePath === '/admin/dashboard' ? null : `${basePath.replace('/notifications', '')}/mes-commandes`
  if (type === 'admin') {
    if (id === 'signalements') return '/admin/dashboard'
    if (id === 'users') return '/admin/dashboard'
    if (id === 'litiges') return '/admin/dashboard'
  }
  return null
}

export default function Notifications({ basePath = '/client/notifications' }) {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'

  const TYPE_FILTERS = [
    { id: 'all', label: t('common.all') },
    { id: 'order', label: t('notification.filter.orders') },
    { id: 'delivery', label: t('notification.filter.deliveries') },
    { id: 'payment', label: t('notification.filter.payments') },
    { id: 'feedback', label: t('notification.filter.reviews') },
    { id: 'system', label: t('notification.filter.system') },
  ]

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [unreadFilter, setUnreadFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const isVendeur = basePath.includes('/vendeur')
  const isLivreur = basePath.includes('/livreur')
  const headerBg = isLivreur
    ? (isDark ? 'linear-gradient(135deg, #3D1A10 0%, #121011 100%)' : 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)')
    : isVendeur
      ? (isDark ? 'linear-gradient(135deg, #3D2A10 0%, #121110 100%)' : 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)')
      : (isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)')
  const headerCircle = isLivreur ? 'rgba(216,90,48,0.1)' : isVendeur ? 'rgba(186,117,23,0.1)' : 'rgba(45,196,145,0.1)'
  const accentColor = isLivreur ? '#D85A30' : isVendeur ? '#BA7517' : '#1D9E75'
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'ok') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set('search', search.trim())
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (unreadFilter) params.set('unread', 'true')
      const data = await api.get(`/notifications?${params.toString()}`)
      setNotifications(data.notifications || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setUnreadCount(data.unreadCount || 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, search, typeFilter, unreadFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [search, typeFilter, unreadFilter])

  async function markAllRead() {
    try {
      await api.post('/notifications/read', { ids: [] })
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setUnreadCount(0)
      showToast(t('toast.allMarkedRead'))
    } catch { showToast(t('toast.error'), 'error') }
  }

  async function markOneRead(id) {
    try {
      await api.post('/notifications/read', { ids: [id] })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  function handleClick(n) {
    if (!n.lu) markOneRead(n.id)
    const route = getRouteForNavigation(n.reference, basePath)
    if (route) navigate(route)
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? accentColor : '#D85A30' }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: headerBg }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? headerCircle : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('notification.title')}</div>
            <div className="text-white/70 text-xs">
              {unreadCount > 0 ? t('notification.unread', { count: unreadCount }) : `${total} notification${total > 1 ? 's' : ''}`}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {t('notification.markAllRead')}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">

        {/* SEARCH */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder={t('notification.search')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--text-primary)' }} />
          {search && (
            <button onClick={() => setSearch('')} className="cursor-pointer p-1 rounded-full"
              style={{ background: 'var(--surface-alt)', border: 'none' }}>
              <XCircle size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* TYPE FILTERS */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {TYPE_FILTERS.map(tf => (
            <button key={tf.id} onClick={() => setTypeFilter(tf.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
              style={{
                background: typeFilter === tf.id ? accentColor : 'var(--surface)',
                color: typeFilter === tf.id ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${typeFilter === tf.id ? accentColor : 'var(--border)'}`,
              }}>
              {tf.label}
            </button>
          ))}
          <button onClick={() => setUnreadFilter(!unreadFilter)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
            style={{
              background: unreadFilter ? accentColor : 'var(--surface)',
              color: unreadFilter ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${unreadFilter ? accentColor : 'var(--border)'}`,
            }}>
            {t('notification.unreadFilter')}
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: accentColor }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <Inbox size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
              {search.trim() || typeFilter !== 'all' || unreadFilter
                ? `${t('common.noResults')} ${t('common.all').toLowerCase()}`
                : t('notification.empty')}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(n => {
              const tc = TYPE_COLORS[n.type] || TYPE_COLORS.system
              const Icon = tc.icon
              const route = getRouteForNavigation(n.reference, basePath)
              return (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  className="rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition-all active:scale-98"
                  style={{
                    background: n.lu ? 'var(--surface)' : (isDark ? 'rgba(29,158,117,0.06)' : '#F3FAF7'),
                    border: `1.5px solid ${n.lu ? 'var(--border)' : 'rgba(29,158,117,0.2)'}`,
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: tc.bg(isDark) }}>
                    <Icon size={16} style={{ color: tc.color(isDark) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{n.titre}</span>
                      {!n.lu && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {relativeTime(n.created_at, t)}
                      </span>
                      {route && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: tc.bg(isDark), color: tc.color(isDark) }}>
                          {t('notification.viewAll')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
              style={{
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: page <= 1 ? 0.5 : 1,
              }}>
              ← {t('common.back').replace('← ', '')}
            </button>
            <span className="text-xs font-bold px-3" style={{ color: 'var(--text-muted)' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
              style={{
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: page >= totalPages ? 0.5 : 1,
              }}>
              {t('common.next')} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
