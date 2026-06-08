import { useState } from 'react'
import BottomNavLivreur from '../../components/livreur/BottomNav'

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
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 90 }}>
      <div className="relative overflow-hidden px-5 pt-5 pb-6" style={{ background: 'linear-gradient(135deg, #E8A52F 0%, #CA6E17 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-white font-black text-lg">Retour livreur</div>
            <div className="text-white/80 text-xs mt-0.5">Gérez les retours après inspection ou collectes incomplètes.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">Total</div>
            <div className="text-2xl font-black text-white">{totalRetours}</div>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">À récupérer</div>
            <div className="text-2xl font-black text-white">{aRecuperer}</div>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">En cours</div>
            <div className="text-2xl font-black text-white">{enCours}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {retours.map((retour) => {
          const style = STATUT_STYLE[retour.statut]
          return (
            <div key={retour.id} className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-black text-sm text-[#2C2C2A]">Retour #{retour.id}</div>
                  <div className="text-xs text-[#888780]">Commande #{retour.commandeId} • {retour.client}</div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.color }}>
                  {style.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[#5F5E5A] mb-4">
                <div className="rounded-2xl p-3" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Point de collecte</div>
                  <div>{retour.origine}</div>
                </div>
                <div className="rounded-2xl p-3" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Destination</div>
                  <div>{retour.destination}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[#5F5E5A] mb-4">
                <div className="rounded-2xl p-3" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Articles</div>
                  <div>{retour.qte} article{retour.qte > 1 ? 's' : ''}</div>
                </div>
                <div className="rounded-2xl p-3" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Frais</div>
                  <div>{retour.montant.toLocaleString()} F</div>
                </div>
              </div>

              <div className="text-sm text-[#2C2C2A] mb-4">Motif: {retour.motif}</div>
              <button
                onClick={() => changerStatut(retour.id)}
                className="w-full rounded-2xl py-3 font-black text-white"
                style={{ background: retour.statut === 'termine' ? '#888780' : '#D85A30', border: 'none' }}
                disabled={retour.statut === 'termine'}
              >
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

      <BottomNavLivreur />
    </div>
  )
}
