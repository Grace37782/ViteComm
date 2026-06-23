import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../services/api'
import { ShoppingCart, Package, Bike, User, Lock, Mail, MapPin, CheckCircle, Pencil, Camera, Save, KeyRound, LogOut, Loader2, XCircle, AlertTriangle } from 'lucide-react'

const ROLE_THEMES = {
  client: { primary: '#1D9E75', dark: '#0F6E56', label: 'Client ViteComm', icon: ShoppingCart },
  vendeur: { primary: '#BA7517', dark: '#854F0B', label: 'Vendeur ViteComm', icon: Package },
  livreur: { primary: '#D85A30', dark: '#993C1D', label: 'Livreur ViteComm', icon: Bike },
}

function getRole(pathname) {
  if (pathname.startsWith('/vendeur')) return 'vendeur'
  if (pathname.startsWith('/livreur')) return 'livreur'
  return 'client'
}

export default function Profil() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: ctxUser, login: updateCtx, logout: ctxLogout } = useAuth()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { t } = useLang()

  const TABS = [
    { id: 'infos', labelKey: 'profil.infoTab', icon: User },
    { id: 'securite', labelKey: 'profil.securityTab', icon: Lock },
  ]

  const [tab, setTab] = useState('infos')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', adresse_livraison: '', mot_de_passe: '', confirm: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)

  const role = getRole(location.pathname)
  const theme = ROLE_THEMES[role]

  useEffect(() => {
    api.get('/auth/profile').then(data => {
      setProfile(data)
      setForm(f => ({
        ...f, nom: data.nom || '', prenom: data.prenom || '',
        email: data.email || '',
        adresse_livraison: data.profil?.adresse_livraison || '',
      }))
    }).catch(e => showToast(<><XCircle size={14} className="inline" /> {e.message}</>, 'error'))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

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
    if (!form.nom || !form.prenom || !form.email) return showToast(<><AlertTriangle size={14} className="inline" /> {t('toast.profileRequired')}</>, 'error')
    if (form.mot_de_passe && form.mot_de_passe !== form.confirm) return showToast(<><AlertTriangle size={14} className="inline" /> {t('toast.passwordMismatch')}</>, 'error')
    if (form.mot_de_passe && form.mot_de_passe.length < 6) return showToast(<><AlertTriangle size={14} className="inline" /> {t('toast.passwordTooShort')}</>, 'error')
    setSaving(true)
    try {
      const body = new FormData()
      body.set('nom', form.nom)
      body.set('prenom', form.prenom)
      body.set('email', form.email)
      body.set('adresse_livraison', form.adresse_livraison)
      if (photoFile) body.set('photo', photoFile)
      if (form.mot_de_passe) {
        body.set('mot_de_passe', form.mot_de_passe)
        body.set('mot_de_passe_confirmation', form.confirm)
      }
      const res = await api.put('/auth/profile', body)
      setProfile(res.user)
      updateCtx(res.user, localStorage.getItem('vc_token'))
      showToast(<><CheckCircle size={14} className="inline" /> {t('toast.profileUpdated')}</>, 'ok')
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')
    } catch (e) { showToast(<><XCircle size={14} className="inline" /> {e.message}</>, 'error') }
    finally { setSaving(false) }
  }

  function handleLogout() {
    ctxLogout()
    navigate('/connect')
  }

  const initials = ((profile?.prenom?.[0] || '') + (profile?.nom?.[0] || '')).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="mb-3 flex justify-center"><Loader2 size={32} className="animate-spin" /></div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>{t('profil.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full font-sans" style={{ background: 'var(--bg)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? theme.primary : (isDark ? '#E87D55' : '#D85A30') }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/accueil')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('profil.header')}</div>
            <div className="text-white/70 text-xs">{theme.label}</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-none px-4">
          {TABS.map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
              style={{
                background: tab === tabItem.id ? (isDark ? 'rgba(255,255,255,0.08)' : '#fff') : 'transparent',
                color: tab === tabItem.id ? theme.primary : 'var(--text-muted)',
                border: tab === tabItem.id ? '1px solid var(--border)' : 'none',
                boxShadow: tab === tabItem.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}>
              <tabItem.icon size={14} /> {t(tabItem.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 pb-24">
        {tab === 'infos' && (
          <>
            {!editing ? (
              <div className="rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {/* Avatar */}
                <div className="flex justify-center mb-5">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}>
                      {initials}
                    </div>
                  )}
                </div>

                <div className="text-center mb-5">
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.prenom} {profile?.nom}</h2>
                  <p className="text-sm font-semibold mt-1" style={{ color: theme.primary }}><theme.icon size={16} className="inline align-middle" /> {theme.label}</p>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  <InfoRow label={t('auth.firstName')} value={profile?.prenom} icon={<User size={14} />} />
                  <InfoRow label={t('auth.name')} value={profile?.nom} icon={<User size={14} />} />
                  <InfoRow label={t('auth.email')} value={profile?.email} icon={<Mail size={14} />} />
                  <InfoRow label={t('auth.address')} value={profile?.profil?.adresse_livraison || '—'} icon={<MapPin size={14} />} />
                  <InfoRow label="Statut" value={profile?.statut_compte || '—'} icon={profile?.statut_compte === 'Actif' ? <CheckCircle size={14} /> : <Lock size={14} />} />
                </div>

                <button onClick={() => setEditing(true)}
                  className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: theme.primary, color: '#fff', border: 'none' }}>
                  <Pencil size={14} className="inline align-middle" /> {t('profil.editProfile')}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  {/* Photo upload */}
                  <div className="flex justify-center">
                    <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                      style={{
                        background: photoPreview ? 'transparent' : 'var(--surface-alt)',
                        borderColor: photoPreview ? theme.primary : 'var(--border)',
                      }}>
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
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">✕</button>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('auth.name')} value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} />
                    <Field label={t('auth.firstName')} value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} />
                  </div>
                  <Field label={t('auth.email')} type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                  <Field label={t('auth.address')} value={form.adresse_livraison} onChange={v => setForm(p => ({ ...p, adresse_livraison: v }))} />

                  <div className="flex gap-3 mt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: theme.primary, color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                      {saving ? <Loader2 size={14} className="animate-spin inline" /> : <><Save size={14} className="inline align-middle" /> {t('common.save')}</>}
                    </button>
                    <button type="button" onClick={() => {
                      setEditing(false); setPhotoFile(null); setPhotoPreview('')
                      setForm(f => ({
                        ...f, nom: profile?.nom || '', prenom: profile?.prenom || '',
                        email: profile?.email || '',
                        adresse_livraison: profile?.profil?.adresse_livraison || '',
                      }))
                    }}
                      className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F0EFEA', color: 'var(--text-muted)', border: 'none' }}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {tab === 'securite' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
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
                  <PasswordChangeForm theme={theme} isDark={isDark} />
                </>
              )}
            </div>

            <div className="rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}><LogOut size={14} className="inline align-middle" /> {t('profil.session')}</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t('profil.sessionDesc')}</p>
              <button onClick={() => setShowLogout(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FDE8E2', color: isDark ? '#E87D55' : '#D85A30', border: 'none' }}>
                <LogOut size={14} className="inline align-middle" /> {t('connect.logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowLogout(false)}>
          <div className="rounded-3xl p-6 w-full max-w-sm shadow-2xl" style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="mb-3 flex justify-center"><LogOut size={40} /></div>
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{t('profil.logoutConfirm')}</h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('profil.logoutDesc')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer"
                style={{ background: isDark ? '#E87D55' : '#D85A30', color: '#fff', border: 'none' }}>
                {t('profil.logoutYes')}
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordChangeForm({ theme, isDark }) {
  const { t } = useLang()
  const [mdp, setMdp] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [msgType, setMsgType] = useState('ok')

  useEffect(() => { if (msg) setTimeout(() => setMsg(null), 3000) }, [msg])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mdp) { setMsg(t('profil.enterNewPassword')); setMsgType('error'); return }
    if (mdp.length < 6) { setMsg(t('profil.min6Chars')); setMsgType('error'); return }
    if (mdp !== confirm) { setMsg(t('profil.passwordsMismatch')); setMsgType('error'); return }
    setSaving(true); setMsg(null)
    try {
      const body = new FormData()
      body.set('mot_de_passe', mdp)
      body.set('mot_de_passe_confirmation', confirm)
      await api.put('/auth/profile', body)
      setMsg(t('profile.passwordUpdated')); setMsgType('ok')
      setMdp(''); setConfirm('')
    } catch (e) { setMsg(e.message); setMsgType('error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center"
          style={{ background: msgType === 'ok' ? (isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE') : (isDark ? 'rgba(232,125,85,0.12)' : '#FDE8E2'), color: msgType === 'ok' ? (isDark ? '#2DC491' : (theme?.primary || '#0F6E56')) : (isDark ? '#E87D55' : '#D85A30') }}>
          {msg}
        </div>
      )}
      <Field label={t('profile.newPassword')} type="password" value={mdp} onChange={setMdp} />
      <Field label={t('profile.confirmPassword')} type="password" value={confirm} onChange={setConfirm} />
      <button type="submit" disabled={saving}
        className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer mt-1"
        style={{ background: saving ? (isDark ? 'rgba(255,255,255,0.08)' : '#ccc') : (theme?.primary || '#1D9E75'), color: '#fff', border: 'none' }}>
        {saving ? <Loader2 size={14} className="animate-spin inline" /> : <><KeyRound size={14} className="inline align-middle" /> {t('profil.updatePassword')}</>}
      </button>
    </form>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-alt)' }}>
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
