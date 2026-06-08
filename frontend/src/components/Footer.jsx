import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const HIDDEN_ROUTES = ['/forgot-password', '/admin-connect']

const ROLE_LINKS = {
  guest: {
    title: 'Liens rapides',
    links: [
      { label: 'Accueil', path: '/accueil' },
      { label: 'Marchés', path: '/client/accueil' },
      { label: 'Contact', href: 'mailto:support@vitecomm.bj' },
      { label: 'Aide', href: 'mailto:support@vitecomm.bj' },
    ],
  },
  client: {
    title: 'Mon espace client',
    links: [
      { label: 'Accueil', path: '/client/accueil' },
      { label: 'Panier', path: '/client/panier' },
      { label: 'Mes commandes', path: '/client/mes-commandes' },
      { label: 'Profil', path: '/client/profil' },
    ],
  },
  vendeur: {
    title: 'Mon espace vendeur',
    links: [
      { label: 'Dashboard', path: '/vendeur/dashboard' },
      { label: 'Catalogue', path: '/vendeur/catalogue' },
      { label: 'Commandes', path: '/vendeur/commandes' },
      { label: 'Retours', path: '/vendeur/retours' },
      { label: 'Profil', path: '/vendeur/profil' },
    ],
  },
  livreur: {
    title: 'Mon espace livreur',
    links: [
      { label: 'Dashboard', path: '/livreur/dashboard' },
      { label: 'Commandes', path: '/livreur/commandes' },
      { label: 'Retours', path: '/livreur/retours' },
      { label: 'Profil', path: '/livreur/profil' },
    ],
  },
  admin: {
    title: 'Mon espace admin',
    links: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Contact support', href: 'mailto:support@vitecomm.bj' },
    ],
  },
}

const ROLE_CARDS = [
  { role: 'client', emoji: '🛒', label: 'Client', desc: 'Commandez vos produits frais', light: { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' }, dark: { bg: 'rgba(29,158,117,0.12)', color: '#2DC491', border: 'rgba(45,196,145,0.2)' } },
  { role: 'vendeur', emoji: '🏪', label: 'Vendeur', desc: 'Vendez sans livraison', light: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' }, dark: { bg: 'rgba(186,117,23,0.12)', color: '#BA7517', border: 'rgba(186,117,23,0.2)' } },
  { role: 'livreur', emoji: '🏍️', label: 'Livreur', desc: 'Gagnez à chaque course', light: { bg: '#FAECE7', color: '#993C1D', border: '#F5C4B3' }, dark: { bg: 'rgba(216,90,48,0.12)', color: '#D85A30', border: 'rgba(216,90,48,0.2)' } },
]

const THEME_OPTIONS = [
  { value: 'light', icon: '☀️', label: 'Clair' },
  { value: 'system', icon: '🖥️', label: 'Système' },
  { value: 'dark', icon: '🌙', label: 'Sombre' },
]

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { theme, setTheme, resolved } = useTheme()
  const isDark = resolved === 'dark'

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null

  const role = user?.role || 'guest'
  const nav = ROLE_LINKS[role] || ROLE_LINKS.guest

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D9E75] via-[#BA7517] to-[#D85A30]" />

      <div className="mx-auto px-4 sm:px-8 pt-8 pb-5" style={{ maxWidth: '90rem' }}>

        {/* ── Top section: Brand + Links + Role-specific third column ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

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
                <div className="text-base font-black" style={{ color: 'var(--text-primary)' }}>ViteComm</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Marché en ligne · Cotonou</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
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

          {/* Quick Links — role-specific */}
          <div>
            <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{nav.title}</h4>
            <div className="flex flex-col gap-1.5">
              {nav.links.map(link => (
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

          {/* Third column: role cards (guest only) or ViteComm info (logged in) */}
          <div>
            {!user ? (
              <>
                <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rejoignez ViteComm</h4>
                <div className="flex flex-col gap-1.5">
                  {ROLE_CARDS.map(card => {
                    const colors = isDark ? card.dark : card.light
                    return (
                      <button key={card.role} onClick={() => navigate(`/register?role=${card.role}`)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl text-left cursor-pointer"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <span className="text-lg">{card.emoji}</span>
                        <div>
                          <div className="text-xs font-black" style={{ color: colors.color }}>{card.label}</div>
                          <div className="text-[11px]" style={{ color: colors.color, opacity: 0.7 }}>{card.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>À propos</h4>
                <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>Marketplace alimentaire connectant marchands, clients et livreurs à Cotonou.</p>
                  <div className="flex flex-col gap-1.5">
                    <a href="mailto:support@vitecomm.bj" className="text-xs font-medium"
                      style={{ color: 'var(--accent)' }}>✉️ Contacter le support</a>
                    <button onClick={() => navigate('/accueil')}
                      className="text-xs font-medium text-left cursor-pointer"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                      🏠 Page d'accueil
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

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
