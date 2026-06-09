import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { XCircle, CheckCircle, AlertTriangle, Loader2, Package, Truck, ClipboardList, Rocket, User, MapPin, Lock, X } from 'lucide-react'

export default function CommandesLivreur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [available, setAvailable] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [finalizeOpen, setFinalizeOpen] = useState(null)
  const [codeVerification, setCodeVerification] = useState('')
  const [rejections, setRejections] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('actives')

  useEffect(() => { loadData() }, [])

  function loadData() {
    setLoading(true)
    Promise.all([
      api.get('/livreur/deliveries/available'),
      api.get('/livreur/deliveries'),
    ]).then(([a, d]) => { setAvailable(a); setDeliveries(d) })
      .catch(e => showToast(e.message))
      .finally(() => setLoading(false))
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function accepterCourse(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/accept`)
      showToast('Course acceptée !')
      loadData()
    } catch (e) { showToast(e.message) }
  }

  async function marquerCollectee(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/collect`, { code_verification: 'VendeurOK' })
      showToast('Collecte confirmée !')
      loadData()
    } catch (e) { showToast(e.message) }
  }

  async function marquerEnRoute(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/depart`)
      showToast('Départ enregistré !')
      loadData()
    } catch (e) { showToast(e.message) }
  }

  function openFinalize(delivery) { setFinalizeOpen(delivery); setCodeVerification(''); setRejections({}) }

  function toggleReject(id_produit) {
    setRejections(prev => ({ ...prev, [id_produit]: prev[id_produit] ? undefined : { rejected: true, motif: '' } }))
  }

  function setRejectMotif(id_produit, motif) {
    setRejections(prev => ({ ...prev, [id_produit]: { ...prev[id_produit], motif } }))
  }

  async function handleFinalize() {
    if (!codeVerification.trim()) return showToast('Entrez le code de vérification')
    if (!finalizeOpen) return
    setSubmitting(true)
    try {
      const rejArray = Object.entries(rejections).filter(([, v]) => v).map(([id_produit, v]) => ({
        id_produit: parseInt(id_produit), rejected: v.rejected, motif: v.motif || 'Non spécifié',
      }))
      await api.post(`/livreur/deliveries/${finalizeOpen.commande.id_commande}/finalize`, {
        code_verification: codeVerification, rejections: rejArray.length > 0 ? rejArray : undefined,
      })
      showToast('Livraison finalisée !')
      setFinalizeOpen(null); loadData()
    } catch (e) { showToast(e.message) }
    finally { setSubmitting(false) }
  }

  const activeDeliveries = deliveries.filter(d => d.statut_livraison !== 'Livree' && d.statut_livraison !== 'Echec')
  const historyDeliveries = deliveries.filter(d => d.statut_livraison === 'Livree' || d.statut_livraison === 'Echec')
  const showList = activeTab === 'actives' ? activeDeliveries : activeTab === 'disponibles' ? available : historyDeliveries

  function statusStyle(statut) {
    const map = {
      'En attente': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'Validee': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'En cours de collecte': { bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
      'Collectee': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'En cours de livraison': { bg: isDark ? 'rgba(216,90,48,0.15)' : '#FAECE7', color: isDark ? '#E87D55' : '#993C1D' },
      'Livree': { bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
      'Echec': { bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', color: isDark ? '#F87171' : '#B91C1C' },
    }
    return map[statut] || map['En attente']
  }

  function nextAction(d) {
    const s = d.statut_livraison
    if (s === 'En cours de collecte') return { label: <><Package size={14} className="inline align-middle" /> Confirmer la collecte</>, fn: () => marquerCollectee(d.commande.id_commande) }
    if (s === 'Collectee') return { label: <><Truck size={14} className="inline align-middle" /> Partir en livraison</>, fn: () => marquerEnRoute(d.commande.id_commande) }
    if (s === 'En cours de livraison') return { label: <><CheckCircle size={14} className="inline align-middle" /> Finaliser la livraison</>, fn: () => openFinalize(d) }
    return null
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
        <div className="rounded-2xl h-40 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl" style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Actives', value: activeDeliveries.length, icon: <Truck size={20} />,
            bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3', color: isDark ? '#E87D55' : '#993C1D' },
          { label: 'Disponibles', value: available.length, icon: <Package size={20} />,
            bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: isDark ? '#BA7517' : '#FAC775', color: isDark ? '#F3A83B' : '#854F0B' },
          { label: 'Historique', value: historyDeliveries.length, icon: <ClipboardList size={20} />,
            bg: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB', color: isDark ? '#34D399' : '#0F6E56' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div className="mb-1">{s.icon}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {[
          { id: 'actives', label: <><Truck size={12} className="inline align-middle" /> Actives</> },
          { id: 'disponibles', label: <><Package size={12} className="inline align-middle" /> Disponibles</> },
          { id: 'historique', label: <><ClipboardList size={12} className="inline align-middle" /> Historique</> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
            style={{
              background: activeTab === t.id ? '#D85A30' : 'var(--surface)',
              color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${activeTab === t.id ? '#D85A30' : 'var(--border)'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-3">
        {showList.length === 0 && (
          <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
            {activeTab === 'actives' && 'Aucune course active.'}
            {activeTab === 'disponibles' && 'Aucune course disponible.'}
            {activeTab === 'historique' && 'Aucune livraison dans l\'historique.'}
          </div>
        )}

        {/* DISPONIBLES - can accept */}
        {activeTab === 'disponibles' && showList.map(c => (
          <div key={c.id_commande} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{c.id_commande}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {c.detailsCommande?.[0]?.produit?.vendeur?.localisation_marche || 'Marché'} → {c.client?.adresse_livraison || '—'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <User size={12} className="inline align-middle" /> {c.client?.utilisateur?.prenom} {c.client?.utilisateur?.nom}
                </div>
              </div>
              <div className="text-sm font-black" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{(c.frais_livraison || 1500).toLocaleString()} F</div>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              {c.detailsCommande?.length || 0} produit(s) · {c.detailsCommande?.map(d => d.produit?.nom).filter(Boolean).join(', ')}
            </div>
            <button onClick={() => accepterCourse(c.id_commande)}
              className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
              style={{ background: '#D85A30', border: 'none' }}>
              <Rocket size={14} className="inline align-middle" /> Accepter cette course
            </button>
          </div>
        ))}

        {/* ACTIVES - show next action based on statut */}
        {activeTab === 'actives' && showList.map(d => {
          const cmd = d.commande
          const st = statusStyle(d.statut_livraison)
          const action = nextAction(d)
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cmd?.client?.utilisateur?.prenom} {cmd?.client?.utilisateur?.nom}</div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                  {d.statut_livraison}
                </span>
              </div>
              <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}><MapPin size={12} className="inline align-middle" /> {cmd?.client?.adresse_livraison || '—'}</div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Montant</div>
                  <div>{(cmd?.frais_livraison || 1500).toLocaleString()} F</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Produits</div>
                  <div>{cmd?.detailsCommande?.length || 0} article(s)</div>
                </div>
              </div>
              {action && (
                <button onClick={action.fn}
                  className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
                  style={{ background: '#D85A30', border: 'none' }}>
                  {action.label}
                </button>
              )}
            </div>
          )
        })}

        {/* HISTORIQUE */}
        {activeTab === 'historique' && showList.map(d => {
          const cmd = d.commande
          const isLivree = d.statut_livraison === 'Livree'
          const st = statusStyle(d.statut_livraison)
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                  {isLivree ? <><CheckCircle size={12} className="inline align-middle" /> Livrée</> : <><XCircle size={12} className="inline align-middle" /> Échec</>}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {cmd?.client?.utilisateur?.prenom} {cmd?.client?.utilisateur?.nom} · {(cmd?.frais_livraison || 1500).toLocaleString()} F
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR') : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* FINALIZE MODAL */}
      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setFinalizeOpen(null)}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto" style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Finaliser la livraison</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Commande #{finalizeOpen.commande?.id_commande}</p>

              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}><Lock size={12} className="inline align-middle" /> Code de vérification du client (RG06)</div>
                <input type="text" value={codeVerification} onChange={e => setCodeVerification(e.target.value)}
                  placeholder="Code à 6 chiffres"
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none text-center tracking-[0.3em]"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}><Package size={12} className="inline align-middle" /> Produits — refusez si non conformes</div>
                {finalizeOpen.commande?.detailsCommande?.map(line => (
                  <div key={line.id_produit} className="rounded-xl p-3 mb-2" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{line.produit?.nom}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{line.quantite_commandee} × {line.prix_vente_applique?.toLocaleString()} F</div>
                      </div>
                      <button onClick={() => toggleReject(line.id_produit)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-all active:scale-95"
                        style={{
                          background: rejections[line.id_produit] ? '#D85A30' : 'var(--surface)',
                          color: rejections[line.id_produit] ? '#fff' : 'var(--text-muted)',
                          border: `1.5px solid ${rejections[line.id_produit] ? '#D85A30' : 'var(--border)'}`,
                        }}>
                        {rejections[line.id_produit] ? <>Refusé <X size={12} className="inline" /></> : 'Refuser'}
                      </button>
                    </div>
                    {rejections[line.id_produit] && (
                      <input type="text" value={rejections[line.id_produit].motif}
                        onChange={e => setRejectMotif(line.id_produit, e.target.value)}
                        placeholder="Motif du rejet…"
                        className="mt-2 w-full px-3 py-2 rounded-lg text-xs outline-none"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleFinalize} disabled={submitting || !codeVerification.trim()}
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                style={{
                  background: (!codeVerification.trim() || submitting) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Envoi…</> : <><CheckCircle size={14} className="inline align-middle" /> Confirmer la livraison</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
