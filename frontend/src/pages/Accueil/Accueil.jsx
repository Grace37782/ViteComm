import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import {
  ShoppingCart, MapPin, ShieldCheck, Banknote, Store, Zap,
  Motorbike, Sparkles, CheckCircle, Camera, Route, AlertTriangle,
  Package, KeyRound,
} from 'lucide-react'

// ─── Typewriter Hook ────────────────────────────────────────────────────────────
function useTypewriter(words, typingSpeed = 80, deletingSpeed = 40, pause = 2000) {
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = words[wordIndex]
    let timer

    if (!isDeleting && text === current) {
      timer = setTimeout(() => setIsDeleting(true), pause)
    } else if (isDeleting && text === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDeleting(false)
      setWordIndex((prev) => (prev + 1) % words.length)
    } else {
      timer = setTimeout(() => {
        setText(isDeleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1))
      }, isDeleting ? deletingSpeed : typingSpeed)
    }
    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pause])

  return text
}

// ─── Data ───────────────────────────────────────────────────────────────────────
const CITIES = ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'votre quartier']
// eslint-disable-next-line no-unused-vars
const ACTIONS = ['Acheter frais', 'Vendre en direct', 'Livrer par Zem']

const FEATURES = [
  { icon: ShoppingCart, titleKey: 'accueil.features.cart.title', descKey: 'accueil.features.cart.desc' },
  { icon: MapPin, titleKey: 'accueil.features.tracking.title', descKey: 'accueil.features.tracking.desc' },
  { icon: ShieldCheck, titleKey: 'accueil.features.code.title', descKey: 'accueil.features.code.desc' },
  { icon: Banknote, titleKey: 'accueil.features.payment.title', descKey: 'accueil.features.payment.desc' },
  { icon: Store, titleKey: 'accueil.features.store.title', descKey: 'accueil.features.store.desc' },
  { icon: Zap, titleKey: 'accueil.features.delivery.title', descKey: 'accueil.features.delivery.desc' },
]

const ECONOMICS = [
  { roleKey: 'accueil.pricing.client', icon: ShoppingCart, color: '#1D9E75', feeKey: 'accueil.pricing.client.fee', detailKey: 'accueil.pricing.client.detail', exampleKey: 'accueil.pricing.client.example' },
  { roleKey: 'accueil.pricing.vendor', icon: Store, color: '#BA7517', feeKey: 'accueil.pricing.vendor.fee', detailKey: 'accueil.pricing.vendor.detail', exampleKey: 'accueil.pricing.vendor.example' },
  { roleKey: 'accueil.pricing.driver', icon: Motorbike, color: '#D85A30', feeKey: 'accueil.pricing.driver.fee', detailKey: 'accueil.pricing.driver.detail', exampleKey: 'accueil.pricing.driver.example' },
]

const TESTIMONIALS = [
  { name: 'Amina K.', roleKey: 'accueil.testimonials.1.role', textKey: 'accueil.testimonials.1.text', Icon: ShoppingCart },
  { name: 'Ibrahim M.', roleKey: 'accueil.testimonials.2.role', textKey: 'accueil.testimonials.2.text', Icon: Store },
  { name: 'Kofi A.', roleKey: 'accueil.testimonials.3.role', textKey: 'accueil.testimonials.3.text', Icon: Motorbike },
]

const FAQ = [
  { qKey: 'accueil.faq.1.q', aKey: 'accueil.faq.1.a' },
  { qKey: 'accueil.faq.2.q', aKey: 'accueil.faq.2.a' },
  { qKey: 'accueil.faq.3.q', aKey: 'accueil.faq.3.a' },
  { qKey: 'accueil.faq.4.q', aKey: 'accueil.faq.4.a' },
  { qKey: 'accueil.faq.5.q', aKey: 'accueil.faq.5.a' },
]

// ─── Accordion ──────────────────────────────────────────────────────────────────
function FAQItem({ item, isDark, t }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        style={{ background: 'none', border: 'none' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t(item.qKey)}</span>
        <span className="text-lg transition-transform duration-300" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}>
        <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t(item.aKey)}</p>
      </div>
    </div>
  )
}

