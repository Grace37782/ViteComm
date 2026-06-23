import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { ArrowLeft, Shield, FileText, Users, ShoppingCart, Truck, CreditCard, AlertTriangle, Scale, Lock } from 'lucide-react'

export default function CGU() {
  const navigate = useNavigate()
  const { t } = useLang()

  const sections = [
    { icon: <FileText size={16} />, titleKey: 'cgu.s1.title', contentKey: 'cgu.s1.content' },
    { icon: <Users size={16} />, titleKey: 'cgu.s2.title', contentKey: 'cgu.s2.content' },
    { icon: <Shield size={16} />, titleKey: 'cgu.s3.title', contentKey: 'cgu.s3.content' },
    { icon: <ShoppingCart size={16} />, titleKey: 'cgu.s4.title', contentKey: 'cgu.s4.content' },
    { icon: <Truck size={16} />, titleKey: 'cgu.s5.title', contentKey: 'cgu.s5.content' },
    { icon: <Truck size={16} />, titleKey: 'cgu.s6.title', contentKey: 'cgu.s6.content' },
    { icon: <CreditCard size={16} />, titleKey: 'cgu.s7.title', contentKey: 'cgu.s7.content' },
    { icon: <Scale size={16} />, titleKey: 'cgu.s8.title', contentKey: 'cgu.s8.content' },
    { icon: <AlertTriangle size={16} />, titleKey: 'cgu.s9.title', contentKey: 'cgu.s9.content' },
    { icon: <Lock size={16} />, titleKey: 'cgu.s10.title', contentKey: 'cgu.s10.content' },
    { icon: <FileText size={16} />, titleKey: 'cgu.s11.title', contentKey: 'cgu.s11.content' },
    { icon: <Scale size={16} />, titleKey: 'cgu.s12.title', contentKey: 'cgu.s12.content' },
    { icon: <Shield size={16} />, titleKey: 'cgu.s13.title', contentKey: 'cgu.s13.content' },
    { icon: <Scale size={16} />, titleKey: 'cgu.s14.title', contentKey: 'cgu.s14.content' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div>
              <h1 className="text-white font-black text-lg">{t('cgu.title')}</h1>
              <p className="text-white/60 text-xs">{t('cgu.lastUpdated')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="rounded-2xl p-6 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1D9E7518', color: '#1D9E75' }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('cgu.brand')}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('cgu.subtitle')}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('cgu.intro')}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <div key={i} className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1D9E7518', color: '#1D9E75' }}>
                  {section.icon}
                </div>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t(section.titleKey)}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t(section.contentKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate(-1)}
            className="rounded-2xl px-8 py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
            {t('cgu.understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
