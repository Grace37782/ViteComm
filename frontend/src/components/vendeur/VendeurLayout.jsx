import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_TABS = [
  { icon: '📊', label: 'Accueil', path: '/vendeur/dashboard' },
  { icon: '📦', label: 'Catalogue', path: '/vendeur/catalogue' },
  { icon: '🛒', label: 'Commandes', path: '/vendeur/commandes' },
  { icon: '↩️', label: 'Retours', path: '/vendeur/retours' },
  { icon: '📈', label: 'Stats', path: '/vendeur/statistiques' },
  { icon: '💰', label: 'Factures', path: '/vendeur/factures' },
  { icon: '⚠️', label: 'Signaler', path: '/vendeur/signalement' },
  { icon: '👤', label: 'Profil', path: '/vendeur/profil' },
]

export default function VendeurLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user) return navigate('/connect', { replace: true })
    if (user.role !== 'vendeur') {
      if (user.role === 'client') return navigate('/client/accueil', { replace: true })
      if (user.role === 'livreur') return navigate('/livreur/dashboard', { replace: true })
      return navigate('/accueil', { replace: true })
    }
  }, [user, navigate])

  const initials = ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase() || '?'

  return (
    <div className="min-h-screen font-sans role-vendeur" style={{ background: 'var(--bg)' }}>
      <div className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => navigate('/vendeur/dashboard')} className="cursor-pointer flex-shrink-0">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-8 h-8 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-sm font-black text-[#BA7517]">
                    {initials}
                  </div>
                )}
              </button>
              <div className="min-w-0">
                <div className="text-white font-black text-sm truncate">ViteComm · Vendeur</div>
                <div className="text-white/60 text-xs truncate">{user?.prenom} {user?.nom}</div>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/connect') }}
              className="text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              Déconnexion
            </button>
          </div>
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-none">
            {NAV_TABS.map(tab => {
              const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
              return (
                <button key={tab.path} onClick={() => navigate(tab.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
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