// ─── Mock Dashboard ─────────────────────────────────────────────────────────────
function MockDashboard({ isDark, t }) {
  const [tab, setTab] = useState('client')
  const tabs = [
    { id: 'client', label: t('accueil.mock.client'), color: '#1D9E75' },
    { id: 'vendeur', label: t('accueil.mock.vendor'), color: '#BA7517' },
    { id: 'livreur', label: t('accueil.mock.driver'), color: '#D85A30' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.4)' : '0 25px 60px rgba(0,0,0,0.08)' }}>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-3 text-xs font-bold transition-all cursor-pointer relative"
            style={{ background: 'none', border: 'none', color: tab === t.id ? t.color : 'var(--text-muted)' }}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: t.color }} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[260px]">
        {tab === 'client' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}><ShoppingCart size={18} color="#1D9E75" /></div>
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t('accueil.mock.order')}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.articles')}</div>
              </div>
              <div className="ml-auto px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75' }}>{t('accueil.mock.delivering')}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}><Motorbike size={12} color="#1D9E75" /></div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t('accueil.mock.driverName')}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '72%', background: '#1D9E75' }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.progress')}</div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(29,158,117,0.06)' }}>
              <span className="text-sm"><KeyRound size={14} color="#1D9E75" /></span>
              <span className="text-xs font-mono font-bold" style={{ color: '#1D9E75' }}>{t('accueil.mock.code')}</span>
            </div>
          </div>
        )}

        {tab === 'vendeur' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3" style={{ background: 'rgba(186,117,23,0.08)', border: `1px solid ${isDark ? 'rgba(186,117,23,0.15)' : 'rgba(186,117,23,0.1)'}` }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.dailySales')}</div>
                <div className="text-lg font-black" style={{ color: '#BA7517' }}>47 500 F</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(29,158,117,0.08)', border: `1px solid ${isDark ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)'}` }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.ordersCount')}</div>
                <div className="text-lg font-black" style={{ color: '#1D9E75' }}>12</div>
              </div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(216,90,48,0.06)', border: `1px solid ${isDark ? 'rgba(216,90,48,0.12)' : 'rgba(216,90,48,0.08)'}` }}>
              <span className="text-lg"><AlertTriangle size={18} color="#D85A30" /></span>
              <div>
                <div className="text-xs font-bold" style={{ color: '#D85A30' }}>{t('accueil.mock.lowStock')}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.lowStockDetail')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bananes Douces × 3</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>6 000 F</span>
              </div>
              <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tomates × 5</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>2 500 F</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'livreur' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(216,90,48,0.08)', border: `1px solid ${isDark ? 'rgba(216,90,48,0.15)' : 'rgba(216,90,48,0.1)'}` }}>
              <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.dailyEarnings')}</div>
              <div className="text-lg font-black" style={{ color: '#D85A30' }}>8 200 F</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.trips')}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.12)' }}><Package size={13} color="#D85A30" /></div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Commande #1851</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Ouando → Haie-Vivier</div>
                  </div>
                </div>
                <div className="text-xs font-bold" style={{ color: '#D85A30' }}>600 F</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(186,117,23,0.12)' }}><Package size={13} color="#BA7517" /></div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Commande #1849</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Saint-Michel → Cadjèhoun</div>
                </div>
                <div className="ml-auto text-xs font-bold" style={{ color: '#D85A30' }}>450 F</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(216,90,48,0.06)' }}>
              <span className="text-sm"><Route size={14} color="#D85A30" /></span>
              <span className="text-[11px] font-medium" style={{ color: '#D85A30' }}>{t('accueil.mock.route')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
const getRoleTheme = (id, isDark) => ({
  client: {
    bg: isDark ? 'rgba(29,158,117,0.08)' : '#E1F5EE',
    border: isDark ? 'rgba(45,196,145,0.25)' : '#9FE1CB',
    tagBg: isDark ? 'rgba(45,196,145,0.15)' : '#1D9E7520',
    tagColor: isDark ? '#2DC491' : '#0F6E56',
    ctaBg: '#1D9E75',
    glow: 'rgba(29,158,117,0.3)',
  },
  vendeur: {
    bg: isDark ? 'rgba(186,117,23,0.08)' : '#FAEEDA',
    border: isDark ? 'rgba(243,168,59,0.25)' : '#FAC775',
    tagBg: isDark ? 'rgba(243,168,59,0.15)' : '#BA751720',
    tagColor: isDark ? '#F3A83B' : '#854F0B',
    ctaBg: '#BA7517',
    glow: 'rgba(243,168,59,0.3)',
  },
  livreur: {
    bg: isDark ? 'rgba(216,90,48,0.08)' : '#FAECE7',
    border: isDark ? 'rgba(232,125,85,0.25)' : '#F5C4B3',
    tagBg: isDark ? 'rgba(232,125,85,0.15)' : '#D85A3020',
    tagColor: isDark ? '#E87D55' : '#993C1D',
    ctaBg: '#D85A30',
    glow: 'rgba(232,125,85,0.3)',
  },
}[id])

const roles = [
  { id: 'client', Icon: ShoppingCart, nomKey: 'accueil.roles.client.nom', descKey: 'accueil.roles.client.desc', features: ['accueil.roles.client.f1', 'accueil.roles.client.f2', 'accueil.roles.client.f3'], tagKey: 'accueil.roles.client.tag', route: '/register?role=client' },
  { id: 'vendeur', Icon: Store, nomKey: 'accueil.roles.vendor.nom', descKey: 'accueil.roles.vendor.desc', features: ['accueil.roles.vendor.f1', 'accueil.roles.vendor.f2', 'accueil.roles.vendor.f3'], tagKey: 'accueil.roles.vendor.tag', route: '/register?role=vendeur' },
  { id: 'livreur', Icon: Motorbike, nomKey: 'accueil.roles.driver.nom', descKey: 'accueil.roles.driver.desc', features: ['accueil.roles.driver.f1', 'accueil.roles.driver.f2', 'accueil.roles.driver.f3'], tagKey: 'accueil.roles.driver.tag', route: '/register?role=livreur' },
]

export default function Accueil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'

  const typedCity = useTypewriter(CITIES, 80, 40, 2200)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const navLinks = [
    { label: t('accueil.nav.features'), id: 'features' },
    { label: t('accueil.nav.ecosystem'), id: 'ecosystem' },
    { label: t('accueil.nav.pricing'), id: 'pricing' },
    { label: t('accueil.nav.faq'), id: 'faq' },
  ]

  return (
    <div className="w-full font-sans overflow-x-hidden" style={{ background: 'var(--bg)' }}>

      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? (isDark ? 'rgba(18,19,17,0.92)' : 'rgba(255,255,255,0.92)')
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none',
        }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: isDark ? 'rgba(45,196,145,0.15)' : '#1D9E75', color: '#fff' }}>V</div>
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>ViteComm</span>
          </div>

          <div className="hidden md:flex items-center gap-5">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                {l.label}
              </button>
            ))}

            <div className="w-px h-4 mx-1" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => navigate('/connect')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold cursor-pointer transition-all"
              style={{ background: 'none', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: 'var(--text-primary)' }}>
              <span className="hidden sm:inline">{t('accueil.nav.login')}</span>
              <span className="sm:hidden">{t('accueil.nav.loginShort')}</span>
            </button>
            <button onClick={() => navigate('/register')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold cursor-pointer transition-all"
              style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
              {t('accueil.nav.join')}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-14 pb-16 sm:pt-24 sm:pb-28"
        style={{ background: isDark ? 'linear-gradient(135deg, #0F2B1C 0%, #143D2C 50%, #164032 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)', isolation: 'isolate' }}>

        {/* SVG grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.15 : 0.1 }}>
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="hero-grid-lg" width="240" height="240" patternUnits="userSpaceOnUse">
              <path d="M 240 0 L 0 0 0 240" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="white" stop-opacity="1" />
              <stop offset="30%" stop-color="white" stop-opacity="0.75" />
              <stop offset="100%" stop-color="white" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="dot-glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#2DC491" stop-opacity="1" />
              <stop offset="30%" stop-color="#2DC491" stop-opacity="0.75" />
              <stop offset="100%" stop-color="#2DC491" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="dot-glow-strong" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="white" stop-opacity="1" />
              <stop offset="25%" stop-color="white" stop-opacity="0.8" />
              <stop offset="100%" stop-color="white" stop-opacity="0" />
            </radialGradient>
          </defs>
          {/* Base grid */}
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
          <rect width="100%" height="100%" fill="url(#hero-grid-lg)" />

          {/* ── Vertical grid line glow pulses (subtle) ── */}
          <circle r="6" fill="url(#dot-glow)" opacity="0.4">
            <animateMotion dur="12s" repeatCount="indefinite" path="M120,0 L120,800" />
            <animate attributeName="opacity" values="0;0.35;0.35;0" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle r="5.5" fill="url(#dot-glow-green)" opacity="0.3">
            <animateMotion dur="15s" repeatCount="indefinite" path="M360,0 L360,800" begin="4s" />
            <animate attributeName="opacity" values="0;0.3;0.3;0" dur="15s" repeatCount="indefinite" begin="4s" />
          </circle>
          <circle r="6.5" fill="url(#dot-glow)" opacity="0.3">
            <animateMotion dur="18s" repeatCount="indefinite" path="M600,0 L600,800" begin="7s" />
            <animate attributeName="opacity" values="0;0.3;0.3;0" dur="18s" repeatCount="indefinite" begin="7s" />
          </circle>
          <circle r="5" fill="url(#dot-glow-green)" opacity="0.25">
            <animateMotion dur="14s" repeatCount="indefinite" path="M840,0 L840,800" begin="2s" />
            <animate attributeName="opacity" values="0;0.25;0.25;0" dur="14s" repeatCount="indefinite" begin="2s" />
          </circle>

          {/* ── Horizontal grid line glow pulses (subtle) ── */}
          <circle r="6" fill="url(#dot-glow)" opacity="0.35">
            <animateMotion dur="14s" repeatCount="indefinite" path="M0,60 L1600,60" />
            <animate attributeName="opacity" values="0;0.3;0.3;0" dur="14s" repeatCount="indefinite" />
          </circle>
          <circle r="5.5" fill="url(#dot-glow-green)" opacity="0.3">
            <animateMotion dur="16s" repeatCount="indefinite" path="M0,180 L1600,180" begin="5s" />
            <animate attributeName="opacity" values="0;0.25;0.25;0" dur="16s" repeatCount="indefinite" begin="5s" />
          </circle>
          <circle r="6" fill="url(#dot-glow)" opacity="0.25">
            <animateMotion dur="20s" repeatCount="indefinite" path="M0,300 L1600,300" begin="9s" />
            <animate attributeName="opacity" values="0;0.25;0.25;0" dur="20s" repeatCount="indefinite" begin="9s" />
          </circle>

          {/* ── Curve 1 ── */}
          <path id="curve1" d="M0,80 Q200,40 400,100 T800,60 T1200,90 T1600,50" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
          <circle r="9" fill="url(#dot-glow-strong)" opacity="0.4">
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
              <mpath href="#curve1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.4;0.4;0" dur="9s" repeatCount="indefinite" />
          </circle>

          {/* ── Curve 2 ── */}
          <path id="curve2" d="M0,160 Q300,120 600,180 T1200,140 T1800,170" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
          <circle r="8.5" fill="url(#dot-glow-strong)" opacity="0.35">
            <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" begin="3s">
              <mpath href="#curve2" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.35;0.35;0" dur="11s" repeatCount="indefinite" begin="3s" />
          </circle>

          {/* ── Curve 3 ── */}
          <path id="curve3" d="M0,280 Q250,240 500,290 T1000,260 T1500,280" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
          <circle r="8.5" fill="url(#dot-glow-strong)" opacity="0.3">
            <animateMotion dur="13s" repeatCount="indefinite" rotate="auto" begin="5s">
              <mpath href="#curve3" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.3;0.3;0" dur="13s" repeatCount="indefinite" begin="5s" />
          </circle>

          {/* ── Pulsing data-point dots ── */}
          <circle cx="400" cy="100" r="3" fill="white" opacity="0.3">
            <animate attributeName="opacity" values="0.1;0.35;0.1" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="800" cy="60" r="3.5" fill="white" opacity="0.25">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="10s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle cx="1200" cy="90" r="2.5" fill="white" opacity="0.25">
            <animate attributeName="opacity" values="0.08;0.28;0.08" dur="9s" repeatCount="indefinite" begin="4s" />
          </circle>
          <circle cx="600" cy="180" r="2" fill="white" opacity="0.2">
            <animate attributeName="opacity" values="0.08;0.25;0.08" dur="11s" repeatCount="indefinite" begin="1s" />
          </circle>
        </svg>

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(45,196,145,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(45,196,145,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
            style={{ background: isDark ? 'rgba(45,196,145,0.12)' : 'rgba(255,255,255,0.16)', border: `1px solid ${isDark ? 'rgba(45,196,145,0.2)' : 'rgba(255,255,255,0.3)'}`, color: '#fff' }}>
            <Sparkles size={14} className="inline-block mr-1.5" /> {t('accueil.hero.badge')}
          </div>

          {/* Shiny ViteComm brand title — slow subtle right-to-left sweep */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-none mb-4 tracking-tight">
            <span className="relative inline-block">
              ViteComm
              <span className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(270deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'vitecommSweep 8s ease-in-out 3s infinite',
              }}>ViteComm</span>
            </span>
          </h1>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-5 tracking-tight">
            {t('accueil.hero.title', { city: '' }).replace('  ', ' ')}{' '}
            <span className="inline-block min-w-[120px] sm:min-w-[180px]" style={{ color: isDark ? '#2DC491' : '#A8EDCA' }}>
              {typedCity}<span className="animate-pulse">|</span>
            </span>
            <br />{t('accueil.hero.subtitle')}
          </h2>

          <p className="text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.8)' }}>
            {t('accueil.hero.desc')}
          </p>

          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: '#fff', color: '#1D9E75', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              {t('accueil.hero.cta1')}
            </button>
            <button onClick={() => scrollTo('features')}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 hover:scale-105"
              style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', color: '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)'}` }}>
              {t('accueil.hero.cta2')}
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 flex-wrap">
            {[
              { Icon: CheckCircle, textKey: 'accueil.hero.pay' },
              { Icon: MapPin, textKey: 'accueil.hero.tracking' },
              { Icon: Camera, textKey: 'accueil.hero.photo' },
              { Icon: Zap, textKey: 'accueil.hero.delivery' },
            ].map(b => (
              <span key={b.textKey} className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)' }}>
                <b.Icon size={11} /> {t(b.textKey)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ecosystem Overview ──────────────────────────────────────── */}
      <section id="ecosystem" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.eco.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.eco.desc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { Icon: ShoppingCart, titleKey: 'accueil.eco.client', descKey: 'accueil.eco.client.desc', color: '#1D9E75', features: ['accueil.eco.client.f1', 'accueil.eco.client.f2', 'accueil.eco.client.f3'] },
              { Icon: Store, titleKey: 'accueil.eco.vendor', descKey: 'accueil.eco.vendor.desc', color: '#BA7517', features: ['accueil.eco.vendor.f1', 'accueil.eco.vendor.f2', 'accueil.eco.vendor.f3'] },
              { Icon: Motorbike, titleKey: 'accueil.eco.driver', descKey: 'accueil.eco.driver.desc', color: '#D85A30', features: ['accueil.eco.driver.f1', 'accueil.eco.driver.f2', 'accueil.eco.driver.f3'] },
            ].map(item => (
              <div key={item.titleKey} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}><item.Icon size={24} color={item.color} /></div>
                <h3 className="text-base font-black mb-1.5" style={{ color: item.color }}>{t(item.titleKey)}</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{t(item.descKey)}</p>
                <div className="flex flex-col gap-1">
                  {item.features.map(f => (
                    <span key={f} className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>✓ {t(f)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mock Dashboard ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.mock.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.mock.desc')}</p>
          </div>
          <MockDashboard isDark={isDark} t={t} />
        </div>
      </section>

      {/* ─── Role Cards ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.roles.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.roles.desc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {roles.map(r => {
              const rt = getRoleTheme(r.id, isDark)
              return (
                <button key={r.id} onClick={() => navigate(r.route)}
                  className="rounded-2xl border-2 p-6 text-left flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-95 cursor-pointer hover:border-current"
                  style={{ background: rt.bg, borderColor: rt.border, '--tw-shadow-color': rt.glow }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="leading-none"><r.Icon size={32} color={rt.tagColor} /></span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full mt-1" style={{ background: rt.tagBg, color: rt.tagColor }}>{t(r.tagKey)}</span>
                  </div>
                  <p className="text-base font-black mb-2" style={{ color: rt.tagColor }}>{t(r.nomKey)}</p>
                  <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: 'var(--text-secondary)' }}>{t(r.descKey)}</p>
                  <div className="flex flex-col gap-1 mb-4">
                    {r.features.map(f => (
                      <span key={f} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>✓ {t(f)}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center py-2.5 px-4 rounded-xl text-white text-xs font-bold mt-auto" style={{ background: rt.ctaBg }}>
                    {t('accueil.roles.cta')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.features.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.features.desc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.titleKey} className="rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="mb-3" style={{ color: 'var(--text-primary)' }}><f.icon size={22} /></div>
                <h3 className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>{t(f.titleKey)}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Economics ──────────────────────────────────────── */}
      <section id="pricing" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.pricing.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.pricing.desc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ECONOMICS.map(e => (
              <div key={e.roleKey} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${e.color}15` }}><e.icon size={20} color={e.color} /></div>
                  <div>
                    <div className="text-sm font-black" style={{ color: e.color }}>{t(e.roleKey)}</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t(e.feeKey)}</div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{t(e.detailKey)}</p>
                <div className="text-[11px] font-mono px-3 py-2 rounded-lg" style={{ background: `${e.color}08`, color: e.color }}>
                  {t(e.exampleKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.testimonials.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.testimonials.desc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(testimonial => (
              <div key={testimonial.name} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="mb-3" style={{ color: 'var(--text-primary)' }}><testimonial.Icon size={22} /></div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>"{t(testimonial.textKey)}"</p>
                <div>
                  <div className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{testimonial.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t(testimonial.roleKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('accueil.faq.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('accueil.faq.desc')}</p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => <FAQItem key={i} item={item} isDark={isDark} t={t} />)}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-12 sm:py-16 md:py-20"
        style={{ background: isDark ? 'linear-gradient(135deg, #0F2B1C 0%, #143D2C 50%, #164032 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)', isolation: 'isolate' }}>

        {/* SVG grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.12 : 0.08 }}>
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="cta-grid-lg" width="240" height="240" patternUnits="userSpaceOnUse">
              <path d="M 240 0 L 0 0 0 240" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <radialGradient id="cta-dot-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="white" stop-opacity="1" />
              <stop offset="30%" stop-color="white" stop-opacity="0.75" />
              <stop offset="100%" stop-color="white" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
          <rect width="100%" height="100%" fill="url(#cta-grid-lg)" />
          {/* Vertical glow pulse */}
          <circle r="5.5" fill="url(#cta-dot-glow)" opacity="0.3">
            <animateMotion dur="14s" repeatCount="indefinite" path="M200,0 L200,500" />
            <animate attributeName="opacity" values="0;0.25;0.25;0" dur="14s" repeatCount="indefinite" />
          </circle>
          {/* Horizontal glow pulse */}
          <circle r="5.5" fill="url(#cta-dot-glow)" opacity="0.3">
            <animateMotion dur="16s" repeatCount="indefinite" path="M0,120 L1600,120" begin="5s" />
            <animate attributeName="opacity" values="0;0.25;0.25;0" dur="16s" repeatCount="indefinite" begin="5s" />
          </circle>
          <path id="cta-curve1" d="M0,60 Q200,30 400,70 T800,40 T1200,65 T1600,35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
          <circle r="6" fill="url(#cta-dot-glow)" opacity="0.3">
            <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
              <mpath href="#cta-curve1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.3;0.3;0" dur="12s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(45,196,145,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            {t('accueil.cta.title')}
          </h2>
          <p className="text-xs sm:text-sm mb-6 sm:mb-8" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)' }}>
            {t('accueil.cta.desc')}
          </p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: '#fff', color: '#1D9E75', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              {t('accueil.cta.cta1')}
            </button>
            <button onClick={() => navigate('/connect')}
              className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 hover:scale-105"
              style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', color: '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)'}` }}>
              {t('accueil.cta.cta2')}
            </button>
          </div>
        </div>
      </section>

      {/* Global keyframe for ViteComm title sweep */}
      <style>{`
        @keyframes vitecommSweep {
          0%, 100% { background-position: 300% 0; }
          40%, 60% { background-position: -100% 0; }
        }
      `}</style>

    </div>
  )
}
