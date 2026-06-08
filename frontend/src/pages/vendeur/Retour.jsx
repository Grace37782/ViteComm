import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const RETOURS_INIT = [
  {
    id: 501,
    date: '07 juin 2026',
    commandeId: 1042,
    produit: 'Oignons rouges',
    qte: 2,
    unite: 'kg',
    motif: 'Légumes abîmés à la livraison',
    client: 'Mme Adja',
    statut: 'a_recuperer',
    lieu: 'Marché Dantokpa',
    perte: 360,
  },
  {
    id: 502,
    date: '05 juin 2026',
    commandeId: 1039,
    produit: 'Gombo frais',
    qte: 1,
    unite: 'tas',
    motif: 'Feuilles trop jaunes',
    client: 'M. Kofi',
    statut: 'recupere',
    lieu: 'Point de collecte B',
    perte: 300,
  },
  {
    id: 503,
    date: '03 juin 2026',
    commandeId: 1028,
    produit: 'Piments frais',
    qte: 1,
    unite: 'tas',
    motif: 'Produit trop mûr / non consommable',
    client: 'Mme Aïcha',
    statut: 'a_recuperer',
    lieu: 'Marché Dantokpa',
    perte: 150,
  },
]

const STATUT_STYLE = {
  a_recuperer: { label: 'À récupérer', bg: '#FAEEDA', color: '#854F0B' },
  recupere:    { label: 'Récupéré',    bg: '#E1F5EE', color: '#0F6E56' },
}

export default function RetourVendeur() {
  const navigate = useNavigate()
  const [retours, setRetours] = useState(RETOURS_INIT)
  const [filtre, setFiltre] = useState('tous')

  const filtres = {
    tous: retours,
    a_recuperer: retours.filter((r) => r.statut === 'a_recuperer'),
    recupere: retours.filter((r) => r.statut === 'recupere'),
  }

  const liste = filtres[filtre] || retours
  const totalRetours = retours.length
  const totalPertes = retours.reduce((sum, r) => sum + r.perte, 0)
  const enAttente = filtres.a_recuperer.length

  function marquerRecupere(id) {
    setRetours((prev) => prev.map((r) =>
      r.id === id ? { ...r, statut: 'recupere' } : r
    ))
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* Résumé */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', border: '1.5px solid #E8E6DF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold" style={{ color: '#888780' }}>Retours</div>
            <div className="font-black text-2xl" style={{ color: '#2C2C2A' }}>{totalRetours}</div>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: '#888780' }}>Pertes estimées</div>
            <div className="font-black text-2xl" style={{ color: '#D85A30' }}>{totalPertes.toLocaleString()} F</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tous', label: `Tous (${totalRetours})` },
          { id: 'a_recuperer', label: `À récupérer (${enAttente})` },
          { id: 'recupere', label: `Récupérés (${filtres.recupere.length})` },
        ].map((item) => (
          <button key={item.id} onClick={() => setFiltre(item.id)}
            className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer"
            style={{
              background: filtre === item.id ? '#BA7517' : '#fff',
              color: filtre === item.id ? '#fff' : '#5F5E5A',
              border: `1.5px solid ${filtre === item.id ? '#BA7517' : '#E8E6DF'}`,
            }}>
            {item.label}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="text-5xl mb-3">✔️</div>
          <p className="font-black text-sm" style={{ color: '#888780' }}>
            Aucun retour à afficher dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((retour) => {
            const st = STATUT_STYLE[retour.statut]
            return (
              <div key={retour.id} className="rounded-3xl overflow-hidden"
                style={{ background: '#fff', border: '1.5px solid #E8E6DF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                <div className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{ background: '#F7F8F3', borderBottom: '1px solid #E8E6DF' }}>
                  <div>
                    <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>Retour #{retour.id}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                      Commande #{retour.commandeId} · {retour.date}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                      <div className="text-xs" style={{ color: '#5F5E5A' }}>Produit</div>
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{retour.produit}</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                      <div className="text-xs" style={{ color: '#5F5E5A' }}>Quantité</div>
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                        {retour.qte} {retour.unite}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                    <div className="text-xs" style={{ color: '#5F5E5A' }}>Motif du rejet</div>
                    <div className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>{retour.motif}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                      <div className="text-xs" style={{ color: '#5F5E5A' }}>Client</div>
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{retour.client}</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                      <div className="text-xs" style={{ color: '#5F5E5A' }}>Lieu de retour</div>
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{retour.lieu}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs" style={{ color: '#5F5E5A' }}>Perte estimée</div>
                      <div className="font-black text-sm" style={{ color: '#D85A30' }}>{retour.perte.toLocaleString()} F</div>
                    </div>
                    {retour.statut === 'a_recuperer' ? (
                      <button onClick={() => marquerRecupere(retour.id)}
                        className="px-4 py-3 rounded-2xl text-sm font-black cursor-pointer"
                        style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
                        Marquer récupéré
                      </button>
                    ) : (
                      <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>Récupération confirmée</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
