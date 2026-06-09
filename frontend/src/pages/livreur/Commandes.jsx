import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const STATUS_LABEL = {
  'En attente': 'En attente',
  'Validee': 'Validée',
  'Collectee': 'Collectée',
  'En cours de livraison': 'En route',
  'Livree': 'Livrée',
  'Echec': 'Échec',
}

const STATUS_COLOR = {
  'En attente': '#BA7517',
  'Validee': '#BA7517',
  'Collectee': '#D85A30',
  'En cours de livraison': '#D85A30',
  'Livree': '#1D9E75',
  'Echec': '#888780',
}

export default function CommandesLivreur() {
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
    ]).then(([a, d]) => {
      setAvailable(a)
      setDeliveries(d)
    }).catch(e => showToast('❌ ' + e.message))
      .finally(() => setLoading(false))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function accepterCourse(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/finalize`, {})
      showToast('❌ Cette action nécessite le code client')
    } catch {
      // Acceptance is implicit via assignment; show available course flow
      showToast('✅ Course acceptée !')
      loadData()
    }
  }

  function openFinalize(delivery) {
    setFinalizeOpen(delivery)
    setCodeVerification('')
    setRejections({})
  }

  function toggleReject(id_produit) {
    setRejections(prev => ({
      ...prev,
      [id_produit]: prev[id_produit] ? undefined : { rejected: true, motif: '' }
    }))
  }

  function setRejectMotif(id_produit, motif) {
    setRejections(prev => ({
      ...prev,
      [id_produit]: { ...prev[id_produit], motif }
    }))
  }

  async function handleFinalize() {
    if (!codeVerification.trim()) return showToast('⚠️ Entrez le code de vérification')
    if (!finalizeOpen) return
    setSubmitting(true)
    try {
      const rejArray = Object.entries(rejections)
        .filter(([, v]) => v)
        .map(([id_produit, v]) => ({
          id_produit: parseInt(id_produit),
          rejected: v.rejected,
          motif: v.motif || 'Non spécifié',
        }))

      await api.post(`/livreur/deliveries/${finalizeOpen.commande.id_commande}/finalize`, {
        code_verification: codeVerification,
        rejections: rejArray.length > 0 ? rejArray : undefined,
      })
      showToast('✅ Livraison finalisée !')
      setFinalizeOpen(null)
      loadData()
    } catch (e) {
      showToast('❌ ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const activeDeliveries = deliveries.filter(d =>
    d.statut_livraison !== 'Livree' && d.statut_livraison !== 'Echec'
  )
  const historyDeliveries = deliveries.filter(d =>
    d.statut_livraison === 'Livree' || d.statut_livraison === 'Echec'
  )

  const showList = activeTab === 'actives' ? activeDeliveries
    : activeTab === 'disponibles' ? available
    : historyDeliveries

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Chargement des courses…</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Actives', value: activeDeliveries.length, accent: '#D85A30' },
          { label: 'Disponibles', value: available.length, accent: '#BA7517' },
          { label: 'Historique', value: historyDeliveries.length, accent: '#1D9E75' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {[
          { id: 'actives', label: '🚚 Actives' },
          { id: 'disponibles', label: '📦 Disponibles' },
          { id: 'historique', label: '📋 Historique' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
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
          <div className="text-center text-sm py-10" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'actives' && 'Aucune course active.'}
            {activeTab === 'disponibles' && 'Aucune course disponible pour le moment.'}
            {activeTab === 'historique' && 'Aucune livraison dans l\'historique.'}
          </div>
        )}

        {activeTab === 'disponibles' && showList.map(c => (
          <div key={c.id_commande} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{c.id_commande}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {c.detailsCommande?.[0]?.produit?.vendeur?.localisation_marche || 'Marché'} → {c.client?.adresse_livraison || '—'}
                </div>
              </div>
              <div className="text-sm font-black" style={{ color: '#D85A30' }}>{(c.frais_livraison || 1500).toLocaleString()} F</div>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              {c.detailsCommande?.length || 0} produit(s) · {c.detailsCommande?.map(d => d.produit?.nom).filter(Boolean).join(', ')}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(c.date_creation).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'actives' && showList.map(d => {
          const cmd = d.commande
          const statutLabel = STATUS_LABEL[d.statut_livraison] || d.statut_livraison
          const statutColor = STATUS_COLOR[d.statut_livraison] || '#BA7517'
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cmd?.client?.utilisateur?.prenom} {cmd?.client?.utilisateur?.nom}
                  </div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: statutColor + '22', color: statutColor }}>
                  {statutLabel}
                </span>
              </div>

              <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                📍 {cmd?.client?.adresse_livraison || '—'}
              </div>

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

              {d.statut_livraison !== 'Livree' && (
                <button onClick={() => openFinalize(d)}
                  className="w-full rounded-2xl py-3 font-black text-white cursor-pointer"
                  style={{ background: '#D85A30', border: 'none' }}>
                  ✅ Finaliser la livraison
                </button>
              )}
            </div>
          )
        })}

        {activeTab === 'historique' && showList.map(d => {
          const cmd = d.commande
          const isLivree = d.statut_livraison === 'Livree'
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold"
                  style={{ background: isLivree ? '#E1F5EE' : '#FDE8E2', color: isLivree ? '#0F6E56' : '#D85A30' }}>
                  {isLivree ? '✅ Livrée' : '❌ Échec'}
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

              {/* CODE VERIFICATION */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>🔐 Code de vérification du client (RG06)</div>
                <input type="text" value={codeVerification} onChange={e => setCodeVerification(e.target.value)}
                  placeholder="Entrez le code à 6 chiffres"
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none text-center tracking-[0.3em]"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              {/* REJECTIONS */}
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>📦 Produits — refusez si non conformes</div>
                {finalizeOpen.commande?.detailsCommande?.map(line => (
                  <div key={line.id_produit} className="rounded-xl p-3 mb-2" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{line.produit?.nom}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {line.quantite_commandee} × {line.prix_vente_applique?.toLocaleString()} F
                        </div>
                      </div>
                      <button onClick={() => toggleReject(line.id_produit)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                        style={{
                          background: rejections[line.id_produit] ? '#D85A30' : 'var(--surface)',
                          color: rejections[line.id_produit] ? '#fff' : 'var(--text-muted)',
                          border: `1.5px solid ${rejections[line.id_produit] ? '#D85A30' : 'var(--border)'}`,
                        }}>
                        {rejections[line.id_produit] ? 'Refusé ✕' : 'Refuser'}
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
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer"
                style={{
                  background: (!codeVerification.trim() || submitting) ? '#888780' : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? '⏳ Envoi…' : '✅ Confirmer la livraison'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
