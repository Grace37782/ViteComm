import { useNavigate, useLocation } from 'react-router-dom'

const items = [
  { icon: '🏠', label: 'Accueil',  path: '/client/accueil'   },
  { icon: '🔍', label: 'Chercher', path: '/client/catalogue'  },
  { icon: '🛒', label: 'Panier',   path: '/client/panier'     },
  { icon: '👤', label: 'Profil',   path: '/client/profil'     },
]

export default function BottomNav({ panierCount = 0 }) {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 safe-area-pb"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      {items.map((item) => {
        const actif = pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
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