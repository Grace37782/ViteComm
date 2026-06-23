import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { ShoppingCart, Store, Motorbike, Lock, Eye, EyeOff, Camera, Mail, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

const profils = [
  { id: 'client',  Icon: ShoppingCart, labelKey: 'register.buy',  color: '#1D9E75' },
  { id: 'vendeur', Icon: Store, labelKey: 'register.sell',   color: '#BA7517' },
  { id: 'livreur', Icon: Motorbike, labelKey: 'register.deliver',   color: '#D85A30' },
]

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

function PasswordStrengthInput({ showMdp, setShowMdp, value, onChange, isDark, t }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.password')}</label>
      <div className="flex items-center rounded-xl overflow-hidden"
        style={{ background: 'var(--surface-alt)', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
        <span className="pl-4 text-sm select-none"><Lock size={16} color="var(--text-muted)" /></span>
        <input type={showMdp ? 'text' : 'password'} placeholder="••••••••" value={value} onChange={onChange}
          className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none"
          style={{ color: 'var(--text-primary)' }} />
        <button type="button" onClick={() => setShowMdp(!showMdp)} className="px-4 cursor-pointer" style={{ background: 'none', border: 'none' }}>
          {showMdp ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
        </button>
      </div>
      {value && <PasswordChecklist value={value} isDark={isDark} />}
    </div>
  )
}

function CodeInput({ value, onChange, isDark }) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoFocus={i === 0}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '')
            if (!val && i > 0) {
              const newVal = value.slice(0, i - 1) + value.slice(i)
              onChange(newVal)
              document.getElementById(`code-${i - 1}`)?.focus()
              return
            }
            if (!val) return
            const newVal = value.slice(0, i) + val + value.slice(i + 1)
            onChange(newVal)
            if (i < 5) document.getElementById(`code-${i + 1}`)?.focus()
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !d && i > 0) {
              const newVal = value.slice(0, i - 1) + value.slice(i)
              onChange(newVal)
              document.getElementById(`code-${i - 1}`)?.focus()
            }
          }}
          id={`code-${i}`}
          className="w-10 h-13 sm:w-11 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl outline-none"
          style={{
            background: d ? (isDark ? 'rgba(45,196,145,0.2)' : 'rgba(29,158,117,0.15)') : 'var(--surface-alt)',
            color: 'var(--text-primary)',
            border: `1.5px solid ${d ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
          }}
        />
      ))}
    </div>
  )
}

export default function Inscription() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: updateAuthContext } = useAuth()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'

  const [step, setStep]                   = useState('form')
  const [profil, setProfil]               = useState(() => {
    const role = new URLSearchParams(location.search).get('role')
    return role === 'vendeur' || role === 'livreur' ? role : 'client'
  })
  const [showMdp, setShowMdp]             = useState(false)
  const [loading, setLoading]             = useState(false)
  const [acceptedCGU, setAcceptedCGU]     = useState(false)
  const [verifyToken, setVerifyToken]     = useState('')
  const [verifyEmail, setVerifyEmail]     = useState('')
  const [code, setCode]                   = useState('')
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [photoFile, setPhotoFile]         = useState(null)
  const [photoPreview, setPhotoPreview]   = useState('')

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    identifiant: '',
    mot_de_passe: '', mot_de_passe_confirmation: '',
    adresse_livraison: '',
    nom_etablissement: '', localisation_marche: '', id_marche: '',
    type_vehicule: '', immatriculation: '',
  })

  const [markets, setMarkets] = useState([])

  useEffect(() => {
    const role = new URLSearchParams(location.search).get('role')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (role === 'vendeur' || role === 'livreur' || role === 'client') setProfil(role)
  }, [location.search])

  useEffect(() => {
    if (profil !== 'vendeur') return
    api.get('/auth/markets').then(setMarkets).catch(() => {})
  }, [profil])

  function set(field) { return e => setForm(p => ({ ...p, [field]: e.target.value })) }
  function showError(msg) { setError(msg); setTimeout(() => setError(''), 4000) }
  function showSuccess(msg) { setSuccess(msg); setTimeout(() => setSuccess(''), 4000) }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const mdp = form.mot_de_passe
    if (!mdp) return void (setLoading(false) || showError(t('register.val.passwordRequired')))
    if (mdp !== form.mot_de_passe_confirmation)
      return void (setLoading(false) || showError(t('register.val.passwordMismatch')))
    const failing = PWD_RULES.find(r => !r.test(mdp))
    if (failing)
      return void (setLoading(false) || showError(t('register.val.passwordWeak', { rules: PWD_RULES.map(r => r.label).join(', ') })))
    try {
      const body = new FormData()
      for (const [k, v] of Object.entries(form)) body.append(k, v)
      body.set('role', profil)
      if (photoFile) body.set('photo', photoFile)
      const res = await api.post('/auth/register', body)
      setVerifyToken(res.token)
      setVerifyEmail(form.email)
      setStep('verify')
    } catch (err) { showError(err.message) }
    finally { setLoading(false) }
  }

  async function handleVerify(e) {
    e?.preventDefault()
    if (code.length !== 6) return
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/verify-email', { token: verifyToken, code })
      updateAuthContext(res.user, res.token)
      const redirects = { client: '/client/accueil', vendeur: '/vendeur/dashboard', livreur: '/livreur/dashboard' }
      navigate(redirects[res.user?.role] || '/accueil')
    } catch (err) { showError(err.message); setCode('') }
    finally { setLoading(false) }
  }

  async function handleResend() {
    setLoading(true); setError('')
      try { await api.post('/auth/resend-code', { token: verifyToken }); showSuccess(t('register.verifyResent')) }
    catch (err) { showError(err.message) }
    finally { setLoading(false) }
  }

  function handleRestart() {
    setStep('form'); setVerifyToken(''); setVerifyEmail(''); setCode(''); setError(''); setSuccess('')
  }

  const inputStyle = {
    background: 'var(--surface-alt)',
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    color: 'var(--text-primary)',
  }

  return (
    <div className="w-full" style={{ background: 'var(--bg)' }}>
      <div className="relative flex items-center justify-center px-4 py-12 sm:py-16 overflow-hidden min-h-screen">
        {/* Decorative blobs — theme-aware */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
            style={{ background: isDark ? '#1FA876' : '#1D9E75' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: isDark ? '#BA7517' : '#BA7517' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `radial-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        </div>

        {/* Back button */}
        <button onClick={() => navigate('/accueil')}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: 'var(--text-secondary)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}>
          <span className="text-base">←</span> {t('register.back').replace('← ', '')}
        </button>

        {/* TOAST */}
        {error && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <AlertTriangle size={16} className="inline-block mr-1.5 -mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CheckCircle size={16} className="inline-block mr-1.5 -mt-0.5" /> {success}
          </div>
        )}

        {/* Main card */}
        <div className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 md:p-10"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.4)' : '0 25px 60px rgba(0,0,0,0.08)',
          }}>

          {/* Green accent bar */}
          <div className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full"
            style={{ background: 'linear-gradient(90deg, #1D9E75, #2DC491, #1D9E75)' }} />

          {step === 'form' && (
            <>
              {/* Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}>V</div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('register.title')}</h1>
                <p className="text-sm mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>{t('register.subtitle')}</p>
              </div>

              {/* Profile selector */}
              <div className="mb-5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {profils.map(p => {
                    const actif = profil === p.id
                    return (
                      <button key={p.id} type="button" onClick={() => setProfil(p.id)}
                        className="rounded-xl py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                        style={{
                          background: actif ? (isDark ? `${p.color}22` : `${p.color}15`) : 'var(--surface-alt)',
                          border: `1.5px solid ${actif ? p.color : 'var(--border)'}`,
                        }}>
                        <div className="mb-2" style={{ color: actif ? p.color : 'var(--text-secondary)' }}><p.Icon size={24} /></div>
                        <div className="text-xs font-bold" style={{ color: actif ? p.color : 'var(--text-secondary)' }}>{t(p.labelKey)}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                {/* Photo */}
                <div className="flex justify-center">
                  <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: photoPreview ? 'transparent' : 'var(--surface-alt)', borderColor: photoPreview ? 'var(--accent)' : 'var(--border)' }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={28} color="var(--text-muted)" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    {photoPreview && (
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">✕</button>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.name')}</label>
                    <input type="text" placeholder={t('register.namePlaceholder')} value={form.nom} onChange={set('nom')}
                      className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.firstName')}</label>
                    <input type="text" placeholder={t('register.firstNamePlaceholder')} value={form.prenom} onChange={set('prenom')}
                      className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" placeholder="exemple@gmail.com"
                    value={form.email}
                    onChange={set('email')}
                    className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                </div>

                <PasswordStrengthInput showMdp={showMdp} setShowMdp={setShowMdp} value={form.mot_de_passe} onChange={set('mot_de_passe')} isDark={isDark} />

                {form.mot_de_passe && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.confirmPassword')}</label>
                    <input type={showMdp ? 'text' : 'password'} placeholder={t('register.confirmPasswordPlaceholder')}
                      value={form.mot_de_passe_confirmation} onChange={set('mot_de_passe_confirmation')}
                      className="rounded-xl px-4 py-3.5 text-sm outline-none"
                      style={{
                        ...inputStyle,
                        borderColor: form.mot_de_passe_confirmation
                          ? (form.mot_de_passe === form.mot_de_passe_confirmation ? 'var(--accent)' : '#E24B4A')
                          : inputStyle.border,
                      }} />
                  </div>
                )}

                {profil === 'client' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.address')}</label>
                    <input type="text" placeholder={t('register.addressPlaceholder')} value={form.adresse_livraison} onChange={set('adresse_livraison')}
                      className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                  </div>
                )}

                {profil === 'vendeur' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.shopName')}</label>
                      <input type="text" placeholder={t('register.shopNamePlaceholder')} value={form.nom_etablissement} onChange={set('nom_etablissement')}
                        className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.market')}</label>
                      <select value={form.id_marche} onChange={e => {
                        const id = e.target.value; const m = markets.find(m => String(m.id_marche) === id)
                        setForm(p => ({ ...p, id_marche: id, localisation_marche: m ? m.nom : '' }))
                      }}
                        className="rounded-xl px-4 py-3.5 text-sm outline-none appearance-none cursor-pointer"
                        style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }}>
                        <option value="">{t('register.selectMarket')}</option>
                        {markets.map(m => <option key={m.id_marche} value={m.id_marche}>{m.nom}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {profil === 'livreur' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.vehicleType')}</label>
                      <input type="text" placeholder={t('register.vehicleTypePlaceholder')} value={form.type_vehicule} onChange={set('type_vehicule')}
                        className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('register.plateNumber')}</label>
                      <input type="text" placeholder={t('register.plateNumberPlaceholder')} value={form.immatriculation} onChange={set('immatriculation')}
                        className="rounded-xl px-4 py-3.5 text-sm outline-none" style={inputStyle} />
                    </div>
                  </>
                )}

                <label className="flex items-start gap-3 cursor-pointer mt-1 p-3 rounded-xl transition-all"
                  style={{ background: acceptedCGU ? '#1D9E7510' : 'transparent', border: `1px solid ${acceptedCGU ? '#1D9E7540' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={acceptedCGU} onChange={e => setAcceptedCGU(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#1D9E75] flex-shrink-0 cursor-pointer" />
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t('register.acceptCGU', { cgu: '' })}{' '}
                    <span onClick={e => { e.preventDefault(); navigate('/cgu') }}
                      className="font-bold underline cursor-pointer" style={{ color: '#1D9E75' }}>
                      {t('register.cgu')}
                    </span>
                  </span>
                </label>

                <button type="submit" disabled={loading || !acceptedCGU}
                  className="mt-1 rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', border: 'none', opacity: loading || !acceptedCGU ? 0.5 : 1, boxShadow: loading || !acceptedCGU ? 'none' : '0 4px 16px rgba(29,158,117,0.3)' }}>
                  {loading ? <><Loader2 size={14} className="inline-block animate-spin mr-1.5" /> {t('register.submitLoading')}</> : t('register.submit')}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('register.hasAccount')}</p>
                <button onClick={() => navigate('/connect')}
                  className="mt-1.5 text-sm font-bold cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--accent)' }}>
                  {t('register.login')}
                </button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              {/* Step 2: Verification */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', boxShadow: '0 8px 24px rgba(29,158,117,0.25)' }}><Mail size={28} /></div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('register.verifyTitle')}</h1>
                <p className="text-sm mt-2 text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t('register.verifyDesc')}<br />
                  <strong style={{ color: 'var(--text-primary)' }}>{verifyEmail}</strong>
                </p>
                <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
                  {t('register.verifySpam')}
                </p>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>{t('register.verifyCode')}</label>
                  <CodeInput value={code} onChange={setCode} isDark={isDark} />
                </div>

                {code.length === 6 && (
                  <button type="submit" disabled={loading}
                    className="rounded-xl py-3.5 text-sm font-black transition-all cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', border: 'none', opacity: loading ? 0.7 : 1 }}>
                    {loading ? <><Loader2 size={14} className="inline-block animate-spin mr-1.5" /> {t('register.verifyBtnLoading')}</> : <><CheckCircle size={14} className="inline-block mr-1.5" /> {t('register.verifyBtn')}</>}
                  </button>
                )}

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{t('register.verifyNoCode')}</span>
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="font-bold underline underline-offset-4 cursor-pointer"
                    style={{ background: 'none', border: 'none', color: 'var(--accent)' }}>
                    {t('register.verifyResend')}
                  </button>
                </div>

                <button type="button" onClick={handleRestart}
                  className="text-sm underline underline-offset-2 cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                  {t('register.verifyOtherEmail')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
