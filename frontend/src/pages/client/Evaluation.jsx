import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COMMANDES = [
  {
    id: 1042, date: '2025-05-18T09:32:00', statut: 'Partiellement acceptée',
    total: 2750, articles: 3, etals: 2,
    livreur: { id: 10, nom: 'Rodrigue K.' },
    vendeurs: [{ id: 1, nom: 'Étal Maman Adjoua' }, { id: 2, nom: 'Étal Brice Poisson' }],
    evalue: false,
  },
  {
    id: 1035, date: '2025-05-12T14:10:00', statut: 'Entièrement acceptée',
    total: 3200, articles: 4, etals: 2,
    livreur: { id: 11, nom: 'Kofi A.' },
    vendeurs: [{ id: 3, nom: 'Étal Mariam Fruits' }],
    evalue: true,
  },
  {
    id: 1021, date: '2025-05-05T11:00:00', statut: 'Rejetée',
    total: 450, articles: 2, etals: 1,
    livreur: { id: 10, nom: 'Rodrigue K.' },
    vendeurs: [{ id: 2, nom: 'Étal Brice Poisson' }],
    evalue: true,
  },
]

const STATUT_STYLE = {
  'Entièrement acceptée': { bg: '#E1F5EE', color: '#0F6E56', icon: '✅' },
  'Partiellement acceptée': { bg: '#FAEEDA', color: '#854F0B', icon: '⚠️' },
  'Rejetée': { bg: '#FAECE7', color: '#993C1D', icon: '❌' },
}

