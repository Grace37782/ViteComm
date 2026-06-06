import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_TABS = [
  { icon: '🏠', label: 'Accueil', path: '/client/accueil' },
  { icon: '📋', label: 'Commandes', path: '/client/mes-commandes' },
  { icon: '🛒', label: 'Panier', path: '/client/panier' },
  { icon: '👤', label: 'Profil', path: '/client/profil' },
]

export default function ClientLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user) navigate('/connect', { replace: true })
  }, [user, navigate])

  const initials = ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-[#F7F8F3] font-sans">
      <div className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/client/profil')} className="cursor-pointer">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-9 h-9 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-sm font-black text-[#1D9E75]">
                    {initials}
                  </div>
                )}
              </button>
              <div>
                <div className="text-white font-black text-sm">ViteComm</div>
                <div className="text-white/60 text-xs">{user?.prenom} {user?.nom} · Client</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Cart badge */}
              <button onClick={() => navigate('/client/panier')}
                className="relative text-white/70 hover:text-white text-lg cursor-pointer"
                style={{ background: 'none', border: 'none' }}>
                🛒
              </button>
              <button onClick={() => { logout(); navigate('/connect') }}
                className="text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                Déconnexion
              </button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {NAV_TABS.map(tab => {
              const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
              return (
                <button key={tab.path} onClick={() => navigate(tab.path)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{ background: active ? 'rgba(255,255,255,0.2)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                  <span>{tab.icon}</span> {tab.label}
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
