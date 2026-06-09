import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const MOTIFS_REPUTATION = [
  { label: 'Ponctualité', icon: '⏱️', description: 'Respect des horaires de livraison' },
  { label: 'Fiabilité', icon: '🤝', description: 'Conformité de la collecte et de la livraison' },
  { label: 'Communication', icon: '💬', description: 'Réactivité et courtoisie' },
  { label: 'Sécurité', icon: '🛡️', description: 'Prise en charge des marchandises' },
]

export default function LivreurProfil() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { user: ctxUser, login: updateCtx, logout: ctxLogout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', type_vehicule: '', immatriculation: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const [tab, setTab] = useState('profil')

  useEffect(() => {
    api.get('/livreur/profil')
      .then(data => {
        setProfile(data)
        setForm({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || '',
          type_vehicule: data.type_vehicule || '',
          immatriculation: data.immatriculation || '',
        })
      })
      .catch(e => showToast('❌ ' + e.message))
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
    if (!form.nom || !form.prenom || !form.email) return showToast('⚠️ Nom, prénom et email requis.')
    setSaving(true)
    try {
      const body = new FormData()
      body.set('nom', form.nom)
      body.set('prenom', form.prenom)
      body.set('email', form.email)
      body.set('telephone', form.telephone)
      body.set('type_vehicule', form.type_vehicule)
      body.set('immatriculation', form.immatriculation)
      if (photoFile) body.set('photo', photoFile)
      const res = await api.put('/livreur/profil', body)
      setProfile(p => ({ ...p, ...res }))
      showToast('✅ Profil mis à jour !')
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview('')
      // Update auth context if nom/prenom changed
      if (res.nom && res.prenom) {
        updateCtx({ ...ctxUser, nom: res.nom, prenom: res.prenom, photo_url: res.photo_url || ctxUser?.photo_url })
      }
    } catch (e) { showToast('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  function handleLogout() { ctxLogout(); navigate('/connect') }

  const score = profile?.score_reputation || 0
  const initials = ((profile?.prenom?.[0] || '') + (profile?.nom?.[0] || '')).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="rounded-2xl h-48 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2">
        {[
          { id: 'profil', label: '👤 Mon profil' },
          { id: 'reputation', label: '⭐ Réputation' },
          { id: 'securite', label: '🔒 Sécurité' },
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
                <p className="text-sm font-semibold mt-1" style={{ color: isDark ? '#E87D55' : '#D85A30' }}>🚚 Livreur ViteComm</p>
              </div>
              <div className="flex flex-col gap-3 mb-5">
                <InfoRow label="Véhicule" value={profile?.type_vehicule || '—'} icon="🏍️" />
                <InfoRow label="Immatriculation" value={profile?.immatriculation || '—'} icon="🔢" />
                <InfoRow label="Email" value={profile?.email || '—'} icon="✉️" />
                <InfoRow label="Téléphone" value={profile?.telephone || '—'} icon="📱" />
                <InfoRow label="Réputation" value={`${score.toFixed(1)}/5 (${profile?.nb_avis || 0} avis)`} icon="⭐" />
                <InfoRow label="Statut" value={profile?.statut_compte || '—'} icon={profile?.statut_compte === 'Actif' ? '✅' : '🔒'} />
              </div>
              <button onClick={() => setEditing(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:shadow-md active:scale-95"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                ✏️ Modifier mon profil
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: photoPreview ? 'transparent' : 'var(--surface-alt)', borderColor: photoPreview ? '#D85A30' : 'var(--border)' }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : profile?.photo_url ? (
                      <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl" style={{ color: 'var(--text-muted)' }}>📷</span>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    {(photoPreview || profile?.photo_url) && (
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">✕</button>
                    )}
                  </label>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Informations véhicule</div>
                <Field label="🏍️ Type de véhicule" value={form.type_vehicule} onChange={v => setForm(p => ({ ...p, type_vehicule: v }))} isDark={isDark} />
                <Field label="🔢 Immatriculation" value={form.immatriculation} onChange={v => setForm(p => ({ ...p, immatriculation: v }))} isDark={isDark} />

                <div className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--text-muted)' }}>Informations personnelles</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom" value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} isDark={isDark} />
                  <Field label="Prénom" value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} isDark={isDark} />
                </div>
                <Field label="✉️ Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} isDark={isDark} />
                <Field label="📱 Téléphone" value={form.telephone} onChange={v => setForm(p => ({ ...p, telephone: v }))} isDark={isDark} />

                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all active:scale-95"
                    style={{ background: '#D85A30', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                    {saving ? '⏳' : '💾 Enregistrer'}
                  </button>
                  <button type="button" onClick={() => {
                    setEditing(false); setPhotoFile(null); setPhotoPreview('')
                    setForm({
                      nom: profile?.nom || '', prenom: profile?.prenom || '',
                      email: profile?.email || '', telephone: profile?.telephone || '',
                      type_vehicule: profile?.type_vehicule || '', immatriculation: profile?.immatriculation || '',
                    })
                  }}
                    className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: 'none' }}>
                    Annuler
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
            style={{ background: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: `1.5px solid ${isDark ? '#2DC491' : '#9FE1CB'}` }}>
            <div className="text-5xl mb-3">⭐</div>
            <div className="text-4xl font-black" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>{score.toFixed(1)}/5</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Score de réputation ({profile?.nb_avis || 0} avis)</div>
            <div className="flex justify-center gap-1 mt-3">
              {[1,2,3,4,5].map(s => <span key={s} className="text-2xl" style={{ opacity: s <= Math.round(score) ? 1 : 0.3 }}>⭐</span>)}
            </div>
          </div>
          {MOTIFS_REPUTATION.map(m => (
            <div key={m.label} className="rounded-2xl p-4 transition-all hover:shadow-sm"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7' }}>
                  {m.icon}
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.description}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
            Votre score est calculé automatiquement à partir des retours clients.
          </div>
        </div>
      )}

      {/* SECURITE */}
      {tab === 'securite' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-4" style={{ color: 'var(--text-primary)' }}>🔑 Changer le mot de passe</h3>
            <PasswordChangeForm isDark={isDark} />
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>🚪 Session</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Déconnectez-vous de votre compte sur cet appareil.</p>
            <button onClick={() => setShowLogout(true)}
              className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:shadow-md active:scale-95"
              style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2', color: isDark ? '#F87171' : '#D85A30', border: 'none' }}>
              🚪 Se déconnecter
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
              <div className="text-5xl mb-3">👋</div>
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Se déconnecter ?</h3>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Vous devrez vous reconnecter pour accéder à votre espace livreur.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all active:scale-95"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                Oui, me déconnecter
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordChangeForm({ isDark }) {
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
      await api.put('/livreur/profil', {
        mot_de_passe: mdp,
        mot_de_passe_confirmation: confirm
      })
      setMsg('✅ Mot de passe mis à jour.')
      setMdp(''); setConfirm('')
    } catch (e) { setMsg('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold text-center"
          style={{ background: msg.startsWith('✅') ? (isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE') : (isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2'), color: msg.startsWith('✅') ? (isDark ? '#34D399' : '#0F6E56') : (isDark ? '#F87171' : '#D85A30') }}>
          {msg}
        </div>
      )}
      <Field label="Nouveau mot de passe" type="password" value={mdp} onChange={setMdp} isDark={isDark} />
      <Field label="Confirmer" type="password" value={confirm} onChange={setConfirm} isDark={isDark} />
      <button type="submit" disabled={saving}
        className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer mt-1 transition-all active:scale-95"
        style={{ background: saving ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30', color: '#fff', border: 'none' }}>
        {saving ? '⏳' : '🔑 Mettre à jour'}
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

function Field({ label, value, onChange, type = 'text', isDark }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
    </div>
  )
}
