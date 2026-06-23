import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { Home, ClipboardList, Star, ShoppingCart, User, Bell } from 'lucide-react'
import MobileDrawer from '../MobileDrawer'
import NotificationBell from '../NotificationBell'
import { subscribeToPush } from '../../services/push'

const NAV_TABS = [
  { icon: Home, labelKey: 'nav.accueil', path: '/client/accueil' },
  { icon: ClipboardList, labelKey: 'nav.commandes', path: '/client/mes-commandes' },
  { icon: Star, labelKey: 'nav.evaluer', path: '/client/evaluation' },
  { icon: Bell, labelKey: 'notification.title', path: '/client/notifications' },
  { icon: ShoppingCart, labelKey: 'nav.panier', path: '/client/panier' },
  { icon: User, labelKey: 'nav.profil', path: '/client/profil' },
]

const ACCENT = '#1D9E75'

export default function ClientLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useLang()

  useEffect(() => {
    if (!user) return navigate('/connect', { replace: true })
    if (user.role !== 'client') {
      if (user.role === 'vendeur') return navigate('/vendeur/dashboard', { replace: true })
      if (user.role === 'livreur') return navigate('/livreur/dashboard', { replace: true })
      return navigate('/accueil', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    document.documentElement.classList.add('role-client')
    return () => document.documentElement.classList.remove('role-client')
  }, [])

  useEffect(() => {
    if (user) subscribeToPush().catch(() => {})
  }, [user])

  const initials = ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase() || '?'
  const navTabs = NAV_TABS.map(tab => ({ ...tab, label: t(tab.labelKey) }))

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      <div className="sticky top-0 z-50" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0F6E56 100%)` }}>
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <MobileDrawer
                navTabs={navTabs}
                accentColor={ACCENT}
                brandLabel="ViteComm"
                onLogout={() => { logout(); navigate('/connect') }}
              />
              <button onClick={() => navigate('/client/profil')} className="cursor-pointer flex-shrink-0">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-8 h-8 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-sm font-black text-[#1D9E75]">
                    {initials}
                  </div>
                )}
              </button>
              <div className="min-w-0">
                <div className="text-white font-black text-sm truncate">ViteComm</div>
                <div className="text-white/60 text-xs truncate">{user?.prenom} {user?.nom}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button onClick={() => { logout(); navigate('/connect') }}
              className="hidden sm:block text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              {t('auth.logout')}
              </button>
            </div>
          </div>
          <div className="hidden md:flex gap-1 mt-2 overflow-x-auto scrollbar-none">
            {navTabs.map(tab => {
              const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
              return (
                <button key={tab.path} onClick={() => navigate(tab.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{ background: active ? 'rgba(255,255,255,0.2)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
