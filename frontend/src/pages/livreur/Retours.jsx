import { useState } from 'react'

const RETOURS_INIT = [
  {
    id: 701,
    commandeId: 1203,
    client: 'Awa D.',
    origine: 'Akpakpa Centre',
    destination: 'Haie Vive',
    qte: 3,
    montant: 300,
    motif: 'Articles rejetés après inspection',
    statut: 'attente',
  },
  {
    id: 702,
    commandeId: 1215,
    client: 'M. Koffi',
    origine: 'Zogbo',
    destination: 'Cococodji',
    qte: 1,
    montant: 150,
    motif: 'Reprise produit fragile',
    statut: 'en_cours',
  },
]

const STATUT_STYLE = {
  attente: { label: 'À récupérer', bg: '#FAEEDA', color: '#854F0B' },
  en_cours: { label: 'En cours', bg: '#E6F5EA', color: '#1D9E75' },
  termine: { label: 'Terminé', bg: '#E8F4FF', color: '#1664C1' },
}

export default function RetourLivreur() {
  const [retours, setRetours] = useState(RETOURS_INIT)

  function changerStatut(id) {
    setRetours((prev) =>
      prev.map((retour) => {
        if (retour.id !== id) return retour
        if (retour.statut === 'attente') return { ...retour, statut: 'en_cours' }
        if (retour.statut === 'en_cours') return { ...retour, statut: 'termine' }
        return retour
      })
    )
  }

  const totalRetours = retours.length
  const aRecuperer = retours.filter((r) => r.statut === 'attente').length
  const enCours = retours.filter((r) => r.statut === 'en_cours').length

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* ══ STATS ══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: totalRetours, accent: '#D85A30' },
          { label: 'À récupérer', value: aRecuperer, accent: '#BA7517' },
          { label: 'En cours', value: enCours, accent: '#1D9E75' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ══ LISTE RETOURS ══ */}
      {retours.map((retour) => {
        const style = STATUT_STYLE[retour.statut]
        return (
          <div key={retour.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Retour #{retour.id}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Commande #{retour.commandeId} · {retour.client}</div>
              </div>
              <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.color }}>
                {style.label}
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
              className="w-full rounded-2xl py-3 font-black text-white"
              style={{ background: retour.statut === 'termine' ? '#888780' : '#D85A30', border: 'none' }}
              disabled={retour.statut === 'termine'}>
              {retour.statut === 'attente'
                ? 'Confirmer la récupération'
                : retour.statut === 'en_cours'
                ? 'Marquer comme livré'
                : 'Retour terminé'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
