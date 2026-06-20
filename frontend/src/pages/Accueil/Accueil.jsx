import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
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
  { icon: ShoppingCart, title: 'Panier multi-étals', desc: 'Commandez de plusieurs marchands en une seule course.' },
  { icon: MapPin, title: 'Suivi en direct', desc: 'Suivez votre livreur en temps réel sur la carte.' },
  { icon: ShieldCheck, title: 'Code de confirmation', desc: 'Sécurisez chaque échange avec un code unique.' },
  { icon: Banknote, title: 'Paiement sécurisé', desc: 'Payez par Mobile Money directement depuis l\'application.' },
  { icon: Store, title: 'Étal en ligne', desc: 'Vendez vos produits sans gérer la logistique.' },
  { icon: Zap, title: 'Livraison zemidjan', desc: 'Livraison rapide par motards locaux certifiés.' },
]

const ECONOMICS = [
  { role: 'Client', icon: ShoppingCart, color: '#1D9E75', fee: 'Frais de livraison', detail: 'Basés sur la distance, à partir de 300 F', example: 'Dantokpa → Akpakpa ≈ 500 F' },
  { role: 'Vendeur', icon: Store, color: '#BA7517', fee: '0.6% de commission', detail: 'Uniquement sur les transactions finalisées', example: '10 000 F de ventes → 60 F de frais' },
  { role: 'Livreur', icon: Motorbike, color: '#D85A30', fee: '100% des frais de livraison', detail: 'Gardez l\'intégralité, petite licence de service', example: 'Course à 500 F → vous gardez 500 F' },
]

const TESTIMONIALS = [
  { name: 'Amina K.', role: 'Cliente', text: 'Je commande à Dantokpa et reçois en 20 minutes. Les zemidjans sont fiables !', Icon: ShoppingCart },
  { name: 'Ibrahim M.', role: 'Vendeur', text: 'Mes ventes ont augmenté de 40% depuis que je suis sur ViteComm.', Icon: Store },
  { name: 'Kofi A.', role: 'Livreur', text: 'Je gagne ma vie librement, je choisis mes horaires et mes courses.', Icon: Motorbike },
]

const FAQ = [
  { q: 'Comment ça marche ?', a: 'Créez un compte gratuit, choisissez votre profil (client, vendeur ou livreur) et commencez à utiliser la plateforme immédiatement.' },
  { q: 'Quels sont les frais ?', a: 'Les clients paient uniquement les frais de livraison (à partir de 300 F). Les vendeurs paient 0.6% de commission sur les ventes finalisées. Les livreurs gardent 100% des frais de livraison.' },
  { q: 'Comment est-ce sécurisé ?', a: 'Chaque transaction est protégée par un code de confirmation unique. Le paiement en ligne via Mobile Money élimine les risques de fraude.' },
  { q: 'Dans quelles villes ?', a: 'Nous opérons actuellement à Cotonou, Porto-Novo, Parakou et Abomey-Calavi. D\'autres villes arrivent bientôt.' },
  { q: 'Puis-je devenir livreur ?', a: 'Oui ! Il vous faut un zemidjan ou un véhicule, et une inscription gratuite. Vous commencez à livrer dans les 24h.' },
]

// ─── Accordion ──────────────────────────────────────────────────────────────────
function FAQItem({ item, isDark }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        style={{ background: 'none', border: 'none' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.q}</span>
        <span className="text-lg transition-transform duration-300" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}>
        <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
      </div>
    </div>
  )
}

