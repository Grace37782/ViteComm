import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { AlertTriangle, Bike, Star, Wallet, Truck, Undo2, Loader2, Save } from 'lucide-react'

export default function Livreur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [dash, setDash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dispo, setDispo] = useState(true)
  const [horaireDebut, setHoraireDebut] = useState('06:00')
  const [horaireFin, setHoraireFin] = useState('20:00')
  const [distanceAction, setDistanceAction] = useState(10)
  const [savingDispo, setSavingDispo] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/livreur/dashboard')
      .then(data => {
        setDash(data)
        setError(null)
        setDispo(data.disponibilite?.est_disponible ?? true)
        setHoraireDebut(data.disponibilite?.heure_debut_dispo?.slice(0,5) || '06:00')
        setHoraireFin(data.disponibilite?.heure_fin_dispo?.slice(0,5) || '20:00')
        setDistanceAction(data.disponibilite?.distance_marche || 10)
      })
      .catch(e => { setError(e.message); showToast(e.message) })
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function toggleDispo() {
    const newVal = !dispo
    setDispo(newVal)
    setSavingDispo(true)
    try {
      await api.put('/livreur/availability', {
        est_disponible: newVal, distance_marche: distanceAction,
        heure_debut_dispo: horaireDebut, heure_fin_dispo: horaireFin,
      })
      showToast(newVal ? 'Vous êtes en ligne' : 'Hors ligne')
    } catch (e) { setDispo(!newVal); showToast(e.message) }
    finally { setSavingDispo(false) }
  }

  async function saveDispo() {
    setSavingDispo(true)
    try {
      await api.put('/livreur/availability', {
        est_disponible: dispo, distance_marche: distanceAction,
        heure_debut_dispo: horaireDebut, heure_fin_dispo: horaireFin,
      })
      showToast('Disponibilité mise à jour')
    } catch (e) { showToast(e.message) }
    finally { setSavingDispo(false) }
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4 ">
        <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl" style={{ background: 'var(--border)' }} />
            <div className="flex-1"><div className="h-4 rounded w-32 mb-2" style={{ background: 'var(--border)' }} /><div className="h-3 rounded w-48" style={{ background: 'var(--border)' }} /></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-3">
        <div className="flex justify-center"><AlertTriangle size={40} /></div>
        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Impossible de charger le tableau de bord</div>
        <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{error}</div>
        <button onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{ background: '#D85A30', color: '#fff' }}>
          Réessayer
        </button>
      </div>
    )
  }

  const score = dash?.score_reputation || 0

  return (
    <div className="px-4 py-4 flex flex-col gap-4 ">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl" style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* PROFIL */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: isDark ? 'rgba(216,90,48,0.2)' : '#D85A30', color: '#fff' }}>
            <Bike size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{dash?.prenom} {dash?.nom}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {dash?.vehicule?.type_vehicule || '—'} · {dash?.vehicule?.immatriculation || '—'}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg" style={{ color: '#D85A30' }}>{score.toFixed(1)}</span>
              <Star size={16} />
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{dash?.nb_avis || 0} avis</div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gains', value: `${(dash?.total_gains || 0).toLocaleString()} F`, icon: <Wallet size={20} />,
            bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3', color: isDark ? '#E87D55' : '#993C1D' },
          { label: 'Actives', value: dash?.courses_actives || 0, icon: <Truck size={20} />,
            bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: isDark ? '#BA7517' : '#FAC775', color: isDark ? '#F3A83B' : '#854F0B' },
          { label: 'Retours', value: dash?.retours_en_attente || 0, icon: <Undo2 size={20} />,
            bg: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2', border: isDark ? '#EF4444' : '#FECACA', color: isDark ? '#F87171' : '#B91C1C' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: card.bg, border: `1.5px solid ${card.border}` }}>
            <div className="mb-1">{card.icon}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
            <div className="font-black text-lg" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* DISPO */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Disponibilité</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Horaires et rayon d'action</div>
          </div>
          <button onClick={toggleDispo} disabled={savingDispo}
            className="rounded-2xl px-5 py-2 font-black text-sm cursor-pointer transition-all active:scale-95"
            style={{
              background: dispo ? (isDark ? 'rgba(216,90,48,0.2)' : '#D85A30') : 'var(--surface-alt)',
              color: dispo ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${dispo ? '#D85A30' : 'var(--border)'}`,
              opacity: savingDispo ? 0.6 : 1,
            }}>
            {dispo ? 'En ligne' : 'Hors ligne'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Début</div>
            <input type="time" value={horaireDebut} onChange={e => setHoraireDebut(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
          </label>
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Fin</div>
            <input type="time" value={horaireFin} onChange={e => setHoraireFin(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
          </label>
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Rayon</div>
            <input type="number" min="1" value={distanceAction} onChange={e => setDistanceAction(Number(e.target.value))}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>km</div>
          </label>
        </div>
        <button onClick={saveDispo} disabled={savingDispo}
          className="mt-3 w-full rounded-2xl py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-98"
          style={{ background: 'var(--surface-alt)', color: 'var(--accent)', border: '1.5px solid var(--border)' }}>
          {savingDispo ? <><Loader2 size={14} className="animate-spin inline" /> Enregistrement…</> : <><Save size={14} className="inline align-middle" /> Enregistrer les paramètres</>}
        </button>
      </div>

      {/* VÉHICULE */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Mon véhicule</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Type et immatriculation</div>
          </div>
          <div className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' }}>
            {dash?.vehicule?.type_vehicule}
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Véhicule</div>
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{dash?.vehicule?.type_vehicule || '—'}</div>
            </div>
            <div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Immatriculation</div>
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{dash?.vehicule?.immatriculation || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
