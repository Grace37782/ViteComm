import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { Timer, Star, MessageCircle, Handshake, Loader2, User, Lock, XCircle, AlertTriangle, CheckCircle, Store, MapPin, Mail, Pencil, Save, Camera, KeyRound, LogOut, Package } from 'lucide-react'

export default function VendeurProfil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { t } = useLang()
  const { user: ctxUser, login: ctxLogin, logout: ctxLogout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom_etablissement: '', localisation_marche: '', nom: '', prenom: '', email: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const [tab, setTab] = useState('profil')

  const MOTIFS_REPUTATION = [
    { label: t('vendor.profil.reputationPonctualite'), icon: Timer, description: t('vendor.profil.reputationPonctualiteDesc') },
    { label: t('vendor.profil.reputationQualite'), icon: Star, description: t('vendor.profil.reputationQualiteDesc') },
    { label: t('vendor.profil.reputationCommunication'), icon: MessageCircle, description: t('vendor.profil.reputationCommunicationDesc') },
    { label: t('vendor.profil.reputationFiabilite'), icon: Handshake, description: t('vendor.profil.reputationFiabiliteDesc') },
  ]

  useEffect(() => {
    api.get('/vendor/profil').then(data => {
      setProfile(data)
      setForm(f => ({
        ...f,
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        nom_etablissement: data.vendeur?.nom_etablissement || '',
        localisation_marche: data.vendeur?.localisation_marche || '',
      }))
    }).catch(e => showToast(e.message, 'error'))
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
    if (!form.nom || !form.prenom || !form.email) return showToast(t('vendor.profil.erreurChampsRequis'), 'error')
    setSaving(true)
    try {
      const body = new FormData()
      body.set('nom_etablissement', form.nom_etablissement)
      body.set('localisation_marche', form.localisation_marche)
      if (photoFile) body.set('photo', photoFile)
      const res = await api.put('/vendor/profil', body)
      setProfile(p => ({ ...p, ...res.user, vendeur: res.vendeur }))
      if (res.user?.photo_url) {
        ctxLogin(res.user, localStorage.getItem('vc_token'))
      }
      showToast(t('vendor.profil.profilMisAJour'), 'ok')
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  function handleLogout() {
    ctxLogout()
    navigate('/connect')
  }

  const initials = ((profile?.prenom?.[0] || '') + (profile?.nom?.[0] || '')).toUpperCase() || '?'
  const scoreReputation = profile?.vendeur?.score_reputation || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="flex justify-center mb-3"><Loader2 size={40} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D2A10 0%, #121110 100%)' : 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('vendor.profil.monProfil')}</div>
            <div className="text-white/70 text-xs">{t('vendor.profil.vendeurViteComm')}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-3xl w-full">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? '#BA7517' : '#D85A30' }}>
          {toast.type === 'error' && <XCircle size={14} className="inline mr-1" />}
          {toast.type === 'ok' && <CheckCircle size={14} className="inline mr-1" />}
          {toast.msg}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {[
          { id: 'profil', label: t('vendor.profil.tabProfil'), icon: User },
          { id: 'reputation', label: t('vendor.profil.tabReputation'), icon: Star },
          { id: 'securite', label: t('vendor.profil.tabSecurite'), icon: Lock },
        ].map(o => (
          <button key={o.id} onClick={() => setTab(o.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer flex items-center gap-1.5"
            style={{
              background: tab === o.id ? '#BA7517' : 'var(--surface)',
              color: tab === o.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${tab === o.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            <o.icon size={12} />
            {o.label}
          </button>
        ))}
      </div>

      {/* Profil */}
      {tab === 'profil' && (
        <>
          {!editing ? (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex justify-center mb-5">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 shadow-md"
                    style={{ borderColor: '#BA7517' }} />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #BA7517, #854F0B)' }}>
                    {initials}
                  </div>
                )}
              </div>

              <div className="text-center mb-5">
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{profile?.prenom} {profile?.nom}</h2>
                <p className="text-sm font-semibold mt-1 flex items-center justify-center gap-1.5" style={{ color: '#BA7517' }}><Package size={14} /> {t('vendor.profil.vendeurViteComm')}</p>
                {form.nom_etablissement && (
                  <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}><Store size={12} /> {form.nom_etablissement}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <InfoRow label={t('vendor.profil.etablissement')} value={form.nom_etablissement || '—'} icon={Store} />
                <InfoRow label={t('vendor.profil.marche')} value={form.localisation_marche || '—'} icon={MapPin} />
                <InfoRow label="Email" value={profile?.email} icon={Mail} />
                <InfoRow label={t('vendor.profil.scoreReputation')} value={`${scoreReputation}/5`} icon={Star} />
                <InfoRow label={t('vendor.profil.statut')} value={profile?.statut_compte || '—'} icon={profile?.statut_compte === 'Actif' ? CheckCircle : Lock} />
              </div>

              <button onClick={() => setEditing(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
                <Pencil size={14} /> {t('vendor.profil.modifierProfil')}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: photoPreview ? 'transparent' : 'var(--surface-alt)', borderColor: photoPreview ? '#BA7517' : 'var(--border)' }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt={t('register.preview')} className="w-full h-full object-cover" />
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

                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.infosVendeur')}</div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Store size={12} /> {t('vendor.profil.nomEtablissement')}</label>
                  <input type="text" value={form.nom_etablissement} onChange={e => setForm(p => ({ ...p, nom_etablissement: e.target.value }))}
                    className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
                    style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><MapPin size={12} /> {t('vendor.profil.localisationMarche')}</label>
                  <input type="text" value={form.localisation_marche} onChange={e => setForm(p => ({ ...p, localisation_marche: e.target.value }))}
                    className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
                    style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>

                <div className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.infosPersonnelles')}</div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('common.name')} value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} />
                  <Field label={t('vendor.profil.prenom')} value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} />
                </div>
                <Field label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />

                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: '#BA7517', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> {t('common.save')}</>}
                  </button>
                  <button type="button" onClick={() => {
                    setEditing(false); setPhotoFile(null); setPhotoPreview('')
                    setForm(f => ({
                      ...f, nom: profile?.nom || '', prenom: profile?.prenom || '',
                      email: profile?.email || '',
                      nom_etablissement: profile?.vendeur?.nom_etablissement || '',
                      localisation_marche: profile?.vendeur?.localisation_marche || '',
                    }))
                  }}
                    className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer"
                    style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: 'none' }}>
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Réputation */}
      {tab === 'reputation' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex justify-center mb-3"><Star size={48} style={{ color: '#BA7517' }} /></div>
            <div className="text-4xl font-black" style={{ color: '#BA7517' }}>{scoreReputation}/5</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.scoreReputation')}</div>
            <div className="flex justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ opacity: s <= scoreReputation ? 1 : 0.3 }}><Star size={24} style={{ color: '#BA7517', fill: s <= scoreReputation ? '#BA7517' : 'none' }} /></span>
              ))}
            </div>
          </div>

          {MOTIFS_REPUTATION.map(m => (
            <div key={m.label} className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#FAEEDA' }}>
                  <m.icon size={20} style={{ color: '#BA7517' }} />
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.description}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
            {t('vendor.profil.scoreExplication')}
          </div>
        </div>
      )}

      {/* Sécurité */}
      {tab === 'securite' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            {ctxUser?.auth_provider === 'google' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.12)' }}>
                  <KeyRound size={20} style={{ color: '#4285F4' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('vendor.profil.compteGoogle')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.compteGoogleDesc')}</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><KeyRound size={14} /> {t('vendor.profil.changerMdp')}</h3>
                <PasswordChangeForm />
              </>
            )}
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><LogOut size={14} /> {t('vendor.profil.session')}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.sessionDesc')}</p>
            <button onClick={() => setShowLogout(true)}
              className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              style={{ background: '#FDE8E2', color: '#D85A30', border: 'none' }}>
              <LogOut size={14} /> {t('vendor.profil.seDeconnecter')}
            </button>
          </div>
        </div>
      )}

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowLogout(false)}>
          <div className="rounded-3xl p-6 w-full max-w-sm shadow-2xl" style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3"><LogOut size={48} style={{ color: '#D85A30' }} /></div>
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{t('vendor.profil.confirmerDeconnexion')}</h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('vendor.profil.deconnexionDesc')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                {t('vendor.profil.ouiDeconnecter')}
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
    </div>
  )
}

function PasswordChangeForm() {
  const { t } = useLang()
  const [mdp, setMdp] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { if (msg) setTimeout(() => setMsg(''), 3000) }, [msg])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mdp) return setMsg(t('vendor.profil.mdpEntrez'))
    if (mdp.length < 6) return setMsg(t('vendor.profil.mdp6Caracteres'))
    if (mdp !== confirm) return setMsg(t('vendor.profil.mdpNonIdentiques'))
    setSaving(true); setMsg('')
    try {
      const body = new FormData()
      body.set('mot_de_passe', mdp)
      body.set('mot_de_passe_confirmation', confirm)
      await api.put('/auth/profile', body)
      setMsg(t('vendor.profil.mdpMisAJour'))
      setMdp(''); setConfirm('')
    } catch (e) { setMsg(e.message) }
    finally { setSaving(false) }
  }

  const isError = msg && !msg.includes('mis à jour')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5"
          style={{ background: isError ? '#FDE8E2' : '#E1F5EE', color: isError ? '#D85A30' : '#0F6E56' }}>
          {isError ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          {msg}
        </div>
      )}
      <Field label={t('vendor.profil.nouveauMdp')} type="password" value={mdp} onChange={setMdp} />
      <Field label={t('vendor.profil.confirmer')} type="password" value={confirm} onChange={setConfirm} />
      <button type="submit" disabled={saving}
        className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer mt-1 flex items-center justify-center gap-2"
        style={{ background: saving ? '#ccc' : '#BA7517', color: '#fff', border: 'none' }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <><KeyRound size={14} /> {t('vendor.profil.mettreAJour')}</>}
      </button>
    </form>
  )
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-alt)' }}>
      <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Icon size={14} /> {label}</span>
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
