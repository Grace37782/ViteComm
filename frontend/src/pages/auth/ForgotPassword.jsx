import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { KeyRound, Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

const PWD_RULES = [
  { key: 'min',   label: '8+',     test: v => v.length >= 8 },
  { key: 'upper', label: 'A',      test: v => /[A-Z]/.test(v) },
  { key: 'lower', label: 'a',      test: v => /[a-z]/.test(v) },
  { key: 'digit', label: '1',      test: v => /\d/.test(v) },
  { key: 'sym',   label: '!@#',    test: v => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(v) }, // eslint-disable-line no-useless-escape
]

function PasswordChecklist({ value, isDark }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {PWD_RULES.map(r => {
        const ok = r.test(value)
        return (
          <span key={r.key}
            className="text-[13px] font-black px-3 py-1.5 rounded-full transition-all"
            style={{
              background: ok
                ? (isDark ? 'rgba(45,196,145,0.15)' : 'rgba(29,158,117,0.15)')
                : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              color: ok ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${ok ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {ok ? '✓ ' : ''}{r.label}
          </span>
        )
      })}
    </div>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'

  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email')
  const [resetToken, setResetToken] = useState('')
  const [code, setCode] = useState('')
  const [mdp, setMdp] = useState('')
  const [mdpConfirm, setMdpConfirm] = useState('')
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function showError(msg) { setError(msg); setTimeout(() => setError(''), 5000) }
  function showSuccess(msg) { setMessage(msg); setTimeout(() => setMessage(''), 5000) }

  async function handleSendCode(e) {
    e.preventDefault()
    if (!email) return showError(t('forgot.val.email'))
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setResetToken(res.token)
      setStep('code')
    } catch (err) { showError(err.message) }
    finally { setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!code) return showError(t('forgot.val.code'))
    if (!mdp) return showError(t('forgot.val.password'))
    if (mdp !== mdpConfirm) return showError(t('forgot.val.passwordMismatch'))
    if (mdp.length < 8) return showError(t('forgot.val.min8'))
    if (!/[A-Z]/.test(mdp)) return showError(t('forgot.val.uppercase'))
    if (!/[a-z]/.test(mdp)) return showError(t('forgot.val.lowercase'))
    if (!/\d/.test(mdp)) return showError(t('forgot.val.digit'))
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(mdp)) // eslint-disable-line no-useless-escape
      return showError(t('forgot.val.special'))
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', {
        token: resetToken, code,
        mot_de_passe: mdp, mot_de_passe_confirmation: mdpConfirm,
      })
      showSuccess(t('forgot.resetSuccess'))
      setTimeout(() => navigate('/connect'), 2000)
    } catch (err) { showError(err.message) }
    finally { setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--surface-alt)',
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 sm:py-0 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
            style={{ background: isDark ? '#1FA876' : '#1D9E75' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: isDark ? '#BA7517' : '#BA7517' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `radial-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        </div>

        {/* Back button */}
        <button onClick={() => navigate('/connect')}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: 'var(--text-secondary)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}>
          <span className="text-base">←</span> {t('forgot.back').replace('← ', '')}
        </button>

        {/* Toasts */}
        {error && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <AlertTriangle size={16} className="inline-block mr-1.5 -mt-0.5" /> {error}
          </div>
        )}
        {message && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CheckCircle size={16} className="inline-block mr-1.5 -mt-0.5" /> {message}
          </div>
        )}

        {/* Main card */}
        <div className="relative z-10 w-full max-w-sm rounded-3xl p-6 sm:p-8 md:p-10"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.4)' : '0 25px 60px rgba(0,0,0,0.08)',
          }}>

          {/* Green accent bar */}
          <div className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full"
            style={{ background: 'linear-gradient(90deg, #1D9E75, #2DC491, #1D9E75)' }} />

          {step === 'email' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}><KeyRound size={28} /></div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('forgot.title')}</h1>
                <p className="text-sm mt-2 text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t('forgot.desc')}
                </p>
              </div>

              <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('forgot.email')}</label>
                  <input type="email" placeholder="exemple@gmail.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                </div>

                <button type="submit" disabled={loading}
                  className="rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : '0 4px 16px rgba(29,158,117,0.3)' }}>
                  {loading ? <><Loader2 size={14} className="inline-block animate-spin mr-1.5" /> {t('forgot.sendLoading')}</> : t('forgot.sendBtn')}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}><Mail size={28} /></div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('forgot.newTitle')}</h1>
                <p className="text-sm mt-2 text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t('forgot.newDesc')}
                </p>
              </div>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('forgot.resetCode')}</label>
                  <input type="text" inputMode="numeric" placeholder="000000" value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none text-center tracking-widest text-lg font-black"
                    style={inputStyle} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('forgot.newPassword')}</label>
                  <div className="flex items-center rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface-alt)', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                    <span className="pl-4 text-sm select-none"><Lock size={16} color="var(--text-muted)" /></span>
                    <input type={showMdp ? 'text' : 'password'} placeholder="••••••••" value={mdp}
                      onChange={e => setMdp(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
                      style={{ color: 'var(--text-primary)' }} />
                    <button type="button" onClick={() => setShowMdp(!showMdp)}
                      className="px-4 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                      {showMdp ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                    </button>
                  </div>
                  <PasswordChecklist value={mdp} isDark={isDark} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('forgot.confirmPassword')}</label>
                  <input type={showMdp ? 'text' : 'password'} placeholder={t('forgot.confirmPlaceholder')} value={mdpConfirm}
                    onChange={e => setMdpConfirm(e.target.value)}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none"
                    style={{
                      ...inputStyle,
                      borderColor: mdpConfirm ? (mdp === mdpConfirm ? 'var(--accent)' : '#E24B4A') : inputStyle.border,
                    }} />
                </div>

                <button type="submit" disabled={loading || code.length < 6}
                  className="rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : '0 4px 16px rgba(29,158,117,0.3)' }}>
                  {loading ? <><Loader2 size={14} className="inline-block animate-spin mr-1.5" /> {t('forgot.resetLoading')}</> : <><CheckCircle size={14} className="inline-block mr-1.5" /> {t('forgot.resetBtn')}</>}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('forgot.rememberPassword')}</p>
            <button onClick={() => navigate('/connect')}
              className="mt-1.5 text-sm font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--accent)' }}>
              {t('forgot.login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
