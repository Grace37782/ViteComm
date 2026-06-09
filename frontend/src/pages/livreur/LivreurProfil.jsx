import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const { logout: ctxLogout } = useAuth()
  const [dash, setDash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type_vehicule: '', immatriculation: '' })
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const [tab, setTab] = useState('profil')

  useEffect(() => {
    api.get('/livreur/dashboard')
      .then(data => {
        setDash(data)
        setForm({
          type_vehicule: data.vehicule?.type_vehicule || '',
          immatriculation: data.vehicule?.immatriculation || '',
        })
      })
      .catch(e => showToast('❌ ' + e.message))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.type_vehicule || !form.immatriculation) return showToast('⚠️ Tous les champs sont requis', 'error')
    setSaving(true)
    try {
      const body = new FormData()
      body.set('type_vehicule', form.type_vehicule)
      body.set('immatriculation', form.immatriculation)
      await api.put('/auth/profile', body)
      setDash(d => ({ ...d, vehicule: { type_vehicule: form.type_vehicule, immatriculation: form.immatriculation } }))
      showToast('✅ Profil mis à jour !')
      setEditing(false)
    } catch (e) { showToast('❌ ' + e.message) }
    finally { setSaving(false) }
  }

  function handleLogout() {
    ctxLogout()
    navigate('/connect')
  }

  const score = dash?.score_reputation || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Chargement du profil…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.startsWith('✅') ? '#D85A30' : '#D85A30' }}>
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
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
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
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #D85A30, #993C1D)' }}>
                  🏍️
                </div>
              </div>
              <div className="text-center mb-5">
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Espace Livreur</h2>
                <p className="text-sm font-semibold mt-1" style={{ color: '#D85A30' }}>🚚 Livreur ViteComm</p>
              </div>
              <div className="flex flex-col gap-3 mb-5">
                <InfoRow label="Véhicule" value={form.type_vehicule || '—'} icon="🏍️" />
                <InfoRow label="Immatriculation" value={form.immatriculation || '—'} icon="🔢" />
                <InfoRow label="Réputation" value={`${score.toFixed(1)}/5`} icon="⭐" />
                <InfoRow label="Gains" value={`${(dash?.total_gains || 0).toLocaleString()} F`} icon="💰" />
                <InfoRow label="Courses" value={dash?.courses_effectuees || 0} icon="📦" />
              </div>
              <button onClick={() => setEditing(true)}
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                ✏️ Modifier mon profil
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Informations véhicule</div>
                <Field label="🏍️ Type de véhicule" value={form.type_vehicule} onChange={v => setForm(p => ({ ...p, type_vehicule: v }))} />
                <Field label="🔢 Immatriculation" value={form.immatriculation} onChange={v => setForm(p => ({ ...p, immatriculation: v }))} />
                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer"
                    style={{ background: '#D85A30', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                    {saving ? '⏳' : '💾 Enregistrer'}
                  </button>
                  <button type="button" onClick={() => {
                    setEditing(false)
                    setForm({ type_vehicule: dash?.vehicule?.type_vehicule || '', immatriculation: dash?.vehicule?.immatriculation || '' })
                  }}
                    className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer"
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
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-5xl mb-3">⭐</div>
            <div className="text-4xl font-black" style={{ color: '#D85A30' }}>{score.toFixed(1)}/5</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Score de réputation</div>
            <div className="flex justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className="text-2xl" style={{ opacity: s <= Math.round(score) ? 1 : 0.3 }}>⭐</span>
              ))}
            </div>
          </div>

          {MOTIFS_REPUTATION.map(m => (
            <div key={m.label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FDE8E2' }}>
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
            <PasswordChangeForm />
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>🚪 Session</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Déconnectez-vous de votre compte sur cet appareil.</p>
            <button onClick={() => setShowLogout(true)}
              className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: '#FDE8E2', color: '#D85A30', border: 'none' }}>
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
                className="w-full rounded-2xl py-3 text-sm font-black cursor-pointer"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                Oui, me déconnecter
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold cursor-pointer"
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
        style={{ background: saving ? '#ccc' : '#D85A30', color: '#fff', border: 'none' }}>
        {saving ? '⏳' : '🔑 Mettre à jour'}
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
