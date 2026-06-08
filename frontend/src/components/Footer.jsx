import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const HIDDEN_ROUTES = ['/connect', '/register', '/forgot-password', '/admin-connect']

const QUICK_LINKS = [
  { label: 'Accueil', path: '/accueil' },
  { label: 'Marchés', path: '/client/accueil' },
  { label: 'Contact', href: 'mailto:support@vitecomm.bj' },
  { label: 'Aide', href: 'mailto:support@vitecomm.bj' },
]

const ROLE_CARDS = [
  { role: 'client', emoji: '🛒', label: 'Client', desc: 'Commandez vos produits frais', bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' },
  { role: 'vendeur', emoji: '🏪', label: 'Vendeur', desc: 'Vendez sans livraison', bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  { role: 'livreur', emoji: '🏍️', label: 'Livreur', desc: 'Gagnez à chaque course', bg: '#FAECE7', color: '#993C1D', border: '#F5C4B3' },
]

const THEME_OPTIONS = [
  { value: 'light', icon: '☀️', label: 'Clair' },
  { value: 'system', icon: '🖥️', label: 'Système' },
  { value: 'dark', icon: '🌙', label: 'Sombre' },
]

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D9E75] via-[#BA7517] to-[#D85A30]" />

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">

        {/* ── Top section: Brand + Links + Roles ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff' }}
              >
                V
              </div>
              <div>
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>ViteComm</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Marché en ligne · Cotonou</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
              Commandez à Dantokpa, Missèbo et Akpakpa.
              Livraison rapide par zemidjan, paiement à la livraison.
            </p>
            <div className="flex gap-2">
              <a href="mailto:support@vitecomm.bj"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                ✉️ support@vitecomm.bj
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Liens rapides</h4>
            <div className="flex flex-col gap-2">
              {QUICK_LINKS.map(link => (
                link.path ? (
                  <button key={link.label} onClick={() => navigate(link.path)}
                    className="text-sm text-left font-medium cursor-pointer"
                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {link.label}
                  </button>
                ) : (
                  <a key={link.label} href={link.href}
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {link.label}
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Role Cards */}
          <div>
            <h4 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>Rejoignez ViteComm</h4>
            <div className="flex flex-col gap-2">
              {ROLE_CARDS.map(card => (
                <button key={card.role} onClick={() => navigate(`/register?role=${card.role}`)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer"
                  style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                  <span className="text-xl">{card.emoji}</span>
                  <div>
                    <div className="text-xs font-black" style={{ color: card.color }}>{card.label}</div>
                    <div className="text-[11px]" style={{ color: card.color, opacity: 0.7 }}>{card.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px mb-6" style={{ background: 'var(--border)' }} />

        {/* ── Bottom section: Theme toggle + Copyright ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Theme Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Thème</span>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              {THEME_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTheme(opt.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  style={{
                    background: theme === opt.value ? 'var(--accent)' : 'transparent',
                    color: theme === opt.value ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                  }}>
                  <span>{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 ViteComm. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  )
}
