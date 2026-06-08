import { useNavigate, useLocation } from 'react-router-dom'

const ITEMS = [
  { id: 'dashboard', label: 'Accueil',   icon: '📊', route: '/vendeur/dashboard'  },
  { id: 'catalogue', label: 'Catalogue', icon: '📦', route: '/vendeur/catalogue'  },
  { id: 'commandes', label: 'Commandes', icon: '🛒', route: '/vendeur/commandes'  },
  { id: 'retours',   label: 'Retours',   icon: '↩️',  route: '/vendeur/retours'    },
  { id: 'profil',    label: 'Profil',    icon: '👤', route: '/profil'             },
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
            <span className="text-xl leading-none">{n.icon}</span>
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