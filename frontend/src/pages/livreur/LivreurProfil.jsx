import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { User, Star, Lock, Clock, MessageCircle, Shield, Bike, Hash, Mail, CheckCircle, Pencil, Camera, Save, KeyRound, LogOut, X, Loader2 } from 'lucide-react'

export default function LivreurProfil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { t } = useLang()
  const { user: ctxUser, login: updateCtx, logout: ctxLogout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', type_vehicule: '', immatriculation: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const [tab, setTab] = useState('profil')

  const MOTIFS_REPUTATION = [
    { labelKey: 'livreur.profil.reputation.punctuality', Icon: Clock, descKey: 'livreur.profil.reputation.punctualityDesc' },
    { labelKey: 'livreur.profil.reputation.reliability', Icon: Shield, descKey: 'livreur.profil.reputation.reliabilityDesc' },
    { labelKey: 'livreur.profil.reputation.communication', Icon: MessageCircle, descKey: 'livreur.profil.reputation.communicationDesc' },
    { labelKey: 'livreur.profil.reputation.security', Icon: Shield, descKey: 'livreur.profil.reputation.securityDesc' },
  ]

  useEffect(() => {
    api.get('/livreur/profil')
      .then(data => {
        setProfile(data)
        setForm({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          type_vehicule: data.type_vehicule || '',
          immatriculation: data.immatriculation || '',
        })
      })
      .catch(e => showToast(e.message))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.email) return showToast(t('toast.profileRequired'))
    setSaving(true)
    try {
      const body = new FormData()
      body.set('nom', form.nom)
      body.set('prenom', form.prenom)
      body.set('email', form.email)
      body.set('type_vehicule', form.type_vehicule)
      body.set('immatriculation', form.immatriculation)
      if (photoFile) body.set('photo', photoFile)
      const res = await api.put('/livreur/profil', body)
      setProfile(p => ({ ...p, ...res }))
      showToast(t('toast.profileUpdated'))
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')
      // Update auth context if nom/prenom changed
      if (res.nom && res.prenom) {
        updateCtx({ ...ctxUser, nom: res.nom, prenom: res.prenom, photo_url: res.photo_url || ctxUser?.photo_url }, localStorage.getItem('vc_token'))
      }
    } catch (e) { showToast(e.message) }
    finally { setSaving(false) }
  }

  function handleLogout() { ctxLogout(); navigate('/connect') }

  const score = profile?.score_reputation || 0
  const initials = ((profile?.prenom?.[0] || '') + (profile?.nom?.[0] || '')).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-3xl">
        <div className="rounded-2xl h-48 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D1A10 0%, #121011 100%)' : 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('profil.header')}</div>
            <div className="text-white/70 text-xs">{t('livreur.profil.subtitle')}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-3xl w-full">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2">
        {[
          { id: 'profil', label: <><User size={12} className="inline align-middle" /> {t('profil.infoTab')}</> },
          { id: 'reputation', label: <><Star size={12} className="inline align-middle" /> {t('livreur.profil.reputationTab')}</> },
          { id: 'securite', label: <><Lock size={12} className="inline align-middle" /> {t('profil.securityTab')}</> },
        ].map(o => (
          <button key={o.id} onClick={() => setTab(o.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
            style={{
              background: tab === o.id ? '#D85A30' : 'var(--surface)',
              color: tab === o.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${tab === o.id ? '#D85A30' : 'var(--border)'}`,
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* PROFIL */}
      {tab === 'profil' && (
        <>
          {!editing ? (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex justify-center mb-5">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 shadow-md"
                    style={{ borderColor: '#D85A30' }} />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                    style={{ background: isDark ? 'rgba(216,90,48,0.2)' : 'linear-gradient(135deg, #D85A30, #993C1D)' }}>
                    {initials}
                  </div>
                )}
              </div>
              <div className="text-center mb-5">
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.prenom} {profile?.nom}</h2>
                <p className="text-sm font-semibold mt-1" style={{ color: isDark ? '#E87D55' : '#D85A30' }}><Bike size={16} className="inline align-middle" /> {t('livreur.profil.subtitle')}</p>
              </div>
              <div className="flex flex-col gap-3 mb-5">
                <InfoRow label={t('livreur.dashboard.vehicle')} value={profile?.type_vehicule || '—'} icon={<Bike size={14} />} />
                <InfoRow label={t('livreur.dashboard.plateNumber')} value={profile?.immatriculation || '—'} icon={<Hash size={14} />} />
                <InfoRow label={t('auth.email')} value={profile?.email || '—'} icon={<Mail size={14} />} />
                <InfoRow label={t('livreur.profil.reputationTab')} value={`${score.toFixed(1)}/5 (${profile?.nb_avis || 0} ${t('livreur.dashboard.avis')})`} icon={<Star size={14} />} />
                <InfoRow label={t('livreur.profil.statut')} value={profile?.statut_compte || '—'} icon={profile?.statut_compte === 'Actif' ? <CheckCircle size={14} /> : <Lock size={14} />} />
              </div>
              <button onClick={() => setEditing(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:shadow-md active:scale-95"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                <Pencil size={14} className="inline align-middle" /> {t('profil.editProfile')}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: photoPreview ? 'transparent' : 'var(--surface-alt)', borderColor: photoPreview ? '#D85A30' : 'var(--border)' }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt={t('profil.photoPreview')} className="w-full h-full object-cover" />
                    ) : profile?.photo_url ? (
                      <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    {(photoPreview || profile?.photo_url) && (
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md"><X size={12} /></button>
                    )}
                  </label>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('livreur.profil.vehicleInfo')}</div>
                <Field label={<><Bike size={12} className="inline align-middle" /> {t('livreur.profil.vehicleType')}</>} value={form.type_vehicule} onChange={v => setForm(p => ({ ...p, type_vehicule: v }))} isDark={isDark} />
                <Field label={<><Hash size={12} className="inline align-middle" /> {t('livreur.dashboard.plateNumber')}</>} value={form.immatriculation} onChange={v => setForm(p => ({ ...p, immatriculation: v }))} isDark={isDark} />

                <div className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--text-muted)' }}>{t('livreur.profil.personalInfo')}</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('auth.name')} value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} isDark={isDark} />
                  <Field label={t('auth.firstName')} value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} isDark={isDark} />
                </div>
                <Field label={<><Mail size={12} className="inline align-middle" /> {t('auth.email')}</>} type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} isDark={isDark} />

                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all active:scale-95"
                    style={{ background: '#D85A30', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <Loader2 size={14} className="animate-spin inline" /> : <><Save size={14} className="inline align-middle" /> {t('common.save')}</>}
                  </button>
                  <button type="button" onClick={() => {
                    setEditing(false); setPhotoFile(null); setPhotoPreview('')
                    setForm({
                      nom: profile?.nom || '', prenom: profile?.prenom || '',
                      email: profile?.email || '',
                      type_vehicule: profile?.type_vehicule || '', immatriculation: profile?.immatriculation || '',
                    })
                  }}
                    className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: 'none' }}>
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* REPUTATION */}
      {tab === 'reputation' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6 text-center transition-all hover:shadow-md"
            style={{ background: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: `1.5px solid ${isDark ? '#D85A30' : '#F5C4B3'}` }}>
            <div className="mb-3 flex justify-center"><Star size={40} /></div>
            <div className="text-4xl font-black" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{Math.round(score)}/5</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('livreur.profil.reputationScore')} ({profile?.nb_avis || 0} {t('livreur.dashboard.avis')})</div>
            <div className="flex justify-center gap-1 mt-3">
              {[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= Math.round(score) ? 1 : 0.3 }}><Star size={24} /></span>)}
            </div>
          </div>
          {MOTIFS_REPUTATION.map(m => (
            <div key={m.labelKey} className="rounded-2xl p-4 transition-all hover:shadow-sm"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7' }}>
                  <m.Icon size={20} />
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t(m.labelKey)}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t(m.descKey)}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
            {t('livreur.profil.reputationExplanation')}
          </div>
        </div>
      )}

      {/* SECURITE */}
      {tab === 'securite' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            {ctxUser?.auth_provider === 'google' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.12)' }}>
                  <KeyRound size={20} style={{ color: '#4285F4' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('profil.googleAccount')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('profile.googleLinked')}</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}><KeyRound size={14} className="inline align-middle" /> {t('profile.changePassword')}</h3>
                <PasswordChangeForm isDark={isDark} />
              </>
            )}
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}><LogOut size={14} className="inline align-middle" /> {t('profil.session')}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t('profil.sessionDesc')}</p>
            <button onClick={() => setShowLogout(true)}
              className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:shadow-md active:scale-95"
              style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2', color: isDark ? '#F87171' : '#D85A30', border: 'none' }}>
              <LogOut size={14} className="inline align-middle" /> {t('connect.logout')}
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowLogout(false)}>
          <div className="rounded-3xl p-6 w-full max-w-sm shadow-2xl" style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="mb-3 flex justify-center"><LogOut size={40} /></div>
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{t('profil.logoutConfirm')}</h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('livreur.profil.logoutDesc')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all active:scale-95"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                {t('profil.logoutYes')}
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function PasswordChangeForm({ isDark }) {
  const { t } = useLang()
  const [mdp, setMdp] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('ok')

  useEffect(() => { if (msg) setTimeout(() => setMsg(''), 3000) }, [msg])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mdp) { setMsg(t('profil.enterNewPassword')); setMsgType('error'); return }
    if (mdp.length < 6) { setMsg(t('profil.min6Chars')); setMsgType('error'); return }
    if (mdp !== confirm) { setMsg(t('profil.passwordsMismatch')); setMsgType('error'); return }
    setSaving(true); setMsg('')
    try {
      await api.put('/livreur/profil', {
        mot_de_passe: mdp,
        mot_de_passe_confirmation: confirm
      })
      setMsg(t('profile.passwordUpdated')); setMsgType('ok')
      setMdp(''); setConfirm('')
    } catch (e) { setMsg(e.message); setMsgType('error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center"
          style={{ background: msgType === 'ok' ? (isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE') : (isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2'), color: msgType === 'ok' ? (isDark ? '#34D399' : '#0F6E56') : (isDark ? '#F87171' : '#D85A30') }}>
          {msg}
        </div>
      )}
      <Field label={t('profile.newPassword')} type="password" value={mdp} onChange={setMdp} isDark={isDark} />
      <Field label={t('profile.confirmPassword')} type="password" value={confirm} onChange={setConfirm} isDark={isDark} />
      <button type="submit" disabled={saving}
        className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer mt-1 transition-all active:scale-95"
        style={{ background: saving ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30', color: '#fff', border: 'none' }}>
        {saving ? <Loader2 size={14} className="animate-spin inline" /> : <><KeyRound size={14} className="inline align-middle" /> {t('profil.updatePassword')}</>}
      </button>
    </form>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{icon} {label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
    </div>
  )
}
