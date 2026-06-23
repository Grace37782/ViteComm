import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Store, Bike, Mail, Sun, Monitor, Moon, Home, Globe, FileText, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'

const HIDDEN_ROUTES = ['/forgot-password', '/admin-connect']

const ROLE_LINKS = {
  guest: {
    titleKey: 'footer.join',
    links: [
      { labelKey: 'nav.accueil', path: '/accueil' },
      { labelKey: 'nav.marches', path: '/client/accueil' },
      { labelKey: 'nav.contact', href: 'mailto:viteecom@gmail.com' },
      { labelKey: 'nav.aide', href: 'mailto:viteecom@gmail.com' },
    ],
  },
  client: {
    titleKey: 'nav.profil',
    links: [
      { labelKey: 'nav.accueil', path: '/client/accueil' },
      { labelKey: 'nav.commandes', path: '/client/mes-commandes' },
      { labelKey: 'nav.evaluer', path: '/client/evaluation' },
      { labelKey: 'nav.panier', path: '/client/panier' },
      { labelKey: 'nav.profil', path: '/client/profil' },
    ],
  },
  vendeur: {
    titleKey: 'nav.profil',
    links: [
      { labelKey: 'nav.dashboard', path: '/vendeur/dashboard' },
      { labelKey: 'nav.catalogue', path: '/vendeur/catalogue' },
      { labelKey: 'nav.commandes', path: '/vendeur/commandes' },
      { labelKey: 'nav.retours', path: '/vendeur/retours' },
      { labelKey: 'nav.statistiques', path: '/vendeur/statistiques' },
      { labelKey: 'nav.factures', path: '/vendeur/factures' },
      { labelKey: 'nav.signaler', path: '/vendeur/signalement' },
      { labelKey: 'nav.profil', path: '/vendeur/profil' },
    ],
  },
  livreur: {
    titleKey: 'nav.profil',
    links: [
      { labelKey: 'nav.dashboard', path: '/livreur/dashboard' },
      { labelKey: 'nav.commandes', path: '/livreur/commandes' },
      { labelKey: 'nav.gains', path: '/livreur/gains' },
      { labelKey: 'nav.historique', path: '/livreur/historique' },
      { labelKey: 'nav.retours', path: '/livreur/retours' },
      { labelKey: 'nav.profil', path: '/livreur/profil' },
    ],
  },
  admin: {
    titleKey: 'nav.dashboard',
    links: [
      { labelKey: 'nav.dashboard', path: '/admin/dashboard' },
      { labelKey: 'nav.contact', href: 'mailto:viteecom@gmail.com' },
    ],
  },
}

