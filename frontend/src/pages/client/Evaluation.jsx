import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { Star, CheckCircle, Search, Package, Flag, Motorbike, Store, Loader2, ChevronDown, XCircle } from 'lucide-react'

function Etoiles({ note, onChange }) {
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
  const { t } = useLang()
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
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')

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

  function getLivreur(o) {
    if (!o?.livraison?.livreur) return null
    const l = o.livraison.livreur
    return { id: l.id_user, nom: `${l.utilisateur?.prenom} ${l.utilisateur?.nom}` }
  }

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
      showToast(t('toast.evaluationSaved'))
      setEvalOpen(null)
      setNoteL(0); setCommentL(''); setNotesV({}); setCommentsV({})
    } catch (err) {
      showToast(err.message || t('toast.sendError'))
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
      showToast(t('toast.reportSent'))
      setSignalement(null)
      setMotifSig('')
    } catch (err) {
      showToast(err.message || t('toast.sendError'))
    } finally {
      setSubmitting(false)
    }
  }

  const STATUT_STYLE = {
    'Livree': { bg: isDark ? 'rgba(45,196,145,0.15)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', Icon: CheckCircle, labelKey: 'evaluation.filter.delivered' },
    'Inspectee': { bg: isDark ? 'rgba(243,168,59,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B', Icon: Search, labelKey: 'evaluation.filter.inspected' },
  }

  const filtres = {
    tous: orders,
    livree: orders.filter(o => o.statut === 'Livree'),
    inspectee: orders.filter(o => o.statut === 'Inspectee'),
  }

  const baseList = filtres[filtre] || orders

  const liste = search.trim()
    ? baseList.filter(o => {
        const q = search.toLowerCase().trim()
        const id = String(o.id_commande)
        const livreur = getLivreur(o)?.nom?.toLowerCase() || ''
        const produits = (o.detailsCommande || []).map(d => (d.produit?.nom || '').toLowerCase()).join(' ')
        return id.includes(q) || livreur.includes(q) || produits.includes(q)
      })
    : baseList

  const visibleItems = liste.slice(0, visibleCount)
  const hasMore = visibleCount < liste.length

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
            <div className="text-white font-black text-base">{t('evaluation.title')}</div>
            <div className="text-white/70 text-xs">{t('evaluation.count', { count: orders.length })}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3"><Package size={40} /></div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('evaluation.empty')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('evaluation.emptyDesc')}</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            {/* TABS */}
            <div className="flex gap-2">
              {[
                { id: 'tous', label: t('evaluation.filter.all') },
                { id: 'livree', label: t('evaluation.filter.delivered') },
                { id: 'inspectee', label: t('evaluation.filter.inspected') },
              ].map(ft => (
                <button key={ft.id} onClick={() => { setFiltre(ft.id); setVisibleCount(PAGE_SIZE) }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                  style={{
                    background: filtre === ft.id ? '#1D9E75' : 'var(--surface)',
                    color: filtre === ft.id ? '#fff' : 'var(--text-secondary)',
                    border: `1.5px solid ${filtre === ft.id ? '#1D9E75' : 'var(--border)'}`,
                  }}>
                  {ft.label}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={t('evaluation.search')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="cursor-pointer p-1 rounded-full transition-all"
                    style={{ background: 'var(--surface-alt)', border: 'none' }}>
                    <XCircle size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>
            </div>

            {liste.length === 0 && (
              <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
                {search.trim() ? `${t('common.noResults')} "${search}"` : t('order.noResultsInCategory')}
                {search.trim() && (
                  <button onClick={() => setSearch('')} className="block mx-auto mt-2 text-xs font-bold cursor-pointer" style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                    {t('common.clearSearch')}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {visibleItems.map((c) => {
          const st = STATUT_STYLE[c.statut] || STATUT_STYLE['Livree']
          const livreur = getLivreur(c)
          const nbArticles = c.detailsCommande?.length || 0
          const total = c.total_marchandises || 0

          return (
            <div key={c.id_commande} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>

              <div className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t('order.title')} #{c.id_commande}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(c.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    · {nbArticles} {t('common.items')}
                    {livreur && ` · ${livreur.nom}`}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  <st.Icon size={14} /> {t(st.labelKey)}
                </span>
              </div>

              <div className="px-4 pb-3 flex items-center justify-between gap-2"
                style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <span className="font-black text-base" style={{ color: 'var(--accent)' }}>
                    {total.toLocaleString()} F
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{t('invoice.paid')}</span>
                </div>
                <div className="flex gap-2">
                  {livreur && (
                    <button
                      onClick={() => { setSignalement({ type: 'livreur', id: livreur.id, nom: livreur.nom }); setMotifSig('') }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
                      style={{ background: isDark ? 'rgba(232,125,85,0.12)' : '#FAECE7', color: isDark ? '#E87D55' : '#D85A30', border: 'none' }}>
                       <Flag size={14} /> {t('evaluation.report')}
                    </button>
                  )}
                  <button onClick={() => { setEvalOpen(c.id_commande); setTypeEval('livreur') }}
                    className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}>
                    <Star size={14} /> {t('evaluation.rate')}
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
            <ChevronDown size={14} /> {t('common.loadMore')} ({liste.length - visibleCount} {t('common.remaining')}{liste.length - visibleCount > 1 ? 's' : ''})
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
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{t('evaluation.modal.title')}</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t('order.title')} #{commande.id_commande}</p>

              <div className="flex gap-2 mb-5">
                {['livreur', 'vendeur'].map((te) => (
                  <button key={te} onClick={() => setTypeEval(te)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all capitalize"
                    style={{
                      background: typeEval === te ? 'var(--accent)' : 'var(--surface-alt)',
                      color: typeEval === te ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${typeEval === te ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    {te === 'livreur' ? <><Motorbike size={14} /> {t('evaluation.driverTab')}</> : <><Store size={14} /> {t('evaluation.vendorTab')}</>}
                  </button>
                ))}
              </div>

              {typeEval === 'livreur' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                    <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                      {getLivreur(commande)?.nom || t('evaluation.driverTab')}
                    </div>
                    <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('evaluation.rating')} — {t('evaluation.driverTab')}</div>
                    <Etoiles note={noteL} onChange={setNoteL} isDark={isDark} />
                  </div>
                  <textarea placeholder={t('evaluation.comment')}
                    value={commentL} onChange={(e) => setCommentL(e.target.value)}
                    rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                </div>
              )}

              {typeEval === 'vendeur' && (
                <div className="flex flex-col gap-3">
                  {getVendeurs(commande).length === 0 && (
                    <div className="text-center py-4 rounded-2xl" style={{ background: 'var(--surface-alt)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('evaluation.noVendor')}</p>
                    </div>
                  )}
                  {getVendeurs(commande).map((v) => (
                    <div key={v.id} className="rounded-2xl p-4" style={{ background: 'var(--surface-alt)' }}>
                      <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{v.nom}</div>
                      <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('evaluation.rating')} — {t('evaluation.vendorTab')}</div>
                      <Etoiles note={notesV[v.id] || 0} onChange={(n) => setNotesV((p) => ({ ...p, [v.id]: n }))} isDark={isDark} />
                      <textarea placeholder={t('evaluation.comment')}
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

                return (
                  <button onClick={soumettreFeedback}
                    disabled={disabled}
                    className="w-full mt-5 py-4 rounded-2xl text-white font-black text-base cursor-pointer"
                    style={{
                      background: disabled ? '#D3D1C7' : 'var(--accent)',
                      border: 'none', opacity: submitting ? 0.75 : 1,
                    }}>
                    {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('evaluation.submitting')}</span> : t('evaluation.submit')}
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
               <Flag size={16} /> {t('evaluation.report')} {signalement.nom}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {t('evaluation.reportDesc')}
            </p>
            <textarea placeholder={t('evaluation.reportPlaceholder')}
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
              {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('evaluation.submitting')}</span> : t('evaluation.reportSubmit')}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
