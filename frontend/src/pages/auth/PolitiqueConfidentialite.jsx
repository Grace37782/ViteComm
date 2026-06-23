import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { ArrowLeft, Lock, Eye, Database, Share2, UserCheck, Mail, Shield, FileText, AlertTriangle, Clock } from 'lucide-react'

export default function PolitiqueConfidentialite() {
  const navigate = useNavigate()
  const { t } = useLang()

  const sections = [
    { icon: <Eye size={16} />, titleKey: 'privacy.s1.title', contentKey: 'privacy.s1.content' },
    { icon: <Database size={16} />, titleKey: 'privacy.s2.title', contentKey: 'privacy.s2.content' },
    { icon: <Lock size={16} />, titleKey: 'privacy.s3.title', contentKey: 'privacy.s3.content' },
    { icon: <Share2 size={16} />, titleKey: 'privacy.s4.title', contentKey: 'privacy.s4.content' },
    { icon: <FileText size={16} />, titleKey: 'privacy.s5.title', contentKey: 'privacy.s5.content' },
    { icon: <UserCheck size={16} />, titleKey: 'privacy.s6.title', contentKey: 'privacy.s6.content' },
    { icon: <Clock size={16} />, titleKey: 'privacy.s7.title', contentKey: 'privacy.s7.content' },
    { icon: <AlertTriangle size={16} />, titleKey: 'privacy.s8.title', contentKey: 'privacy.s8.content' },
    { icon: <Mail size={16} />, titleKey: 'privacy.s9.title', contentKey: 'privacy.s9.content' },
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
              <h1 className="text-white font-black text-lg">{t('privacy.title')}</h1>
              <p className="text-white/60 text-xs">{t('privacy.lastUpdated')}</p>
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
              <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('privacy.brand')}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('privacy.subtitle')}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('privacy.intro')}
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
            {t('privacy.understood')}
          </button>
        </div>
      </div>
    </div>
  )
}
