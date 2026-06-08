import { useNavigate, useLocation } from 'react-router-dom'

const ITEMS = [
  { id: 'dashboard', label: 'Accueil', icon: '📊', route: '/livreur/dashboard' },
  { id: 'commandes', label: 'Commandes', icon: '🛒', route: '/livreur/commandes' },
  { id: 'retours', label: 'Retours', icon: '↩️', route: '/livreur/retours' },
]

export default function BottomNavLivreur() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white flex z-50"
      style={{ borderTop: '1px solid #E8E6DF', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
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
            <span className="text-xl leading-none">{item.icon}</span>
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
