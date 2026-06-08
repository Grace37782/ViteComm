import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavVendeur from '../../components/vendeur/BottomNav'

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
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 88 }}>
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/vendeur/dashboard')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Retours produits</div>
            <div className="text-white/70 text-xs">Suivez les articles rejetés et la récupération des stocks</div>
          </div>
        </div>

        <div className="relative z-10 rounded-3xl p-4"
          style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-white/80">Retours</div>
              <div className="text-white font-black text-2xl">{totalRetours}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80">Pertes estimées</div>
              <div className="text-white font-black text-2xl">{totalPertes.toLocaleString()} F</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'tous', label: `Tous (${totalRetours})` },
            { id: 'a_recuperer', label: `À récupérer (${enAttente})` },
            { id: 'recupere', label: `Récupérés (${filtres.recupere.length})` },
          ].map((item) => (
            <button key={item.id} onClick={() => setFiltre(item.id)}
              className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer"
              style={{
                background: filtre === item.id ? '#BA7517' : '#F4F4EF',
                color: filtre === item.id ? '#fff' : '#5F5E5A',
                border: filtre === item.id ? 'none' : '1.5px solid #E8E6DF',
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
                        <div className="text-xs text-[#5F5E5A]">Produit</div>
                        <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{retour.produit}</div>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                        <div className="text-xs text-[#5F5E5A]">Quantité</div>
                        <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                          {retour.qte} {retour.unite}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                      <div className="text-xs text-[#5F5E5A]">Motif du rejet</div>
                      <div className="text-sm font-semibold" style={{ color: '#2C2C2A' }}>{retour.motif}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-[#5F5E5A]">
                      <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                        <div>Client</div>
                        <div className="font-black text-sm text-[#2C2C2A]">{retour.client}</div>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                        <div>Lieu de retour</div>
                        <div className="font-black text-sm text-[#2C2C2A]">{retour.lieu}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-[#5F5E5A]">Perte estimée</div>
                        <div className="font-black text-sm text-[#D85A30]">{retour.perte.toLocaleString()} F</div>
                      </div>
                      {retour.statut === 'a_recuperer' ? (
                        <button onClick={() => marquerRecupere(retour.id)}
                          className="px-4 py-3 rounded-2xl text-sm font-black cursor-pointer"
                          style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
                          Marquer récupéré
                        </button>
                      ) : (
                        <div className="text-xs font-bold text-[#0F6E56]">Récupération confirmée</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavVendeur />
    </div>
  )
}
