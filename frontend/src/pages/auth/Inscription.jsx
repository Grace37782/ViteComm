import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const profils = [
  { id: 'client',  emoji: '🛒', label: 'Acheter',  color: '#1D9E75' },
  { id: 'vendeur', emoji: '🏪', label: 'Vendre',   color: '#BA7517' },
  { id: 'livreur', emoji: '🏍️', label: 'Livrer',   color: '#D85A30' },
]

const PWD_RULES = [
  { key: 'min',   label: '8+',     test: v => v.length >= 8 },
  { key: 'upper', label: 'A',      test: v => /[A-Z]/.test(v) },
  { key: 'lower', label: 'a',      test: v => /[a-z]/.test(v) },
  { key: 'digit', label: '1',      test: v => /\d/.test(v) },
  { key: 'sym',   label: '!@#',    test: v => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(v) },
]

function PasswordChecklist({ value }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {PWD_RULES.map(r => {
        const ok = r.test(value)
        return (
          <span key={r.key}
            className="text-[13px] font-black px-3 py-1.5 rounded-full transition-all"
            style={{
              background: ok ? 'rgba(29,158,117,0.25)' : 'rgba(255,255,255,0.08)',
              color: ok ? '#1D9E75' : 'rgba(255,255,255,0.35)',
              border: `1px solid ${ok ? '#1D9E75' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {ok ? '✓ ' : ''}{r.label}
          </span>
        )
      })}
    </div>
  )
}

function PasswordStrengthInput({ showMdp, setShowMdp, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/80">Mot de passe</label>
      <div className="flex items-center rounded-2xl overflow-hidden border"
        style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
        <input type={showMdp ? 'text' : 'password'} placeholder="••••••••" value={value} onChange={onChange}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none" />
        <button type="button" onClick={() => setShowMdp(!showMdp)} className="px-4 text-lg cursor-pointer" style={{ background: 'none', border: 'none' }}>
          {showMdp ? '🙈' : '👁️'}
        </button>
      </div>
      {value && <PasswordChecklist value={value} />}
    </div>
  )
}

/* ─── Champs code à 6 chiffres ─── */
function CodeInput({ value, onChange }) {
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
              // backspace -> go left
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
          className="w-11 h-14 text-center text-xl font-black text-white
                     rounded-xl border outline-none"
          style={{
            background: d ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.08)',
            borderColor: d ? '#1D9E75' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  )
}

export default function Inscription() {
  const navigate = useNavigate()
  const { login: updateAuthContext } = useAuth()

  const [step, setStep]                   = useState('form')  // form | verify
  const [profil, setProfil]               = useState('client')
  const [showMdp, setShowMdp]             = useState(false)
  const [loading, setLoading]             = useState(false)
  const [verifyToken, setVerifyToken]     = useState('')
  const [verifyEmail, setVerifyEmail]     = useState('')
  const [code, setCode]                   = useState('')
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [photoFile, setPhotoFile]         = useState(null)
  const [photoPreview, setPhotoPreview]   = useState('')

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    identifiant: '',
    mot_de_passe: '', mot_de_passe_confirmation: '',
    adresse_livraison: '',
    nom_etablissement: '', localisation_marche: '',
    type_vehicule: '', immatriculation: '',
  })

  function set(field) {
    return e => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  function showError(msg) { setError(msg); setTimeout(() => setError(''), 4000) }
  function showSuccess(msg) { setSuccess(msg); setTimeout(() => setSuccess(''), 4000) }

  /* ── Photo ── */
  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  /* ── Étape 1 : envoi du code ── */
  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // ── Client-side validation ──
    const mdp = form.mot_de_passe
    if (!mdp) return void (setLoading(false) || showError('Mot de passe obligatoire.'))
    if (mdp !== form.mot_de_passe_confirmation)
      return void (setLoading(false) || showError('Les mots de passe ne correspondent pas.'))
    const failing = PWD_RULES.find(r => !r.test(mdp))
    if (failing)
      return void (setLoading(false) || showError('Le mot de passe doit contenir au moins ' + PWD_RULES.map(r => r.label).join(', ') + '.'))

    try {
      const body = new FormData()
      for (const [k, v] of Object.entries(form)) body.append(k, v)
      body.set('role', profil)
      if (photoFile) body.set('photo', photoFile)

      const res = await api.post('/auth/register', body)
      // Telephone-only: created directly, no verification step
      if (res.telephone_only) {
        updateAuthContext(res.user, res.token)
        const redirects = {
          client:  '/client/accueil',
          vendeur: '/vendeur/dashboard',
          livreur: '/livreur/dashboard',
        }
        navigate(redirects[res.user?.role] || '/accueil')
        return
      }
      setVerifyToken(res.token)
      setVerifyEmail(form.email || form.telephone)
      setStep('verify')
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Étape 2 : vérification du code ── */
  async function handleVerify(e) {
    e?.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-email', { token: verifyToken, code })
      updateAuthContext(res.user, res.token)

      const redirects = {
        client:  '/client/accueil',
        vendeur: '/vendeur/dashboard',
        livreur: '/livreur/dashboard',
      }
      navigate(redirects[res.user?.role] || '/accueil')
    } catch (err) {
      showError(err.message)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  /* ── Renvoi du code ── */
  async function handleResend() {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/resend-code', { token: verifyToken })
      showSuccess('Nouveau code envoyé !')
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Recommencer ── */
  function handleRestart() {
    setStep('form')
    setVerifyToken('')
    setVerifyEmail('')
    setCode('')
    setError('')
    setSuccess('')
  }

  const bgGrad = 'linear-gradient(135deg, #1D9E75 0%, #15795A 55%, #0F5B44 100%)'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: bgGrad }}>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#A8EDCA]/20 blur-3xl" />

      <button onClick={() => navigate('/accueil')}
        className="absolute top-6 left-6 z-50 px-4 py-2 rounded-full text-sm font-semibold text-white backdrop-blur-xl border"
        style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
        ← Accueil
      </button>

      {/* ─── TOAST ─── */}
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#E24B4A', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          maxWidth: 480, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>⚠️ {error}</div>
      )}
      {success && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: '#1D9E75', color: '#fff', borderRadius: 16,
          padding: '14px 20px', fontWeight: 700, fontSize: 14, textAlign: 'center',
          maxWidth: 480, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>✅ {success}</div>
      )}

      {/* ─── CARTE ─── */}
      <div className="relative w-full max-w-md rounded-[32px] p-8 backdrop-blur-xl border"
        style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)', boxShadow: '0 10px 40px rgba(0,0,0,0.18)' }}>

        {step === 'form' && (
          <>
            {/* ─── EN-TÊTE ─── */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                style={{ background: '#fff', color: '#1D9E75' }}>V</div>
              <h1 className="text-3xl font-black text-white tracking-tight">Créer un compte</h1>
              <p className="text-white/70 text-sm mt-2 text-center">Rejoignez ViteComm en quelques secondes</p>
            </div>

            {/* ─── CHOIX PROFIL ─── */}
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-3">
                {profils.map(p => {
                  const actif = profil === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setProfil(p.id)}
                      className="rounded-2xl py-4 border transition-all cursor-pointer"
                      style={{ background: actif ? p.color : 'rgba(255,255,255,0.08)', borderColor: actif ? p.color : 'rgba(255,255,255,0.12)' }}>
                      <div className="text-2xl mb-2">{p.emoji}</div>
                      <div className="text-xs font-bold text-white">{p.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── FORMULAIRE ─── */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* ─── Photo de profil ─── */}
              <div className="flex justify-center">
                <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer
                               flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: photoPreview ? 'transparent' : 'rgba(255,255,255,0.08)',
                    borderColor: photoPreview ? '#1D9E75' : 'rgba(255,255,255,0.2)',
                  }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-white/40">📷</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  {photoPreview && (
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold
                                 flex items-center justify-center shadow-md"
                    >✕</button>
                  )}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Nom</label>
                  <input type="text" placeholder="Votre nom" value={form.nom} onChange={set('nom')}
                    className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                    style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Prénom</label>
                  <input type="text" placeholder="Votre prénom" value={form.prenom} onChange={set('prenom')}
                    className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                    style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/80">Email ou téléphone</label>
                <input type="text" placeholder="exemple@gmail.com  ou  +229 97 00 00 00"
                  value={form.identifiant || ''}
                  onChange={e => {
                    const v = e.target.value
                    const clean = v.replace(/\s/g, '')
                    setForm(p => ({
                      ...p,
                      identifiant: v,
                      email: clean.includes('@') ? clean : '',
                      telephone: /^[\d+]/.test(clean) && !clean.includes('@') ? clean : '',
                    }))
                  }}
                  className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
              </div>

              <PasswordStrengthInput
                showMdp={showMdp}
                setShowMdp={setShowMdp}
                value={form.mot_de_passe}
                onChange={set('mot_de_passe')}
              />

              {form.mot_de_passe && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Confirmer le mot de passe</label>
                  <input type={showMdp ? 'text' : 'password'} placeholder="Retaper le mot de passe"
                    value={form.mot_de_passe_confirmation}
                    onChange={set('mot_de_passe_confirmation')}
                    className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderColor: form.mot_de_passe_confirmation
                        ? form.mot_de_passe === form.mot_de_passe_confirmation
                           ? '#1D9E75'
                           : '#E24B4A'
                        : 'rgba(255,255,255,0.12)',
                    }} />
                </div>
              )}

              {profil === 'client' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80">Adresse de livraison</label>
                  <input type="text" placeholder="Ex: Akpakpa" value={form.adresse_livraison} onChange={set('adresse_livraison')}
                    className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                    style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                </div>
              )}

              {profil === 'vendeur' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Nom boutique</label>
                    <input type="text" placeholder="Ex: Grâce Boutique" value={form.nom_etablissement} onChange={set('nom_etablissement')}
                      className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                      style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Marché</label>
                    <input type="text" placeholder="Ex: Dantokpa" value={form.localisation_marche} onChange={set('localisation_marche')}
                      className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                      style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                  </div>
                </>
              )}

              {profil === 'livreur' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Type véhicule</label>
                    <input type="text" placeholder="Ex: Zemidjan" value={form.type_vehicule} onChange={set('type_vehicule')}
                      className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                      style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/80">Immatriculation</label>
                    <input type="text" placeholder="RB-1234" value={form.immatriculation} onChange={set('immatriculation')}
                      className="rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none border"
                      style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                  </div>
                </>
              )}

              <button type="submit" disabled={loading}
                className="mt-2 rounded-2xl py-4 text-base font-black bg-white text-[#1D9E75] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                style={{ opacity: loading ? 0.75 : 1 }}>
                {loading ? '⏳ Envoi du code...' : 'Créer mon compte →'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-white/65">Vous avez déjà un compte ?</p>
              <button onClick={() => navigate('/connect')}
                className="mt-2 text-sm font-bold text-white underline underline-offset-4 cursor-pointer"
                style={{ background: 'none', border: 'none' }}>
                Se connecter
              </button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            {/* ─── ÉTAPE 2 : VÉRIFICATION ─── */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-4"
                style={{ background: '#fff', color: '#1D9E75' }}>✉️</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Vérifiez votre email</h1>
              <p className="text-white/70 text-sm mt-2 text-center leading-relaxed">
                Nous avons envoyé un code à 6 chiffres à<br />
                <strong className="text-white font-bold">{verifyEmail}</strong>
              </p>
              <p className="text-white/50 text-xs mt-1 text-center">
                {verifyEmail?.includes('@') ? 'Vérifiez vos spams si vous ne trouvez pas le message.' : 'Vérifiez votre téléphone.'}
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-white/80 text-center">Code de vérification</label>
                <CodeInput value={code} onChange={setCode} />
              </div>

              {code.length === 6 && (
                <button type="submit" disabled={loading}
                  className="rounded-2xl py-4 text-base font-black bg-white text-[#1D9E75] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  style={{ opacity: loading ? 0.75 : 1 }}>
                  {loading ? '⏳ Vérification...' : '✅ Vérifier mon compte'}
                </button>
              )}

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-white/60">Vous n'avez pas reçu le code ?</span>
                <button type="button" onClick={handleResend} disabled={loading}
                  className="font-bold text-white underline underline-offset-4 cursor-pointer"
                  style={{ background: 'none', border: 'none' }}>
                  Renvoyer
                </button>
              </div>

              <button type="button" onClick={handleRestart}
                className="text-sm text-white/50 hover:text-white/80 underline underline-offset-2 cursor-pointer"
                style={{ background: 'none', border: 'none' }}>
                ← Utiliser un autre identifiant
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}