function Etoiles({ note, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="text-2xl cursor-pointer transition-all active:scale-90"
          style={{ background: 'none', border: 'none', lineHeight: 1 }}>
          {n <= note ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}

export default function Historique() {
  const navigate  = useNavigate()
  const [evalOpen, setEvalOpen]   = useState(null) // id commande
  const [typeEval, setTypeEval]   = useState('livreur') // 'livreur' | 'vendeur'
  const [noteL,    setNoteL]      = useState(0)
  const [commentL, setCommentL]   = useState('')
  const [notesV,   setNotesV]     = useState({}) // { vendeurId: note }
  const [commentsV, setCommentsV] = useState({}) // { vendeurId: comment }
  const [loading,  setLoading]    = useState(false)
  const [signalement, setSignalement] = useState(null) // { type, id, nom }
  const [motifSig, setMotifSig]   = useState('')

  const commande = COMMANDES.find((c) => c.id === evalOpen)

  async function soumettreFeedback() {
    if (typeEval === 'livreur' && noteL === 0) return
    setLoading(true)
    // TODO: POST /api/feedbacks { type: typeEval, note, commentaire, ... }
    setTimeout(() => {
      setLoading(false)
      setEvalOpen(null)
      setNoteL(0); setCommentL('')
      setNotesV({}); setCommentsV({})
    }, 1000)
  }

  async function soumettreSignalement() {
    if (!motifSig.trim()) return
    setLoading(true)
    // TODO: POST /api/signalements { motif, id_cible, type_cible }
    setTimeout(() => {
      setLoading(false)
      setSignalement(null)
      setMotifSig('')
    }, 800)
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/client/accueil')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div>
            <div className="text-white font-black text-base">Mes commandes</div>
            <div className="text-white/70 text-xs">{COMMANDES.length} commandes passées</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {COMMANDES.map((c) => {
          const st = STATUT_STYLE[c.statut] || STATUT_STYLE['Entièrement acceptée']
          return (
            <div key={c.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>

              {/* En-tête commande */}
              <div className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                    Commande #{c.id}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    · {c.articles} articles · {c.etals} étals
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  {st.icon} {c.statut}
                </span>
              </div>

              {/* Total + actions */}
              <div className="px-4 pb-3 flex items-center justify-between gap-2"
                style={{ borderTop: '1px solid var(--border-light)' }}>
                <div>
                  <span className="font-black text-base" style={{ color: '#1D9E75' }}>
                    {c.total.toLocaleString()} F
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>COD</span>
                </div>
                <div className="flex gap-2">
                  {/* Bouton signalement */}
                  <button
                    onClick={() => { setSignalement({ type: 'livreur', id: c.livreur.id, nom: c.livreur.nom }); setMotifSig('') }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
                    style={{ background: '#FAECE7', color: '#D85A30', border: 'none' }}>
                    🚩 Signaler
                  </button>
                  {/* Bouton évaluation */}
                  {!c.evalue && (
                    <button onClick={() => setEvalOpen(c.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
                      style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
                      ⭐ Évaluer
                    </button>
                  )}
                  {c.evalue && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      ✓ Évalué
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ MODAL ÉVALUATION ══ */}
      {evalOpen && commande && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setEvalOpen(null)}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto"
            style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                Laisser un avis
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Commande #{commande.id}
              </p>

              {/* Tabs livreur / vendeur */}
              <div className="flex gap-2 mb-5">
                {['livreur', 'vendeur'].map((t) => (
                  <button key={t} onClick={() => setTypeEval(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all capitalize"
                    style={{
                      background: typeEval === t ? '#1D9E75' : 'var(--surface-alt)',
                      color:      typeEval === t ? '#fff'    : 'var(--text-secondary)',
                      border: `1.5px solid ${typeEval === t ? '#1D9E75' : 'var(--border)'}`,
                    }}>
                    {t === 'livreur' ? '🏍️ Livreur' : '🏪 Vendeur(s)'}
                  </button>
                ))}
              </div>

              {/* Éval livreur */}
              {typeEval === 'livreur' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                    <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {commande.livreur.nom}
                    </div>
                    <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                      Note sur la livraison
                    </div>
                    <Etoiles note={noteL} onChange={setNoteL} />
                  </div>
                  <textarea placeholder="Commentaire (optionnel)…"
                    value={commentL} onChange={(e) => setCommentL(e.target.value)}
                    rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                </div>
              )}

              {/* Éval vendeurs */}
              {typeEval === 'vendeur' && (
                <div className="flex flex-col gap-3">
                  {commande.vendeurs.map((v) => (
                    <div key={v.id} className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                      <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{v.nom}</div>
                      <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Note sur les produits</div>
                      <Etoiles note={notesV[v.id] || 0} onChange={(n) => setNotesV((p) => ({ ...p, [v.id]: n }))} />
                      <textarea placeholder="Commentaire (optionnel)…"
                        value={commentsV[v.id] || ''}
                        onChange={(e) => setCommentsV((p) => ({ ...p, [v.id]: e.target.value }))}
                        rows={2} className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none mt-3"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              )}

              <button onClick={soumettreFeedback}
                disabled={loading || (typeEval === 'livreur' && noteL === 0)}
                className="w-full mt-5 py-4 rounded-2xl text-white font-black text-base cursor-pointer"
                style={{
                  background: (typeEval === 'livreur' && noteL === 0) ? '#D3D1C7' : '#1D9E75',
                  border: 'none', opacity: loading ? 0.75 : 1,
                }}>
                {loading ? '⏳ Envoi…' : 'Soumettre mon avis →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL SIGNALEMENT ══ */}
      {signalement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSignalement(null)}>
          <div className="w-full max-w-lg rounded-t-[28px] p-5"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-1 pb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <h2 className="font-black text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              🚩 Signaler {signalement.nom}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Ce signalement sera traité par l'administrateur ViteComm.
            </p>
            <textarea placeholder="Décrivez le problème (comportement abusif, fraude…)"
              value={motifSig} onChange={(e) => setMotifSig(e.target.value)}
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
            <button onClick={soumettreSignalement}
              disabled={!motifSig.trim() || loading}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{
                background: motifSig.trim() ? '#D85A30' : '#D3D1C7',
                border: 'none', opacity: loading ? 0.75 : 1,
              }}>
              {loading ? '⏳ Envoi…' : 'Envoyer le signalement →'}
            </button>
          </div>
        </div>
      )}


    </div>
  )
}