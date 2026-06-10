import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Star, CheckCircle, Search, Package, Flag, Motorbike, Store, Loader2, ChevronDown } from 'lucide-react'

function Etoiles({ note, onChange, isDark }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="cursor-pointer transition-all active:scale-90"
          style={{ background: 'none', border: 'none', lineHeight: 1 }}>
          <Star size={24} fill={n <= note ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

const PAGE_SIZE = 10

export default function Evaluation() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [evalOpen, setEvalOpen] = useState(null)
  const [typeEval, setTypeEval] = useState('livreur')
  const [noteL, setNoteL] = useState(0)
  const [commentL, setCommentL] = useState('')
  const [notesV, setNotesV] = useState({})
  const [commentsV, setCommentsV] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [signalement, setSignalement] = useState(null)
  const [motifSig, setMotifSig] = useState('')
  const [toast, setToast] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    api.get('/client/orders')
      .then(data => {
        const delivered = (data || []).filter(o => o.statut === 'Livree' || o.statut === 'Inspectee')
        setOrders(delivered)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const commande = orders.find((c) => c.id_commande === evalOpen)

  // Extract livreur info from order
  function getLivreur(o) {
    if (!o?.livraison?.livreur) return null
    const l = o.livraison.livreur
    return { id: l.id_user, nom: `${l.utilisateur?.prenom} ${l.utilisateur?.nom}` }
  }

  // Extract unique vendors from order details
  function getVendeurs(o) {
    if (!o?.detailsCommande) return []
    const seen = new Set()
    return o.detailsCommande
      .map(d => d.produit?.vendeur)
      .filter(v => {
        if (!v || seen.has(v.id_user)) return false
        seen.add(v.id_user)
        return true
      })
      .map(v => ({ id: v.id_user, nom: v.nom_etablissement }))
  }

  async function soumettreFeedback() {
    if (typeEval === 'livreur' && noteL === 0) return
    if (typeEval === 'vendeur') {
      const hasAnyRating = getVendeurs(commande).some(v => notesV[v.id])
      if (!hasAnyRating) return
    }
    if (!commande?.livraison) return
    setSubmitting(true)
    try {
      if (typeEval === 'livreur') {
        await api.post('/client/feedbacks', {
          id_livraison: commande.livraison.id_livraison,
          type_feedback: 'LIVREUR',
          note: noteL,
          commentaire: commentL || undefined,
        })
      } else {
        const vendeurs = getVendeurs(commande)
        let submitted = 0
        for (const v of vendeurs) {
          const note = notesV[v.id]
          if (!note) continue
          await api.post('/client/feedbacks', {
            id_livraison: commande.livraison.id_livraison,
            type_feedback: 'VENDEUR',
            note,
            commentaire: commentsV[v.id] || undefined,
            id_user_vendeur: v.id,
          })
          submitted++
        }
        if (submitted === 0) return
      }
      showToast('Évaluation enregistrée !')
      setEvalOpen(null)
      setNoteL(0); setCommentL(''); setNotesV({}); setCommentsV({})
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setSubmitting(false)
    }
  }

  async function soumettreSignalement() {
    if (!motifSig.trim() || !signalement) return
    setSubmitting(true)
    try {
      await api.post('/client/signalements', {
        motif: motifSig,
        type_cible_cible: signalement.type,
        id_cible: signalement.id,
      })
      showToast('Signalement envoyé.')
      setSignalement(null)
      setMotifSig('')
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUT_STYLE = {
    'Livree': { bg: isDark ? 'rgba(45,196,145,0.15)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', Icon: CheckCircle, label: 'Livrée' },
    'Inspectee': { bg: isDark ? 'rgba(243,168,59,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B', Icon: Search, label: 'Inspectée' },
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
          style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/client/mes-commandes')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div>
            <div className="text-white font-black text-base">Évaluations</div>
            <div className="text-white/70 text-xs">{orders.length} commande{orders.length > 1 ? 's' : ''} livrée{orders.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3"><Package size={40} /></div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Aucune commande livrée</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Évaluez vos commandes une fois livrées.</p>
          </div>
        )}

        {visibleItems.map((c) => {
          const st = STATUT_STYLE[c.statut] || STATUT_STYLE['Livree']
          const livreur = getLivreur(c)
          const vendeurs = getVendeurs(c)
          const nbArticles = c.detailsCommande?.length || 0
          const total = c.total_marchandises || 0

          return (
            <div key={c.id_commande} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>

              <div className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                    Commande #{c.id_commande}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(c.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    · {nbArticles} article{nbArticles > 1 ? 's' : ''}
                    {livreur && ` · ${livreur.nom}`}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  <st.Icon size={14} /> {st.label}
                </span>
              </div>

              <div className="px-4 pb-3 flex items-center justify-between gap-2"
                style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <span className="font-black text-base" style={{ color: 'var(--accent)' }}>
                    {total.toLocaleString()} F
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Payé</span>
                </div>
                <div className="flex gap-2">
                  {livreur && (
                    <button
                      onClick={() => { setSignalement({ type: 'livreur', id: livreur.id, nom: livreur.nom }); setMotifSig('') }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
                      style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FAECE7', color: isDark ? '#E87D55' : '#D85A30', border: 'none' }}>
                       <Flag size={14} /> Signaler
                    </button>
                  )}
                  <button onClick={() => { setEvalOpen(c.id_commande); setTypeEval('livreur') }}
                    className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>
                    <Star size={14} /> Évaluer
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {hasMore && (
          <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronDown size={14} /> Charger plus ({orders.length - visibleCount} restant{orders.length - visibleCount > 1 ? 's' : ''})
          </button>
        )}
      </div>

      {/* MODAL ÉVALUATION */}
      {evalOpen && commande && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setEvalOpen(null)}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto"
            style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Laisser un avis</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Commande #{commande.id_commande}</p>

              <div className="flex gap-2 mb-5">
                {['livreur', 'vendeur'].map((t) => (
                  <button key={t} onClick={() => setTypeEval(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all capitalize"
                    style={{
                      background: typeEval === t ? 'var(--accent)' : 'var(--surface-alt)',
                      color: typeEval === t ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${typeEval === t ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    {t === 'livreur' ? <><Motorbike size={14} /> Livreur</> : <><Store size={14} /> Vendeur(s)</>}
                  </button>
                ))}
              </div>

              {typeEval === 'livreur' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                    <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {getLivreur(commande)?.nom || 'Livreur'}
                    </div>
                    <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Note sur la livraison</div>
                    <Etoiles note={noteL} onChange={setNoteL} isDark={isDark} />
                  </div>
                  <textarea placeholder="Commentaire (optionnel)…"
                    value={commentL} onChange={(e) => setCommentL(e.target.value)}
                    rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                </div>
              )}

              {typeEval === 'vendeur' && (
                <div className="flex flex-col gap-3">
                  {getVendeurs(commande).length === 0 && (
                    <div className="text-center py-4 rounded-2xl" style={{ background: 'var(--surface-alt)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun vendeur trouvé pour cette commande.</p>
                    </div>
                  )}
                  {getVendeurs(commande).map((v) => (
                    <div key={v.id} className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                      <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{v.nom}</div>
                      <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Note sur les produits</div>
                      <Etoiles note={notesV[v.id] || 0} onChange={(n) => setNotesV((p) => ({ ...p, [v.id]: n }))} isDark={isDark} />
                      <textarea placeholder="Commentaire (optionnel)…"
                        value={commentsV[v.id] || ''}
                        onChange={(e) => setCommentsV((p) => ({ ...p, [v.id]: e.target.value }))}
                        rows={2} className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none mt-3"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              )}

              {(() => {
                const disabled = submitting ||
                  (typeEval === 'livreur' && noteL === 0) ||
                  (typeEval === 'vendeur' && getVendeurs(commande).every(v => !notesV[v.id]))
  const visibleItems = orders.slice(0, visibleCount)
  const hasMore = visibleCount < orders.length

  return (
                  <button onClick={soumettreFeedback}
                    disabled={disabled}
                    className="w-full mt-5 py-4 rounded-2xl text-white font-black text-base cursor-pointer"
                    style={{
                      background: disabled ? '#D3D1C7' : 'var(--accent)',
                      border: 'none', opacity: submitting ? 0.75 : 1,
                    }}>
                    {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Envoi…</span> : 'Soumettre mon avis →'}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIGNALEMENT */}
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
               <Flag size={16} /> Signaler {signalement.nom}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Ce signalement sera traité par l'administrateur ViteComm.
            </p>
            <textarea placeholder="Décrivez le problème (comportement abusif, fraude…)"
              value={motifSig} onChange={(e) => setMotifSig(e.target.value)}
              rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
            <button onClick={soumettreSignalement}
              disabled={!motifSig.trim() || submitting}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{
                background: motifSig.trim() ? '#D85A30' : '#D3D1C7',
                border: 'none', opacity: submitting ? 0.75 : 1,
              }}>
              {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Envoi…</span> : 'Envoyer le signalement →'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
