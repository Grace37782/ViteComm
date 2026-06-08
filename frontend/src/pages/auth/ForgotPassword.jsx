import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
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
    if (!email) return showError('Entrez votre adresse email.')
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
    if (!code) return showError('Entrez le code reçu par email.')
    if (!mdp) return showError('Nouveau mot de passe requis.')
    if (mdp !== mdpConfirm) return showError('Les mots de passe ne correspondent pas.')
    if (mdp.length < 8) return showError('Minimum 8 caractères.')
    if (!/[A-Z]/.test(mdp)) return showError('Une majuscule requise.')
    if (!/[a-z]/.test(mdp)) return showError('Une minuscule requise.')
    if (!/\d/.test(mdp)) return showError('Un chiffre requis.')
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(mdp))
      return showError('Un caractère spécial requis.')
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', {
        token: resetToken, code,
        mot_de_passe: mdp, mot_de_passe_confirmation: mdpConfirm,
      })
      showSuccess('Mot de passe réinitialisé ! Redirection...')
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
          className="absolute top-5 left-5 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: 'var(--text-secondary)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}>
          <span className="text-base">←</span> Connexion
        </button>

        {/* Toasts */}
        {error && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            ⚠️ {error}
          </div>
        )}
        {message && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            ✅ {message}
          </div>
        )}

        {/* Main card */}
        <div className="relative z-10 w-full max-w-sm rounded-3xl p-8 sm:p-10"
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
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}>🔑</div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Mot de passe oublié</h1>
                <p className="text-sm mt-2 text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Entrez votre email, nous vous enverrons un code pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Adresse email</label>
                  <input type="email" placeholder="exemple@gmail.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                </div>

                <button type="submit" disabled={loading}
                  className="rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : '0 4px 16px rgba(29,158,117,0.3)' }}>
                  {loading ? '⏳ Envoi...' : 'Envoyer le code →'}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}>✉️</div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Nouveau mot de passe</h1>
                <p className="text-sm mt-2 text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Un code à 6 chiffres vous a été envoyé par email. Saisissez-le ci-dessous avec votre nouveau mot de passe.
                </p>
              </div>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Code de réinitialisation</label>
                  <input type="text" inputMode="numeric" placeholder="000000" value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none text-center tracking-widest text-lg font-black"
                    style={inputStyle} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nouveau mot de passe</label>
                  <div className="flex items-center rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface-alt)', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                    <span className="pl-4 text-sm select-none">🔒</span>
                    <input type={showMdp ? 'text' : 'password'} placeholder="••••••••" value={mdp}
                      onChange={e => setMdp(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
                      style={{ color: 'var(--text-primary)' }} />
                    <button type="button" onClick={() => setShowMdp(!showMdp)}
                      className="px-4 text-lg cursor-pointer" style={{ background: 'none', border: 'none' }}>
                      {showMdp ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirmer le mot de passe</label>
                  <input type={showMdp ? 'text' : 'password'} placeholder="Retaper le mot de passe" value={mdpConfirm}
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
                  {loading ? '⏳ Réinitialisation...' : '✅ Réinitialiser'}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vous vous êtes souvenu de votre mot de passe ?</p>
            <button onClick={() => navigate('/connect')}
              className="mt-1.5 text-sm font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--accent)' }}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