const ROLE_CARDS = [
  { role: 'client', Icon: ShoppingCart, labelKey: 'role.client', descKey: 'role.client.desc', light: { bg: '#E1F5EE', color: '#0F6E56', border: '#9FE1CB' }, dark: { bg: 'rgba(29,158,117,0.12)', color: '#2DC491', border: 'rgba(45,196,145,0.2)' } },
  { role: 'vendeur', Icon: Store, labelKey: 'role.vendeur', descKey: 'role.vendeur.desc', light: { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' }, dark: { bg: 'rgba(186,117,23,0.12)', color: '#BA7517', border: 'rgba(186,117,23,0.2)' } },
  { role: 'livreur', Icon: Bike, labelKey: 'role.livreur', descKey: 'role.livreur.desc', light: { bg: '#FAECE7', color: '#993C1D', border: '#F5C4B3' }, dark: { bg: 'rgba(216,90,48,0.12)', color: '#D85A30', border: 'rgba(216,90,48,0.2)' } },
]

const THEME_OPTIONS = [
  { value: 'light', Icon: Sun, label: 'Clair' },
  { value: 'system', Icon: Monitor, label: 'Système' },
  { value: 'dark', Icon: Moon, label: 'Sombre' },
]

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { theme, setTheme, resolved } = useTheme()
  const { lang, setLang, t, languages } = useLang()
  const isDark = resolved === 'dark'

  if (HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null

  const role = user?.role || 'guest'
  const nav = ROLE_LINKS[role] || ROLE_LINKS.guest

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', isolation: 'isolate' }}
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
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('app.tagline')}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('app.description')}
            </p>
            <div className="flex gap-2">
              <a href="mailto:viteecom@gmail.com"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <Mail size={14} /> viteecom@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links — role-specific */}
          <div>
            <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t(nav.titleKey)}</h4>
            <div className="flex flex-col gap-1.5">
              {nav.links.map(link => (
                link.path ? (
                  <button key={link.labelKey} onClick={() => navigate(link.path)}
                    className="text-sm text-left font-medium cursor-pointer"
                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {t(link.labelKey)}
                  </button>
                ) : (
                  <a key={link.labelKey} href={link.href}
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                    {t(link.labelKey)}
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Third column: role cards (guest only) or ViteComm info (logged in) */}
          <div>
            {!user ? (
              <>
                <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('footer.join')}</h4>
                <div className="flex flex-col gap-1.5">
                  {ROLE_CARDS.map(card => {
                    const colors = isDark ? card.dark : card.light
                    return (
                      <button key={card.role} onClick={() => navigate(`/register?role=${card.role}`)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl text-left cursor-pointer"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <span className="text-lg"><card.Icon size={20} /></span>
                        <div>
                          <div className="text-xs font-black" style={{ color: colors.color }}>{t(card.labelKey)}</div>
                          <div className="text-[11px]" style={{ color: colors.color, opacity: 0.7 }}>{t(card.descKey)}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <button onClick={() => navigate('/cgu')}
                    className="flex items-center gap-1.5 text-xs font-medium text-left cursor-pointer"
                    style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                    <FileText size={13} /> {t('footer.cgu')}
                  </button>
                  <button onClick={() => navigate('/politique-confidentialite')}
                    className="flex items-center gap-1.5 text-xs font-medium text-left cursor-pointer"
                    style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                    <Shield size={13} /> {t('footer.privacy')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-xs font-black mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('footer.about')}</h4>
                <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>{t('footer.about.desc')}</p>
                  <div className="flex flex-col gap-1.5">
                    <a href="mailto:viteecom@gmail.com" className="flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: 'var(--accent)' }}><Mail size={13} /> {t('footer.support')}</a>
                    <button onClick={() => navigate('/accueil')}
                      className="flex items-center gap-1.5 text-xs font-medium text-left cursor-pointer"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                      <Home size={13} /> {t('footer.home')}
                    </button>
                    <button onClick={() => navigate('/cgu')}
                      className="flex items-center gap-1.5 text-xs font-medium text-left cursor-pointer"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                      <FileText size={13} /> {t('footer.cgu')}
                    </button>
                    <button onClick={() => navigate('/politique-confidentialite')}
                      className="flex items-center gap-1.5 text-xs font-medium text-left cursor-pointer"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none' }}>
                      <Shield size={13} /> {t('footer.privacy')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

        {/* ── Bottom section: Theme toggle + Language toggle + Copyright ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Theme + Language Toggle */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Theme */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('footer.theme')}</span>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                {THEME_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setTheme(opt.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{
                      background: theme === opt.value ? 'var(--accent)' : 'transparent',
                      color: theme === opt.value ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                    }}>
                    <span><opt.Icon size={14} /></span>
                    <span className="hidden sm:inline">{t(`footer.theme.${opt.value}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}><Globe size={12} className="inline align-middle" /> {t('footer.lang')}</span>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                {Object.entries(languages).map(([code, info]) => (
                  <button key={code} onClick={() => setLang(code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{
                      background: lang === code ? 'var(--accent)' : 'transparent',
                      color: lang === code ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                    }}>
                    <span>{info.flag}</span>
                    <span className="hidden sm:inline">{info.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  )
}
