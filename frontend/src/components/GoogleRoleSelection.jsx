import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { completeGoogleRegistration, api } from '../services/api'
import { ShoppingCart, Store, Truck, Loader2, ChevronRight, MapPin, Car } from 'lucide-react'

export default function GoogleRoleSelection({ user, onComplete }) {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { login: updateAuthContext } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('choice') // 'choice' | 'vendeur-form' | 'livreur-form' | 'loading'
  const [error, setError] = useState('')

  // Vendeur form
  const [nomEtablissement, setNomEtablissement] = useState('')
  const [localisationMarche, setLocalisationMarche] = useState('')
  const [idMarche, setIdMarche] = useState('')
  const [markets, setMarkets] = useState([])

  // Livreur form
  const [typeVehicule, setTypeVehicule] = useState('Moto')
  const [immatriculation, setImmatriculation] = useState('')

  const roles = [
    {
      id: 'client',
      label: 'Acheter',
      desc: 'Parcourir les marchés et commander des produits frais',
      icon: ShoppingCart,
      color: '#1D9E75',
      bg: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE',
    },
    {
      id: 'vendeur',
      label: 'Vendre',
      desc: 'Gérer votre étal et vendre vos produits',
      icon: Store,
      color: '#BA7517',
      bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA',
    },
    {
      id: 'livreur',
      label: 'Livrer',
      desc: 'Livrer les commandes et gagner de l\'argent',
      icon: Truck,
      color: '#D85A30',
      bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7',
    },
  ]

  async function handleRoleSelect(roleId) {
    if (roleId === 'client') {
      setStep('loading')
      try {
        const data = await completeGoogleRegistration({ role: 'client' })
        updateAuthContext(data.user, localStorage.getItem('vc_token'))
        onComplete?.()
        navigate('/client/accueil')
      } catch (err) {
        setError(err.message)
        setStep('choice')
      }
    } else if (roleId === 'vendeur') {
      setStep('vendeur-form')
    } else if (roleId === 'livreur') {
      setStep('livreur-form')
    }
  }

  useEffect(() => {
    if (step === 'vendeur-form' && markets.length === 0) {
      api.get('/auth/markets').then(setMarkets).catch(() => {})
    }
  }, [step, markets.length])

  async function handleVendeurSubmit() {
    if (!nomEtablissement.trim() || !localisationMarche.trim()) {
      setError('Nom d\'établissement et marché requis.')
      return
    }
    setStep('loading')
    try {
      const data = await completeGoogleRegistration({
        role: 'vendeur',
        nom_etablissement: nomEtablissement.trim(),
        localisation_marche: localisationMarche.trim(),
        id_marche: idMarche ? Number(idMarche) : undefined,
      })
      updateAuthContext(data.user, localStorage.getItem('vc_token'))
      onComplete?.()
      navigate('/vendeur/dashboard')
    } catch (err) {
      setError(err.message)
      setStep('vendeur-form')
    }
  }

  async function handleLivreurSubmit() {
    if (!immatriculation.trim()) {
      setError('Numéro d\'immatriculation requis.')
      return
    }
    setStep('loading')
    try {
      const data = await completeGoogleRegistration({
        role: 'livreur',
        type_vehicule: typeVehicule,
        immatriculation: immatriculation.trim(),
      })
      updateAuthContext(data.user, localStorage.getItem('vc_token'))
      onComplete?.()
      navigate('/livreur/dashboard')
    } catch (err) {
      setError(err.message)
      setStep('livreur-form')
    }
  }

  if (step === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#1D9E75' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Configuration de votre compte...</p>
        </div>
      </div>
    )
  }

  // ── VENDEUR FORM ──
  if (step === 'vendeur-form') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#BA7517', color: '#fff' }}>
              <Store size={28} />
            </div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Configuration Vendeur</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Quelques infos pour créer votre boutique</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FDE8E2', color: isDark ? '#E87D55' : '#D85A30' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Store size={12} className="inline align-middle mr-1" /> Nom de l'établissement *
              </label>
              <input
                type="text"
                value={nomEtablissement}
                onChange={(e) => { setNomEtablissement(e.target.value); setError('') }}
                placeholder="Ex: Chez Tanti Aïcha"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={12} className="inline align-middle mr-1" /> Marché *
              </label>
              <select
                value={idMarche}
                onChange={(e) => {
                  const id = e.target.value
                  const m = markets.find(m => String(m.id_marche) === id)
                  setIdMarche(id)
                  setLocalisationMarche(m ? m.nom : '')
                  setError('')
                }}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', colorScheme: isDark ? 'dark' : 'light' }}
              >
                <option value="">Sélectionnez un marché</option>
                {markets.map(m => <option key={m.id_marche} value={m.id_marche}>{m.nom}</option>)}
              </select>
            </div>

            <button
              onClick={handleVendeurSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-black text-white cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: '#BA7517', border: 'none' }}
            >
              Créer ma boutique
            </button>

            <button
              onClick={() => { setStep('choice'); setError('') }}
              className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LIVREUR FORM ──
  if (step === 'livreur-form') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#D85A30', color: '#fff' }}>
              <Truck size={28} />
            </div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Configuration Livreur</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vos infos de livreur pour commencer</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FDE8E2', color: isDark ? '#E87D55' : '#D85A30' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Car size={12} className="inline align-middle mr-1" /> Type de véhicule *
              </label>
              <div className="flex gap-2">
                {['Moto', 'Vélo', 'Voiture', 'À pied'].map(v => (
                  <button
                    key={v}
                    onClick={() => setTypeVehicule(v)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    style={{
                      background: typeVehicule === v ? '#D85A30' : 'var(--surface-alt)',
                      color: typeVehicule === v ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${typeVehicule === v ? '#D85A30' : 'var(--border)'}`,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                <Car size={12} className="inline align-middle mr-1" /> Immatriculation *
              </label>
              <input
                type="text"
                value={immatriculation}
                onChange={(e) => { setImmatriculation(e.target.value); setError('') }}
                placeholder="Ex: AB-123-CD"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <button
              onClick={handleLivreurSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-black text-white cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: '#D85A30', border: 'none' }}
            >
              Commencer à livrer
            </button>

            <button
              onClick={() => { setStep('choice'); setError('') }}
              className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ROLE CHOICE ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black"
            style={{ background: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', color: '#1D9E75' }}>
            {(user?.prenom?.[0] || '').toUpperCase()}{(user?.nom?.[0] || '').toUpperCase()}
          </div>
          <h1 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Bienvenue, {user?.prenom} !</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Que voulez-vous faire sur ViteComm ?</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs font-bold text-center" style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FDE8E2', color: isDark ? '#E87D55' : '#D85A30' }}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {roles.map(r => {
            const Icon = r.icon
            return (
              <button
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md active:scale-[1.02]"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: r.bg, color: r.color }}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{r.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            )
          })}
        </div>

        <p className="text-center text-[10px] mt-6" style={{ color: 'var(--text-muted)' }}>
          Vous pourrez changer de rôle plus tard dans les paramètres.
        </p>
      </div>
    </div>
  )
}
