import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/client/BottomNav'

const COMMANDE = {
  id: 1042,
  frais_livraison: 450,
  frais_retour_par_article: 150,
  articles: [
    { id: 101, emoji: '🍅', nom: 'Tomates fraîches',  qte: 2, prix: 250,  unite: 'kg',    etalNom: 'Étal Maman Adjoua' },
    { id: 103, emoji: '🥬', nom: 'Gombo frais',       qte: 1, prix: 300,  unite: 'tas',   etalNom: 'Étal Maman Adjoua' },
    { id: 201, emoji: '🐟', nom: 'Poisson capitaine', qte: 1, prix: 1800, unite: 'kg',    etalNom: 'Étal Brice Poisson' },
  ],
}

export default function Inspection() {
  const navigate  = useNavigate()
  const fileRef   = useRef(null)

  // { id: 'accepte' | 'rejete' }
  const [statuts, setStatuts]   = useState({})
  // { id: 'motif texte' }
  const [motifs, setMotifs]     = useState({})
  // photos de preuve
  const [photos, setPhotos]     = useState([])
  const [loading, setLoading]   = useState(false)

  function setStatut(id, val) {
    setStatuts((p) => ({ ...p, [id]: val }))
    if (val === 'accepte') setMotifs((p) => { const n = { ...p }; delete n[id]; return n })
  }

  function setMotif(id, val) {
    setMotifs((p) => ({ ...p, [id]: val }))
  }

  function ajouterPhoto(e) {
    const files = Array.from(e.target.files || [])
    const urls  = files.map((f) => URL.createObjectURL(f))
    setPhotos((p) => [...p, ...urls])
  }

  /* ── Calculs dynamiques ───────────────────────────────── */
  const tousDefinis     = COMMANDE.articles.every((a) => statuts[a.id])
  const articlesAcceptes = COMMANDE.articles.filter((a) => statuts[a.id] === 'accepte')
  const articlesRejetes  = COMMANDE.articles.filter((a) => statuts[a.id] === 'rejete')
  const totalMarchandises = articlesAcceptes.reduce((s, a) => s + a.prix * a.qte, 0)
  const fraisRetour       = articlesRejetes.length * COMMANDE.frais_retour_par_article
  const totalFinal        = totalMarchandises + COMMANDE.frais_livraison + fraisRetour
  const tousRejetes       = articlesRejetes.length === COMMANDE.articles.length
  const motifManquant     = articlesRejetes.some((a) => !motifs[a.id]?.trim())

  async function confirmer() {
    if (!tousDefinis || motifManquant) return
    setLoading(true)
    // TODO: POST /api/commandes/:id/inspection { statuts, motifs, photos }
    setTimeout(() => {
      setLoading(false)
      navigate('/client/historique')
    }, 1200)
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/client/suivi')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Inspection — Commande #{COMMANDE.id}</div>
            <div className="text-white/70 text-xs">Inspectez chaque article avant de payer</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ══ CONSIGNE ══ */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: '#FAECE7', border: '1.5px solid #F5C4B3' }}>
          <span className="text-xl flex-shrink-0">📦</span>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: '#993C1D' }}>
            Inspectez chaque article <strong>en présence du livreur</strong>. Acceptez ou rejetez article par article. Vous ne payez que ce que vous acceptez.
          </p>
        </div>

        {/* ══ ARTICLES ══ */}
        <div className="flex flex-col gap-3">
          {COMMANDE.articles.map((a) => {
            const st = statuts[a.id]
            return (
              <div key={a.id} className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  border: `2px solid ${st === 'accepte' ? '#9FE1CB' : st === 'rejete' ? '#F5C4B3' : '#E8E6DF'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>

                {/* Infos article */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: '#F7F8F3' }}>{a.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{a.nom}</div>
                    <div className="text-xs" style={{ color: '#888780' }}>
                      {a.qte} {a.unite} · {(a.prix * a.qte).toLocaleString()} F · {a.etalNom}
                    </div>
                  </div>
                </div>

                {/* Boutons Accepter / Rejeter */}
                <div className="flex gap-2 px-4 pb-3">
                  <button onClick={() => setStatut(a.id, 'accepte')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black cursor-pointer transition-all"
                    style={{
                      background: st === 'accepte' ? '#1D9E75' : '#F7F8F3',
                      color:      st === 'accepte' ? '#fff'    : '#5F5E5A',
                      border: `1.5px solid ${st === 'accepte' ? '#1D9E75' : '#E8E6DF'}`,
                    }}>
                    {st === 'accepte' ? '✓ Accepté' : '✓ Accepter'}
                  </button>
                  <button onClick={() => setStatut(a.id, 'rejete')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black cursor-pointer transition-all"
                    style={{
                      background: st === 'rejete' ? '#D85A30' : '#F7F8F3',
                      color:      st === 'rejete' ? '#fff'    : '#5F5E5A',
                      border: `1.5px solid ${st === 'rejete' ? '#D85A30' : '#E8E6DF'}`,
                    }}>
                    {st === 'rejete' ? '✗ Rejeté' : '✗ Rejeter'}
                  </button>
                </div>

                {/* Motif rejet obligatoire */}
                {st === 'rejete' && (
                  <div className="px-4 pb-3">
                    <textarea
                      placeholder="Motif du rejet obligatoire (ex: produit avarié, mauvaise qualité…)"
                      value={motifs[a.id] || ''}
                      onChange={(e) => setMotif(a.id, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
                      style={{
                        background: '#FAECE7',
                        border: `1.5px solid ${motifs[a.id]?.trim() ? '#F5C4B3' : '#E24B4A'}`,
                        color: '#2C2C2A',
                        fontFamily: 'inherit',
                      }}
                    />
                    {!motifs[a.id]?.trim() && (
                      <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>⚠ Motif requis</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ══ PREUVES PHOTOS (optionnel) ══ */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📸</span>
              <h3 className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                Photos de preuve <span style={{ color: '#888780', fontWeight: 400 }}>(optionnel)</span>
              </h3>
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: '#E1F5EE', color: '#0F6E56', border: 'none' }}>
              + Ajouter
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={ajouterPhoto} />
          </div>

          {photos.length === 0 ? (
            <div className="rounded-xl py-4 text-center" style={{ background: '#F7F8F3' }}>
              <p className="text-xs" style={{ color: '#888780' }}>
                Ajoutez des photos si vous contestez la qualité des produits
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-square">
                  <img src={url} alt={`preuve ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ RECALCUL DYNAMIQUE ══ */}
        {tousDefinis && (
          <div className="rounded-2xl p-4"
            style={{ background: tousRejetes ? '#FAECE7' : '#E1F5EE',
                     border: `1.5px solid ${tousRejetes ? '#F5C4B3' : '#9FE1CB'}` }}>
            <h3 className="font-black text-sm mb-3" style={{ color: '#2C2C2A' }}>
              Récapitulatif de paiement
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#5F5E5A' }}>
                  Articles acceptés ({articlesAcceptes.length}/{COMMANDE.articles.length})
                </span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>
                  {totalMarchandises.toLocaleString()} F
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#5F5E5A' }}>Frais de livraison</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>
                  {COMMANDE.frais_livraison.toLocaleString()} F
                </span>
              </div>
              {fraisRetour > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#D85A30' }}>
                    Frais de retour ({articlesRejetes.length} article{articlesRejetes.length > 1 ? 's' : ''})
                  </span>
                  <span className="font-semibold" style={{ color: '#D85A30' }}>
                    +{fraisRetour.toLocaleString()} F
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1"
                style={{ borderTop: `1.5px solid ${tousRejetes ? '#F5C4B3' : '#9FE1CB'}` }}>
                <span className="font-black text-base" style={{ color: '#2C2C2A' }}>
                  {tousRejetes ? 'Frais de retour uniquement' : 'Total à payer maintenant'}
                </span>
                <span className="font-black text-base"
                  style={{ color: tousRejetes ? '#D85A30' : '#1D9E75' }}>
                  {tousRejetes ? fraisRetour.toLocaleString() : totalFinal.toLocaleString()} F
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══ BOUTON CONFIRMER ══ */}
        <button onClick={confirmer}
          disabled={!tousDefinis || motifManquant || loading}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: (!tousDefinis || motifManquant) ? '#D3D1C7' : '#1D9E75',
            border: 'none',
            boxShadow: (!tousDefinis || motifManquant) ? 'none' : '0 6px 24px rgba(29,158,117,0.4)',
            cursor: (!tousDefinis || motifManquant) ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
          }}>
          {loading ? '⏳ Confirmation…'
            : !tousDefinis ? 'Inspectez tous les articles pour continuer'
            : motifManquant ? 'Renseignez les motifs de rejet'
            : tousRejetes ? `Confirmer le retour — ${fraisRetour.toLocaleString()} F →`
            : `Confirmer et payer — ${totalFinal.toLocaleString()} F →`}
        </button>

      </div>
      <BottomNav panierCount={0} />
    </div>
  )
}