import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, ShoppingCart, Bell, Undo2 } from 'lucide-react'

const ITEMS = [
  { id: 'dashboard', label: 'Accueil', icon: BarChart3, route: '/livreur/dashboard' },
  { id: 'commandes', label: 'Commandes', icon: ShoppingCart, route: '/livreur/commandes' },
  { id: 'notifs',    label: 'Notifs',    icon: Bell, route: '/livreur/notifications' },
  { id: 'retours', label: 'Retours', icon: Undo2, route: '/livreur/retours' },
]

export default function BottomNavLivreur() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-50"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      {ITEMS.map((item) => {
        const actif = pathname.startsWith(item.route)
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 cursor-pointer relative"
            style={{ background: 'none', border: 'none' }}
          >
            <item.icon size={20} className="leading-none" />
            <span className="text-xs font-semibold" style={{ color: actif ? '#BA7517' : '#888780' }}>
              {item.label}
            </span>
            {actif && (
              <div className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: '#BA7517' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
