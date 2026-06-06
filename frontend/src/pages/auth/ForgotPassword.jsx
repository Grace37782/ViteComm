import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // email | code
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
    } catch (err) {
      showError(err.message)
    } finally { setLoading(false) }
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
    } catch (err) {
      showError(err.message)
    } finally { setLoading(false) }
  }

  const bgGrad = 'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: bgGrad }}>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl" />

      <button onClick={() => navigate('/connect')}
        className="absolute top-6 left-6 z-50 px-4 py-2 rounded-full text-sm font-semibold text-white backdrop-blur-xl border cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
        ← Connexion
      </button>

      {error && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#E24B4A', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          maxWidth: 480, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>⚠️ {error}</div>
      )}
      {message && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#1D9E75', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          maxWidth: 480, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>✅ {message}</div>
      )}

      <div className="relative w-full max-w-sm rounded-[32px] p-8 backdrop-blur-xl border"
        style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)', boxShadow: '0 10px 40px rgba(0,0,0,0.18)' }}>

        {step === 'email' && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                style={{ background: '#fff', color: '#1D9E75' }}>🔑</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Mot de passe oublié</h1>
              <p className="text-white/70 text-sm mt-2 text-center leading-relaxed">
                Entrez votre email, nous vous enverrons un code pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white/80">Adresse email</label>
                <input type="email" placeholder="exemple@gmail.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-2xl px-4 py-4 text-sm text-white placeholder:text-white/40 outline-none border"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
              </div>

              <button type="submit" disabled={loading}
                className="rounded-2xl py-4 text-base font-black bg-white text-[#1D9E75] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                style={{ opacity: loading ? 0.75 : 1 }}>
                {loading ? '⏳ Envoi...' : 'Envoyer le code →'}
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                style={{ background: '#fff', color: '#1D9E75' }}>✉️</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Nouveau mot de passe</h1>
              <p className="text-white/70 text-sm mt-2 text-center leading-relaxed">
                Un code à 6 chiffres vous a été envoyé par email. Saisissez-le ci-dessous avec votre nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white/80">Code de réinitialisation</label>
                <input type="text" inputMode="numeric" placeholder="000000" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="rounded-2xl px-4 py-4 text-sm text-white placeholder:text-white/40 outline-none border text-center tracking-widest text-lg font-black"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white/80">Nouveau mot de passe</label>
                <div className="flex items-center rounded-2xl overflow-hidden border"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                  <input type={showMdp ? 'text' : 'password'} placeholder="••••••••" value={mdp}
                    onChange={e => setMdp(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder:text-white/40 outline-none" />
                  <button type="button" onClick={() => setShowMdp(!showMdp)}
                    className="px-4 text-lg cursor-pointer" style={{ background: 'none', border: 'none' }}>
                    {showMdp ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-white/80">Confirmer le mot de passe</label>
                <input type={showMdp ? 'text' : 'password'} placeholder="Retaper le mot de passe" value={mdpConfirm}
                  onChange={e => setMdpConfirm(e.target.value)}
                  className="rounded-2xl px-4 py-4 text-sm text-white placeholder:text-white/40 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: mdpConfirm ? (mdp === mdpConfirm ? '#1D9E75' : '#E24B4A') : 'rgba(255,255,255,0.12)',
                  }} />
              </div>

              <button type="submit" disabled={loading || code.length < 6}
                className="rounded-2xl py-4 text-base font-black bg-white text-[#1D9E75] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                style={{ opacity: loading ? 0.75 : 1 }}>
                {loading ? '⏳ Réinitialisation...' : '✅ Réinitialiser'}
              </button>
            </form>
          </>
        )}

        <div className="mt-5 text-center">
          <p className="text-sm text-white/65">Vous vous êtes souvenu de votre mot de passe ?</p>
          <button onClick={() => navigate('/connect')}
            className="mt-2 text-sm font-bold text-white underline underline-offset-4 cursor-pointer"
            style={{ background: 'none', border: 'none' }}>
            Se connecter
          </button>
        </div>
      </div>
    </div>
  )
}
