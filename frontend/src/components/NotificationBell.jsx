import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../services/api'

function relativeTime(dateStr) {
  const diff = +new Date() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

const TYPE_COLORS = {
  order: '#BA7517',
  payment: '#1D9E75',
  delivery: '#D85A30',
  feedback: '#6366F1',
  system: '#6B7280',
}

export default function NotificationBell({ notificationsPath = '/client/notifications', onNavigate }) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  const fetchUnread = useCallback(async () => {
    try {
      const data = await api.get('/notifications')
      setUnreadCount(data.unreadCount || 0)
    } catch { /* ignore */ }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUnread(); const interval = setInterval(fetchUnread, 30000); return () => clearInterval(interval) }, [fetchUnread])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function openPanel() {
    setOpen(prev => !prev)
    if (!open) {
      setLoading(true)
      try {
        const data = await api.get('/notifications')
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch { /* ignore */ }
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read', { ids: [] })
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  async function markOneRead(id) {
    try {
      await api.post('/notifications/read', { ids: [id] })
      setNotifications(prev => prev.map(pn => pn.id === id ? { ...pn, lu: true } : pn))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  function handleClick(n) {
    if (!n.lu) markOneRead(n.id)
    setOpen(false)
    if (n.reference) {
      const [type, id] = n.reference.split(':')
      if (type === 'admin' && onNavigate) {
        if (id === 'signalements') onNavigate('__admin_signalements')
        else if (id === 'users') onNavigate('__admin_users')
        else if (id === 'litiges') onNavigate('__admin_litiges')
        return
      }
      const basePath = notificationsPath.replace('/notifications', '')
      if (type === 'order') navigate(`${basePath}/mes-commandes`)
      else if (type === 'delivery') navigate(`${basePath}/suivi-commande`, { state: { id_commande: Number(id) } })
      else if (type === 'payment') navigate(`${basePath}/mes-commandes`)
      else if (type === 'feedback') navigate(`${basePath}/mes-commandes`)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={openPanel}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.18)', border: 'none' }}>
        <Bell size={18} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-2xl shadow-2xl z-50"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-bold cursor-pointer"
                  style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                  Tout lu
                </button>
              )}
              <button onClick={() => { setOpen(false); onNavigate ? onNavigate(notificationsPath) : navigate(notificationsPath) }}
                className="text-[10px] font-bold cursor-pointer"
                style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                Voir tout →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Chargement…</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Aucune notification</div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div key={n.id}
                onClick={() => handleClick(n)}
                className="px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: n.lu ? 'transparent' : 'rgba(29,158,117,0.05)',
                }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.lu ? 'transparent' : (TYPE_COLORS[n.type] || '#6B7280') }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{n.titre}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{relativeTime(n.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