// ─── Mock Dashboard ─────────────────────────────────────────────────────────────
function MockDashboard({ isDark }) {
  const [tab, setTab] = useState('client')
  const tabs = [
    { id: 'client', label: 'Client', color: '#1D9E75' },
    { id: 'vendeur', label: 'Vendeur', color: '#BA7517' },
    { id: 'livreur', label: 'Livreur', color: '#D85A30' },
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
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Commande #1847</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>3 articles · Dantokpa → Akpakpa</div>
              </div>
              <div className="ml-auto px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75' }}>En livraison</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}><Motorbike size={12} color="#1D9E75" /></div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Kofi A. — Zemidjan</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '72%', background: '#1D9E75' }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>72% du trajet · Arrivée estimée 12 min</div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(29,158,117,0.06)' }}>
              <span className="text-sm"><KeyRound size={14} color="#1D9E75" /></span>
              <span className="text-xs font-mono font-bold" style={{ color: '#1D9E75' }}>Code : 4-8-2-9</span>
            </div>
          </div>
        )}

        {tab === 'vendeur' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3" style={{ background: 'rgba(186,117,23,0.08)', border: `1px solid ${isDark ? 'rgba(186,117,23,0.15)' : 'rgba(186,117,23,0.1)'}` }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Ventes du jour</div>
                <div className="text-lg font-black" style={{ color: '#BA7517' }}>47 500 F</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(29,158,117,0.08)', border: `1px solid ${isDark ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)'}` }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Commandes</div>
                <div className="text-lg font-black" style={{ color: '#1D9E75' }}>12</div>
              </div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(216,90,48,0.06)', border: `1px solid ${isDark ? 'rgba(216,90,48,0.12)' : 'rgba(216,90,48,0.08)'}` }}>
              <span className="text-lg"><AlertTriangle size={18} color="#D85A30" /></span>
              <div>
                <div className="text-xs font-bold" style={{ color: '#D85A30' }}>Stock bas</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Gombo Frais — 2 kg restants</div>
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
              <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Gains du jour</div>
              <div className="text-lg font-black" style={{ color: '#D85A30' }}>8 200 F</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>7 courses · Meilleur jour cette semaine</div>
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
              <span className="text-[11px] font-medium" style={{ color: '#D85A30' }}>Itinéraire optimisé — 3 arrêts</span>
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
  { id: 'client', Icon: ShoppingCart, nom: 'Je suis client', desc: 'Commandez vos produits frais livrés directement à votre porte.', features: ['Panier multi-étals', 'Suivi en direct', 'Paiement sécurisé'], tag: 'Gratuit', route: '/register?role=client' },
  { id: 'vendeur', Icon: Store, nom: 'Je suis vendeur', desc: 'Vendez vos produits sans vous occuper de la livraison.', features: ['Étal en ligne', 'Gestion des stocks', 'Paiement sécurisé'], tag: 'Étal virtuel', route: '/register?role=vendeur' },
  { id: 'livreur', Icon: Motorbike, nom: 'Je suis livreur', desc: 'Collectez et livrez les commandes. Gagnez à chaque course.', features: ['Itinéraire optimisé', 'Commissions directes', 'Carte GPS intégrée'], tag: 'Gagner plus', route: '/register?role=livreur' },
]

export default function Accueil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
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
    { label: 'Fonctionnalités', id: 'features' },
    { label: 'Écosystème', id: 'ecosystem' },
    { label: 'Tarifs', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ]

  return (
    <div className="w-full font-sans" style={{ background: 'var(--bg)' }}>

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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: isDark ? 'rgba(45,196,145,0.15)' : '#1D9E75', color: '#fff' }}>V</div>
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>ViteComm</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => navigate('/connect')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold cursor-pointer transition-all"
              style={{ background: 'none', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: 'var(--text-primary)' }}>
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Connexion</span>
            </button>
            <button onClick={() => navigate('/register')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold cursor-pointer transition-all"
              style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
              Rejoindre
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-14 pb-16 sm:pt-24 sm:pb-28"
        style={{ background: isDark ? 'linear-gradient(135deg, #0F2B1C 0%, #143D2C 50%, #164032 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>

        {/* SVG grid lines — animated glow pulses traveling along curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.15 : 0.1 }}>
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="hero-grid-lg" width="240" height="240" patternUnits="userSpaceOnUse">
              <path d="M 240 0 L 0 0 0 240" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Base grid */}
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
          <rect width="100%" height="100%" fill="url(#hero-grid-lg)" />

          {/* ── Vertical grid line glow pulses ── */}
          <line id="vline1" x1="120" y1="0" x2="120" y2="100%" stroke="none" />
          <circle r="3" fill="white" opacity="0.7" filter="url(#glow-strong)">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M120,0 L120,800" />
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <line id="vline2" x1="360" y1="0" x2="360" y2="100%" stroke="none" />
          <circle r="2.5" fill="#2DC491" opacity="0.6" filter="url(#glow)">
            <animateMotion dur="4.5s" repeatCount="indefinite" path="M360,0 L360,800" begin="1.2s" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="4.5s" repeatCount="indefinite" begin="1.2s" />
          </circle>
          <line id="vline3" x1="600" y1="0" x2="600" y2="100%" stroke="none" />
          <circle r="3.5" fill="white" opacity="0.6" filter="url(#glow-strong)">
            <animateMotion dur="5s" repeatCount="indefinite" path="M600,0 L600,800" begin="2.5s" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="5s" repeatCount="indefinite" begin="2.5s" />
          </circle>
          <line id="vline4" x1="840" y1="0" x2="840" y2="100%" stroke="none" />
          <circle r="2" fill="#2DC491" opacity="0.5" filter="url(#glow)">
            <animateMotion dur="6s" repeatCount="indefinite" path="M840,0 L840,800" begin="0.8s" />
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="6s" repeatCount="indefinite" begin="0.8s" />
          </circle>

          {/* ── Horizontal grid line glow pulses ── */}
          <line id="hline1" x1="0" y1="60" x2="100%" y2="60" stroke="none" />
          <circle r="3" fill="white" opacity="0.7" filter="url(#glow-strong)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M0,60 L1600,60" />
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="4s" repeatCount="indefinite" />
          </circle>
          <line id="hline2" x1="0" y1="180" x2="100%" y2="180" stroke="none" />
          <circle r="2.5" fill="#2DC491" opacity="0.6" filter="url(#glow)">
            <animateMotion dur="5.5s" repeatCount="indefinite" path="M0,180 L1600,180" begin="1.8s" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="5.5s" repeatCount="indefinite" begin="1.8s" />
          </circle>
          <line id="hline3" x1="0" y1="300" x2="100%" y2="300" stroke="none" />
          <circle r="3" fill="white" opacity="0.55" filter="url(#glow-strong)">
            <animateMotion dur="6.5s" repeatCount="indefinite" path="M0,300 L1600,300" begin="3s" />
            <animate attributeName="opacity" values="0;0.65;0.65;0" dur="6.5s" repeatCount="indefinite" begin="3s" />
          </circle>

          {/* ── Curve 1: thin base + glow pulse traveling along path ── */}
          <path id="curve1" d="M0,80 Q200,40 400,100 T800,60 T1200,90 T1600,50" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
          <circle r="4" fill="white" opacity="0.8" filter="url(#glow-strong)">
            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
              <mpath href="#curve1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="2.5" fill="#2DC491" opacity="0.6" filter="url(#glow)">
            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto" begin="1.5s">
              <mpath href="#curve1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="4s" repeatCount="indefinite" begin="1.5s" />
          </circle>

          {/* ── Curve 2: glow pulse with different timing ── */}
          <path id="curve2" d="M0,160 Q300,120 600,180 T1200,140 T1800,170" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
          <circle r="3.5" fill="white" opacity="0.7" filter="url(#glow-strong)">
            <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" begin="2s">
              <mpath href="#curve2" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="5.5s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle r="2" fill="#2DC491" opacity="0.5" filter="url(#glow)">
            <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" begin="4s">
              <mpath href="#curve2" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.6;0.6;0" dur="5.5s" repeatCount="indefinite" begin="4s" />
          </circle>

          {/* ── Curve 3: slow pulse ── */}
          <path id="curve3" d="M0,280 Q250,240 500,290 T1000,260 T1500,280" fill="none" stroke="white" strokeWidth="0.6" opacity="0.12" />
          <circle r="3" fill="white" opacity="0.6" filter="url(#glow-strong)">
            <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" begin="1s">
              <mpath href="#curve3" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="7s" repeatCount="indefinite" begin="1s" />
          </circle>

          {/* ── Pulsing data-point dots ── */}
          <circle cx="400" cy="100" r="4" fill="white" opacity="0.5" filter="url(#glow)">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="800" cy="60" r="5" fill="white" opacity="0.4" filter="url(#glow)">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="1200" cy="90" r="4" fill="white" opacity="0.35" filter="url(#glow)">
            <animate attributeName="opacity" values="0.15;0.6;0.15" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="180" r="3" fill="white" opacity="0.35" filter="url(#glow)">
            <animate attributeName="opacity" values="0.2;0.55;0.2" dur="5s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'rgba(45,196,145,0.08)' : 'rgba(255,255,255,0.08)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'rgba(45,196,145,0.05)' : 'rgba(255,255,255,0.06)', filter: 'blur(60px)' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
            style={{ background: isDark ? 'rgba(45,196,145,0.12)' : 'rgba(255,255,255,0.16)', border: `1px solid ${isDark ? 'rgba(45,196,145,0.2)' : 'rgba(255,255,255,0.3)'}`, color: '#fff' }}>
            <Sparkles size={14} className="inline-block mr-1.5" /> La première marketplace locale au Bénin
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
            Le marché de{' '}
            <span className="inline-block min-w-[120px] sm:min-w-[180px]" style={{ color: isDark ? '#2DC491' : '#A8EDCA' }}>
              {typedCity}<span className="animate-pulse">|</span>
            </span>
            <br />livré chez vous
          </h2>

          <p className="text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.8)' }}>
            ViteComm connecte les clients, les marchands locaux et les conducteurs de zemidjans
            pour des livraisons de produits frais, rapides et équitables.
          </p>

          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: '#fff', color: '#1D9E75', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              Commencer gratuitement →
            </button>
            <button onClick={() => scrollTo('features')}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 hover:scale-105"
              style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', color: '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)'}` }}>
              Découvrir →
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 flex-wrap">
            {[
              { Icon: CheckCircle, text: 'Paiement sécurisé' },
              { Icon: MapPin, text: 'Suivi en temps réel' },
              { Icon: Camera, text: 'Photo de collecte' },
              { Icon: Zap, text: 'Livraison zemidjan' },
            ].map(b => (
              <span key={b.text} className="text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 sm:gap-1.5" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)' }}>
                <b.Icon size={11} /> {b.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ecosystem Overview ──────────────────────────────────────── */}
      <section id="ecosystem" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Un écosystème complet</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Trois profils, une seule plateforme, zéro friction.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { Icon: ShoppingCart, title: 'Client', desc: 'Commandez de Dantokpa, Missèbo ou Ouando. Livraison en 20-40 min.', color: '#1D9E75', features: ['Panier multi-étals', 'Suivi GPS', 'Code de confirmation'] },
              { Icon: Store, title: 'Vendeur', desc: 'Vendez en ligne sans gérer la livraison. Revenus instantanés.', color: '#BA7517', features: ['Étal virtuel', 'Gestion stocks', '0.6% commission'] },
              { Icon: Motorbike, title: 'Livreur', desc: 'Gagnez à chaque course. Choisissez vos horaires.', color: '#D85A30', features: ['100% frais gardés', 'Itinéraire optimisé', 'Paiement quotidien'] },
            ].map(item => (
              <div key={item.title} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}><item.Icon size={24} color={item.color} /></div>
                <h3 className="text-base font-black mb-1.5" style={{ color: item.color }}>{item.title}</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                <div className="flex flex-col gap-1">
                  {item.features.map(f => (
                    <span key={f} className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>✓ {f}</span>
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
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Découvrez l'expérience</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Explorez ce que chaque profil voit au quotidien.</p>
          </div>
          <MockDashboard isDark={isDark} />
        </div>
      </section>

      {/* ─── Role Cards ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Choisissez votre profil</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Première visite ? Créez votre compte gratuit en moins d'une minute.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {roles.map(r => {
              const t = getRoleTheme(r.id, isDark)
              return (
                <button key={r.id} onClick={() => navigate(r.route)}
                  className="rounded-2xl border-2 p-6 text-left flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-95 cursor-pointer hover:border-current"
                  style={{ background: t.bg, borderColor: t.border, '--tw-shadow-color': t.glow }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="leading-none"><r.Icon size={32} color={t.tagColor} /></span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full mt-1" style={{ background: t.tagBg, color: t.tagColor }}>{r.tag}</span>
                  </div>
                  <p className="text-base font-black mb-2" style={{ color: t.tagColor }}>{r.nom}</p>
                  <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
                  <div className="flex flex-col gap-1 mb-4">
                    {r.features.map(f => (
                      <span key={f} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>✓ {f}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center py-2.5 px-4 rounded-xl text-white text-xs font-bold mt-auto" style={{ background: t.ctaBg }}>
                    S'inscrire →
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
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Pourquoi ViteComm ?</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Conçu pour le marché béninois, pensé pour la simplicité.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="mb-3" style={{ color: 'var(--text-primary)' }}><f.icon size={22} /></div>
                <h3 className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Economics ──────────────────────────────────────── */}
      <section id="pricing" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Tarifs transparents</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pas de surprises. Pas d'abonnement. Payez uniquement quand vous utilisez.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ECONOMICS.map(e => (
              <div key={e.role} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${e.color}15` }}><e.icon size={20} color={e.color} /></div>
                  <div>
                    <div className="text-sm font-black" style={{ color: e.color }}>{e.role}</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{e.fee}</div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{e.detail}</p>
                <div className="text-[11px] font-mono px-3 py-2 rounded-lg" style={{ background: `${e.color}08`, color: e.color }}>
                  {e.example}
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
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Ils nous font confiance</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Des milliers de Béninois utilisent ViteComm au quotidien.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="mb-3" style={{ color: 'var(--text-primary)' }}><t.Icon size={22} /></div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>"{t.text}"</p>
                <div>
                  <div className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
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
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Questions fréquentes</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tout ce que vous devez savoir avant de commencer.</p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => <FAQItem key={i} item={item} isDark={isDark} />)}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-12 sm:py-16 md:py-20"
        style={{ background: isDark ? 'linear-gradient(135deg, #0F2B1C 0%, #143D2C 50%, #164032 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>

        {/* SVG grid lines — matching hero */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.12 : 0.08 }}>
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="cta-grid-lg" width="240" height="240" patternUnits="userSpaceOnUse">
              <path d="M 240 0 L 0 0 0 240" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <filter id="cta-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
          <rect width="100%" height="100%" fill="url(#cta-grid-lg)" />
          {/* Vertical glow pulse */}
          <circle r="2.5" fill="white" opacity="0.6" filter="url(#cta-glow)">
            <animateMotion dur="4.5s" repeatCount="indefinite" path="M200,0 L200,500" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="4.5s" repeatCount="indefinite" />
          </circle>
          {/* Horizontal glow pulse */}
          <circle r="2.5" fill="white" opacity="0.6" filter="url(#cta-glow)">
            <animateMotion dur="5s" repeatCount="indefinite" path="M0,120 L1600,120" begin="1.5s" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur="5s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <path id="cta-curve1" d="M0,60 Q200,30 400,70 T800,40 T1200,65 T1600,35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
          <circle r="3" fill="white" opacity="0.7" filter="url(#cta-glow)">
            <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#cta-curve1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="5s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.06)' : 'rgba(255,255,255,0.08)', filter: 'blur(60px)' }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            Prêt à rejoindre <span style={{ textShadow: isDark ? '0 0 40px rgba(45,196,145,0.4)' : '0 0 40px rgba(255,255,255,0.3)' }}>ViteComm</span> ?
          </h2>
          <p className="text-xs sm:text-sm mb-6 sm:mb-8" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)' }}>
            Créez votre compte gratuit en 30 secondes. Aucune carte bancaire requise.
          </p>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={() => navigate('/register')}
              className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ background: '#fff', color: '#1D9E75', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              Créer mon compte gratuit →
            </button>
            <button onClick={() => navigate('/connect')}
              className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 hover:scale-105"
              style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', color: '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)'}` }}>
              Se connecter
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
