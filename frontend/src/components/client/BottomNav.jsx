import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ClipboardList, Bell, ShoppingCart, User } from 'lucide-react'

const items = [
  { icon: Home, label: 'Accueil',  path: '/client/accueil', activeOn: '/client/accueil' },
  { icon: ClipboardList, label: 'Commandes', path: '/client/mes-commandes', activeOn: '/client/mes-commandes' },
  { icon: Bell, label: 'Notifs', path: '/client/notifications', activeOn: '/client/notifications' },
  { icon: ShoppingCart, label: 'Panier',   path: '/client/panier',  activeOn: '/client/panier'  },
  { icon: User, label: 'Profil',   path: '/client/profil',  activeOn: '/client/profil'  },
]

export default function BottomNav({ panierCount = 0 }) {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t flex z-50 safe-area-pb"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      {items.map((item) => {
        const actif = item.activeOn ? pathname.startsWith(item.activeOn) : false
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            <item.icon size={20} className="leading-none" />
            <span
              className="text-xs font-semibold"
              style={{ color: actif ? '#1D9E75' : '#888780' }}
            >
              {item.label}
            </span>
            {/* Badge panier */}
            {item.label === 'Panier' && panierCount > 0 && (
              <div
                className="absolute top-2 right-1/4 w-4 h-4 rounded-full flex items-center justify-center text-white font-black"
                style={{ background: '#E24B4A', fontSize: 9 }}
              >
                {panierCount > 9 ? '9+' : panierCount}
              </div>
            )}
            {/* Indicateur actif */}
            {actif && (
              <div
                className="absolute bottom-0 left-1/2 w-8 h-0.5 rounded-full"
                style={{ background: '#1D9E75', transform: 'translateX(-50%)' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}