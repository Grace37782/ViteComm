import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Package, ShoppingCart, Bell, Undo2, User } from 'lucide-react'

const ITEMS = [
  { id: 'dashboard', label: 'Accueil',   icon: BarChart3, route: '/vendeur/dashboard'  },
  { id: 'catalogue', label: 'Catalogue', icon: Package, route: '/vendeur/catalogue'  },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart, route: '/vendeur/commandes'  },
  { id: 'notifs',    label: 'Notifs',    icon: Bell, route: '/vendeur/notifications'  },
  { id: 'retours',   label: 'Retours',   icon: Undo2,  route: '/vendeur/retours'    },
  { id: 'profil',    label: 'Profil',    icon: User, route: '/vendeur/profil' },
]

export default function BottomNavVendeur() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-50"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      {ITEMS.map((n) => {
        const actif = pathname.startsWith(n.route) || (n.route === '/profil' && pathname === '/profil')
        return (
          <button
            key={n.id}
            onClick={() => navigate(n.route)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            <n.icon size={20} />
            <span className="text-xs font-semibold"
              style={{ color: actif ? '#BA7517' : '#888780' }}>
              {n.label}
            </span>
            {actif && (
              <div className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: '#BA7517' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}