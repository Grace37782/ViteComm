import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const TABS = [
  { id: 'infos', label: 'Mon Profil', icon: '👤' },
  { id: 'securite', label: 'Sécurité', icon: '🔒' },
]

export default function Profil() {
  const navigate = useNavigate()
  const { user: ctxUser, login: updateCtx, logout: ctxLogout } = useAuth()
  const [tab, setTab] = useState('infos')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', adresse_livraison: '', mot_de_passe: '', confirm: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    api.get('/auth/profile').then(data => {
      setProfile(data)
      setForm(f => ({
        ...f, nom: data.nom || '', prenom: data.prenom || '',
        telephone: data.telephone || '', email: data.email || '',
        adresse_livraison: data.profil?.adresse_livraison || '',
      }))
    }).catch(e => showToast('❌ ' + e.message, 'error'))
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
    if (!form.nom || !form.prenom || !form.email) return showToast('⚠️ Nom, prénom et email requis.', 'error')
    if (form.mot_de_passe && form.mot_de_passe !== form.confirm) return showToast('⚠️ Les mots de passe ne correspondent pas.', 'error')
    if (form.mot_de_passe && form.mot_de_passe.length < 6) return showToast('⚠️ Le mot de passe doit comporter au moins 6 caractères.', 'error')
    setSaving(true)
    try {
      const body = new FormData()
      body.set('nom', form.nom)
      body.set('prenom', form.prenom)
      body.set('email', form.email)
      body.set('telephone', form.telephone)
      body.set('adresse_livraison', form.adresse_livraison)
      if (photoFile) body.set('photo', photoFile)
      if (form.mot_de_passe) {
        body.set('mot_de_passe', form.mot_de_passe)
        body.set('mot_de_passe_confirmation', form.confirm)
      }
      const res = await api.put('/auth/profile', body)
      setProfile(res.user)
      updateCtx(res.user, localStorage.getItem('vc_token'))
      showToast('✅ Profil mis à jour !', 'ok')
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')
    } catch (e) { showToast('❌ ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  function handleLogout() {
    ctxLogout()
    navigate('/connect')
  }

  const initials = ((profile?.prenom?.[0] || '') + (profile?.nom?.[0] || '')).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F8F3' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-bold text-sm" style={{ color: '#888780' }}>Chargement du profil…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F7F8F3] font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? '#1D9E75' : '#D85A30' }}>
          {toast.msg}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-none" style={{ maxWidth: '48rem', margin: '0 auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
              style={{
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#1D9E75' : '#888780',
                border: tab === t.id ? '1px solid #E8E6DF' : 'none',
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {tab === 'infos' && (
          <>
            {!editing ? (
              <div className="rounded-2xl p-6 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
                {/* Avatar */}
                <div className="flex justify-center mb-5">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                      style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)' }}>
                      {initials}
                    </div>
                  )}
                </div>

                <div className="text-center mb-5">
                  <h2 className="text-xl font-black" style={{ color: '#2C2C2A' }}>{profile?.prenom} {profile?.nom}</h2>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#1D9E75' }}>🛒 Client ViteComm</p>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                  <InfoRow label="Prénom" value={profile?.prenom} icon="👤" />
                  <InfoRow label="Nom" value={profile?.nom} icon="👤" />
                  <InfoRow label="Email" value={profile?.email} icon="✉️" />
                  <InfoRow label="Téléphone" value={profile?.telephone || '—'} icon="📱" />
                  <InfoRow label="Adresse livraison" value={profile?.profil?.adresse_livraison || '—'} icon="📍" />
                  <InfoRow label="Statut" value={profile?.statut_compte || '—'} icon={profile?.statut_compte === 'Actif' ? '✅' : '🔒'} />
                </div>

                <button onClick={() => setEditing(true)}
                  className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
                  ✏️ Modifier mon profil
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-6 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  {/* Photo upload */}
                  <div className="flex justify-center">
                    <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                      style={{
                        background: photoPreview ? 'transparent' : '#F7F8F3',
                        borderColor: photoPreview ? '#1D9E75' : '#E8E6DF',
                      }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                      ) : profile?.photo_url ? (
                        <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl" style={{ color: '#888780' }}>📷</span>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      {(photoPreview || profile?.photo_url) && (
                        <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">✕</button>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nom" value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} />
                    <Field label="Prénom" value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} />
                  </div>
                  <Field label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                  <Field label="Téléphone" value={form.telephone} onChange={v => setForm(p => ({ ...p, telephone: v }))} />
                  <Field label="Adresse de livraison" value={form.adresse_livraison} onChange={v => setForm(p => ({ ...p, adresse_livraison: v }))} />

                  <div className="flex gap-3 mt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: '#1D9E75', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                      {saving ? '⏳' : '💾 Enregistrer'}
                    </button>
                    <button type="button" onClick={() => {
                      setEditing(false); setPhotoFile(null); setPhotoPreview('')
                      setForm(f => ({
                        ...f, nom: profile?.nom || '', prenom: profile?.prenom || '',
                        telephone: profile?.telephone || '', email: profile?.email || '',
                        adresse_livraison: profile?.profil?.adresse_livraison || '',
                      }))
                    }}
                      className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: '#F0EFEA', color: '#888780', border: 'none' }}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {tab === 'securite' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
              <h3 className="text-sm font-black mb-4" style={{ color: '#2C2C2A' }}>🔑 Changer le mot de passe</h3>
              <PasswordChangeForm />
            </div>

            <div className="rounded-2xl p-6 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
              <h3 className="text-sm font-black mb-2" style={{ color: '#2C2C2A' }}>🚪 Session</h3>
              <p className="text-xs mb-4" style={{ color: '#888780' }}>Déconnectez-vous de votre compte sur cet appareil.</p>
              <button onClick={() => setShowLogout(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#FDE8E2', color: '#D85A30', border: 'none' }}>
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowLogout(false)}>
          <div className="rounded-3xl p-6 w-full max-w-sm shadow-2xl" style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">👋</div>
              <h3 className="text-lg font-black" style={{ color: '#2C2C2A' }}>Se déconnecter ?</h3>
              <p className="text-xs mt-2" style={{ color: '#888780' }}>Vous devrez vous reconnecter pour accéder à votre espace.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                Oui, me déconnecter
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer"
                style={{ background: '#F7F8F3', color: '#5F5E5A', border: '1.5px solid #E8E6DF' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordChangeForm() {
  const [mdp, setMdp] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { if (msg) setTimeout(() => setMsg(''), 3000) }, [msg])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mdp) return setMsg('⚠️ Entrez un nouveau mot de passe.')
    if (mdp.length < 6) return setMsg('⚠️ Au moins 6 caractères.')
    if (mdp !== confirm) return setMsg('⚠️ Les mots de passe ne correspondent pas.')
    setSaving(true); setMsg('')
    try {
      const body = new FormData()
      body.set('mot_de_passe', mdp)
      body.set('mot_de_passe_confirmation', confirm)
      await api.put('/auth/profile', body)
      setMsg('✅ Mot de passe mis à jour.')
      setMdp(''); setConfirm('')
    } catch (e) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center"
          style={{ background: msg.startsWith('✅') ? '#E1F5EE' : '#FDE8E2', color: msg.startsWith('✅') ? '#0F6E56' : '#D85A30' }}>
          {msg}
        </div>
      )}
      <Field label="Nouveau mot de passe" type="password" value={mdp} onChange={setMdp} />
      <Field label="Confirmer" type="password" value={confirm} onChange={setConfirm} />
      <button type="submit" disabled={saving}
        className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer mt-1"
        style={{ background: saving ? '#ccc' : '#1D9E75', color: '#fff', border: 'none' }}>
        {saving ? '⏳' : '🔑 Mettre à jour'}
      </button>
    </form>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#F7F8F3' }}>
      <span className="text-xs font-semibold" style={{ color: '#888780' }}>{icon} {label}</span>
      <span className="text-sm font-bold" style={{ color: '#2C2C2A' }}>{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: '#888780' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
        style={{ background: '#F7F8F3', borderColor: '#E8E6DF', color: '#2C2C2A' }} />
    </div>
  )
}
