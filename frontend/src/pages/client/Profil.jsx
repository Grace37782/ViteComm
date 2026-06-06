import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import BottomNav from '../../components/client/BottomNav'

/* ─── Helpers ──────────────────────────────────────────── */
function initials(u) {
  if (!u) return '?'
  return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase() || '?'
}

function AvatarCircle({ user, size = 80 }) {
  if (user?.photo_url) {
    return (
      <img
        src={user.photo_url}
        alt="Photo profil"
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid #fff',
          boxShadow: '0 4px 16px rgba(29,158,117,0.25)',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 900, color: '#fff',
        border: '3px solid #fff',
        boxShadow: '0 4px 16px rgba(29,158,117,0.25)',
        flexShrink: 0,
      }}
    >
      {initials(user)}
    </div>
  )
}

function Field({ label, value, icon }) {
  return (
    <div
      style={{
        background: '#F7F8F3',
        border: '1.5px solid #E8E6DF',
        borderRadius: 16,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888780', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2A' }}>
        {value || <span style={{ color: '#C0BEB7' }}>Non renseigné</span>}
      </div>
    </div>
  )
}

/* ─── Component ────────────────────────────────────────── */
export default function Profil() {
  const navigate = useNavigate()
  const { user: ctxUser, login: updateCtx, logout: ctxLogout } = useAuth()

  const [user, setUser]         = useState(ctxUser)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [showLogout, setShowLogout] = useState(false)

  /* form state */
  const [form, setForm] = useState({})

  /* ── Load fresh profile from API ── */
  useEffect(() => {
    api.get('/auth/profile')
      .then(data => {
        setUser(data)
        setForm({
          nom: data.nom || '',
          prenom: data.prenom || '',
          telephone: data.telephone || '',
          email: data.email || '',
          adresse_livraison: data.profil?.adresse_livraison || '',
          mot_de_passe: '',
          mot_de_passe_confirmation: '',
        })
      })
      .catch(err => showToast('❌ ' + err.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(e) {
    e.preventDefault()

    if (form.mot_de_passe && form.mot_de_passe !== form.mot_de_passe_confirmation) {
      return showToast('⚠️ Les mots de passe ne correspondent pas.', 'error')
    }
    if (form.mot_de_passe && form.mot_de_passe.length < 6) {
      return showToast('⚠️ Le mot de passe doit comporter au moins 6 caractères.', 'error')
    }

    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        email: form.email,
        adresse_livraison: form.adresse_livraison,
      }
      if (form.mot_de_passe) {
        payload.mot_de_passe = form.mot_de_passe
        payload.mot_de_passe_confirmation = form.mot_de_passe_confirmation
      }

      const res = await api.put('/auth/profile', payload)
      setUser(res.user)
      updateCtx(res.user, localStorage.getItem('vc_token'))
      showToast('✅ Profil mis à jour !', 'ok')
      setEditing(false)
    } catch (err) {
      showToast('❌ ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    ctxLogout()
    navigate('/connect')
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8F3' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 700, color: '#888780', fontSize: 13 }}>Chargement du profil…</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8F3', fontFamily: 'sans-serif', paddingBottom: 80 }}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          background: toast.type === 'ok' ? '#1D9E75' : '#E24B4A',
          color: '#fff', borderRadius: 16, padding: '14px 20px',
          fontWeight: 700, fontSize: 14, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
        padding: '24px 20px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        {/* Back button */}
        <button
          onClick={() => navigate('/client/accueil')}
          style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Accueil
        </button>

        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AvatarCircle user={user} size={88} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#fff' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              👤 Client · ViteComm
            </div>
          </div>

          {/* Badge statut */}
          <div style={{
            background: user?.statut_compte === 'Actif' ? 'rgba(255,255,255,0.2)' : 'rgba(226,75,74,0.3)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>
            {user?.statut_compte === 'Actif' ? '✅ Compte actif' : `⚠️ ${user?.statut_compte}`}
          </div>
        </div>
      </div>

      {/* ── CARD flottante ── */}
      <div style={{ margin: '-24px 16px 0', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1.5px solid #E8E6DF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888780' }}>Rôle</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1D9E75', marginTop: 2 }}>🛒 Client</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888780' }}>Adresse</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2A', marginTop: 2 }}>
              {user?.profil?.adresse_livraison || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '20px 16px 0' }}>

        {!editing ? (
          /* ── VIEW MODE ── */
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Informations personnelles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Prénom" value={user?.prenom} icon="👤" />
                <Field label="Nom" value={user?.nom} icon="👤" />
                <Field label="Email" value={user?.email} icon="✉️" />
                <Field label="Téléphone" value={user?.telephone} icon="📱" />
                <Field label="Adresse de livraison" value={user?.profil?.adresse_livraison} icon="📍" />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: '#1D9E75', color: '#fff',
                  border: 'none', borderRadius: 18, padding: '16px',
                  fontSize: 15, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
                }}
              >
                ✏️ Modifier mon profil
              </button>
              <button
                onClick={() => setShowLogout(true)}
                style={{
                  background: '#fff', color: '#E24B4A',
                  border: '2px solid #FDDCDC', borderRadius: 18, padding: '14px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </>
        ) : (
          /* ── EDIT MODE ── */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 1 }}>
                Modifier le profil
              </div>
              <button type="button" onClick={() => setEditing(false)}
                style={{ background: 'none', border: 'none', color: '#888780', fontSize: 20, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {[
              { key: 'prenom',  label: 'Prénom',                 icon: '👤', type: 'text'     },
              { key: 'nom',     label: 'Nom',                    icon: '👤', type: 'text'     },
              { key: 'email',   label: 'Email',                  icon: '✉️', type: 'email'    },
              { key: 'telephone', label: 'Téléphone',            icon: '📱', type: 'tel'      },
              { key: 'adresse_livraison', label: 'Adresse livraison', icon: '📍', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888780', display: 'block', marginBottom: 6 }}>
                  {f.icon} {f.label}
                </label>
                <input
                  type={f.type}
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#F7F8F3', border: '1.5px solid #E8E6DF',
                    borderRadius: 14, padding: '13px 14px',
                    fontSize: 14, fontWeight: 600, color: '#2C2C2A',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            {/* Séparateur mot de passe */}
            <div style={{ borderTop: '1px solid #E8E6DF', paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Changer le mot de passe (optionnel)
              </div>
              {[
                { key: 'mot_de_passe',              label: 'Nouveau mot de passe'    },
                { key: 'mot_de_passe_confirmation', label: 'Confirmer le mot de passe' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#888780', display: 'block', marginBottom: 6 }}>
                    🔒 {f.label}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form[f.key] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#F7F8F3', border: '1.5px solid #E8E6DF',
                      borderRadius: 14, padding: '13px 14px',
                      fontSize: 14, fontWeight: 600, color: '#2C2C2A',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#aaa' : '#1D9E75',
                color: '#fff', border: 'none', borderRadius: 18, padding: '16px',
                fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: 4, boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
              }}
            >
              {saving ? '⏳ Enregistrement…' : '💾 Sauvegarder les modifications'}
            </button>
          </form>
        )}
      </div>

      {/* ── LOGOUT CONFIRM MODAL ── */}
      {showLogout && (
        <div
          onClick={() => setShowLogout(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 24,
              padding: '28px 24px 36px',
              width: '100%', maxWidth: 400,
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#2C2C2A' }}>Se déconnecter ?</div>
              <div style={{ fontSize: 13, color: '#888780', marginTop: 6 }}>
                Vous devrez vous reconnecter pour accéder à votre espace.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleLogout}
                style={{
                  background: '#E24B4A', color: '#fff',
                  border: 'none', borderRadius: 16, padding: '15px',
                  fontSize: 15, fontWeight: 900, cursor: 'pointer',
                }}
              >
                Oui, me déconnecter
              </button>
              <button
                onClick={() => setShowLogout(false)}
                style={{
                  background: '#F7F8F3', color: '#5F5E5A',
                  border: '1.5px solid #E8E6DF', borderRadius: 16, padding: '15px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav panierCount={0} />
    </div>
  )
}
