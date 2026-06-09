import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

const RETOURS_INIT = [
  { id: 701, commandeId: 1203, client: 'Awa D.', origine: 'Akpakpa Centre', destination: 'Haie Vive', qte: 3, montant: 300, motif: 'Articles rejetés après inspection', statut: 'attente' },
  { id: 702, commandeId: 1215, client: 'M. Koffi', origine: 'Zogbo', destination: 'Cococodji', qte: 1, montant: 150, motif: 'Reprise produit fragile', statut: 'en_cours' },
]

export default function RetourLivreur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [retours, setRetours] = useState(RETOURS_INIT)

  function changerStatut(id) {
    setRetours(prev => prev.map(r => {
      if (r.id !== id) return r
      if (r.statut === 'attente') return { ...r, statut: 'en_cours' }
      if (r.statut === 'en_cours') return { ...r, statut: 'termine' }
      return r
    }))
  }

  function statutStyle(statut) {
    const map = {
      attente: { label: 'À récupérer', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      en_cours: { label: 'En cours', bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
      termine: { label: 'Terminé', bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
    }
    return map[statut] || map.attente
  }

  const totalRetours = retours.length
  const aRecuperer = retours.filter(r => r.statut === 'attente').length
  const enCours = retours.filter(r => r.statut === 'en_cours').length

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: totalRetours, icon: '↩️',
            bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3', color: isDark ? '#E87D55' : '#993C1D' },
          { label: 'À récupérer', value: aRecuperer, icon: '📦',
            bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: isDark ? '#BA7517' : '#FAC775', color: isDark ? '#F3A83B' : '#854F0B' },
          { label: 'En cours', value: enCours, icon: '🚚',
            bg: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB', color: isDark ? '#34D399' : '#0F6E56' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* LIST */}
      {retours.map(retour => {
        const st = statutStyle(retour.statut)
        return (
          <div key={retour.id} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Retour #{retour.id}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Commande #{retour.commandeId} · {retour.client}</div>
              </div>
              <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="font-semibold">Point de collecte</div>
                <div>{retour.origine}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="font-semibold">Destination</div>
                <div>{retour.destination}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="font-semibold">Articles</div>
                <div>{retour.qte} article{retour.qte > 1 ? 's' : ''}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="font-semibold">Frais</div>
                <div>{retour.montant.toLocaleString()} F</div>
              </div>
            </div>
            <div className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Motif: {retour.motif}</div>
            <button onClick={() => changerStatut(retour.id)}
              className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
              style={{ background: retour.statut === 'termine' ? (isDark ? '#3A3B38' : '#888780') : '#D85A30', border: 'none' }}
              disabled={retour.statut === 'termine'}>
              {retour.statut === 'attente' ? 'Confirmer la récupération' : retour.statut === 'en_cours' ? 'Marquer comme livré' : 'Retour terminé'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
