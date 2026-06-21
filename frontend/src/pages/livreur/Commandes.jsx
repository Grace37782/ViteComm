import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { XCircle, CheckCircle, Loader2, Package, Truck, ClipboardList, Rocket, User, MapPin, Lock, ChevronDown, QrCode, Search } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

/* eslint-disable react-hooks/set-state-in-effect */

const PAGE_SIZE = 10

export default function CommandesLivreur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [available, setAvailable] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [finalizeOpen, setFinalizeOpen] = useState(null)
  const [collectOpen, setCollectOpen] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('actives')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [finalizeScanResult, setFinalizeScanResult] = useState(null)
  const [acceptModal, setAcceptModal] = useState(null)
  const [acceptCode, setAcceptCode] = useState('')
  const scannerRef = useRef(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function loadDataFn() {
    setLoading(true)
    Promise.all([
      api.get('/livreur/deliveries/available'),
      api.get('/livreur/deliveries'),
    ]).then(([a, d]) => { setAvailable(a); setDeliveries(d) })
      .catch(e => showToast(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDataFn() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function accepterCourse(id_commande) {
    if (!acceptCode.trim()) return showToast('Entrez le code de vérification du client')
    try {
      setSubmitting(true)
      await api.post(`/livreur/deliveries/${id_commande}/accept`, {
        code_verification: acceptCode.trim().toUpperCase()
      })
      showToast('Course acceptée !')
      setAcceptModal(null); setAcceptCode('')
      loadDataFn()
    } catch (e) { showToast(e.message) }
    finally { setSubmitting(false) }
  }

  function openCollect(delivery) {
    setCollectOpen(delivery)
    setScanResult(null)
  }

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {})
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupScanner()
  }, [cleanupScanner])

  async function submitCollection() {
    if (!scanResult) return showToast('Scannez le QR code du vendeur')
    if (!collectOpen) return
    setSubmitting(true)
    try {
      await api.post(`/livreur/deliveries/${collectOpen.commande.id_commande}/collect`, {
        scanned_qr_data: scanResult
      })
      showToast('Collecte confirmée !')
      setCollectOpen(null); setScanResult(null)
      cleanupScanner()
      loadDataFn()
    } catch (e) {
      showToast(e.message)
      setCollectOpen(null); setScanResult(null)
      cleanupScanner()
    }
    finally { setSubmitting(false) }
  }

  async function marquerEnRoute(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/depart`)
      showToast('Départ enregistré !')
      loadDataFn()
    } catch (e) { showToast(e.message) }
  }

  function openFinalize(delivery) { setFinalizeOpen(delivery); setFinalizeScanResult(null) }

  async function handleFinalize() {
    if (!finalizeScanResult) return showToast('Scannez le QR du client')
    if (!finalizeOpen) return
    setSubmitting(true)
    try {
      await api.post(`/livreur/deliveries/${finalizeOpen.commande.id_commande}/finalize`, { scanned_qr_data: finalizeScanResult })
      showToast('Livraison finalisée !')
      setFinalizeOpen(null); loadDataFn()
    } catch (e) {
      showToast(e.message)
      setFinalizeOpen(null)
    }
    finally { setSubmitting(false) }
  }

  const activeDeliveries = deliveries.filter(d => d.statut_livraison !== 'Livree' && d.statut_livraison !== 'Echec')
  const historyDeliveries = deliveries.filter(d => d.statut_livraison === 'Livree' || d.statut_livraison === 'Echec')
  const baseList = activeTab === 'actives' ? activeDeliveries : activeTab === 'disponibles' ? available : historyDeliveries

  const showList = search.trim()
    ? baseList.filter(item => {
        const q = search.toLowerCase().trim()
        const cmd = item.commande || item
        const id = String(cmd.id_commande || item.id_commande || '')
        const clientName = ((cmd.client?.utilisateur?.prenom || '') + ' ' + (cmd.client?.utilisateur?.nom || '')).toLowerCase()
        const products = (cmd.detailsCommande || []).map(d => (d.produit?.nom || '').toLowerCase()).join(' ')
        const address = (cmd.client?.adresse_livraison || '').toLowerCase()
        return id.includes(q) || clientName.includes(q) || products.includes(q) || address.includes(q)
      })
    : baseList
  const visibleItems = showList.slice(0, visibleCount)
  const hasMore = visibleCount < showList.length

  function statusStyle(statut) {
    const map = {
      'En attente': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'Validee': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'En cours de collecte': { bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
      'Collectee': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'En cours de livraison': { bg: isDark ? 'rgba(216,90,48,0.15)' : '#FAECE7', color: isDark ? '#E87D55' : '#993C1D' },
      'Inspectee': { bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
      'Livree': { bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
      'Echec': { bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', color: isDark ? '#F87171' : '#B91C1C' },
    }
    return map[statut] || map['En attente']
  }

  function nextAction(d) {
    const s = d.statut_livraison
    if (s === 'En cours de collecte') return { label: <><Package size={14} className="inline align-middle" /> Scanner le QR du vendeur</>, fn: () => openCollect(d) }
    if (s === 'Collectee') return { label: <><Truck size={14} className="inline align-middle" /> Partir en livraison</>, fn: () => marquerEnRoute(d.commande.id_commande) }
    if (s === 'En cours de livraison') return { label: <><CheckCircle size={14} className="inline align-middle" /> Finaliser la livraison</>, fn: () => openFinalize(d) }
    return null
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4 ">
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
        <div className="rounded-2xl h-40 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 ">

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
          <button key={t.id} onClick={() => { setActiveTab(t.id); setVisibleCount(PAGE_SIZE) }}
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

      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher par client, n° commande, produit..."
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
        {activeTab === 'disponibles' && visibleItems.map(c => (
          <div key={c.id_commande} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
               <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{c.id_commande}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {c.date_creation ? new Date(c.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  {' · '}
                  {c.detailsCommande?.[0]?.produit?.vendeur?.localisation_marche || 'Marché'} → {c.client?.adresse_livraison || '—'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <User size={12} className="inline align-middle" /> {c.client?.utilisateur?.prenom} {c.client?.utilisateur?.nom}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{((c.total_marchandises || 0) + (c.frais_livraison || 0)).toLocaleString()} F</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>dont {c.frais_livraison?.toLocaleString() || '0'} F livraison</div>
              </div>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              {c.detailsCommande?.reduce((sum, d) => sum + (d.quantite_commandee || 0), 0) || 0} article(s) · {c.detailsCommande?.map(d => d.produit?.nom).filter(Boolean).join(', ')}
            </div>
            <button onClick={() => { setAcceptModal(c); setAcceptCode('') }}
              className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
              style={{ background: '#D85A30', border: 'none' }}>
              <Rocket size={14} className="inline align-middle" /> Accepter cette course
            </button>
          </div>
        ))}

        {/* ACTIVES - show next action based on statut */}
        {activeTab === 'actives' && visibleItems.map(d => {
          const cmd = d.commande
          const st = statusStyle(d.statut_livraison)
          const action = nextAction(d)
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cmd?.date_creation ? new Date(cmd.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    {' · '}
                    {cmd?.client?.utilisateur?.prenom} {cmd?.client?.utilisateur?.nom}
                  </div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                  {d.statut_livraison}
                </span>
              </div>
              <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}><MapPin size={12} className="inline align-middle" /> {cmd?.client?.adresse_livraison || '—'}</div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Montant total</div>
                  <div className="font-black" style={{ color: 'var(--text-primary)' }}>{((cmd?.total_marchandises || 0) + (cmd?.frais_livraison || 0)).toLocaleString()} F</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Marchandises {cmd?.total_marchandises?.toLocaleString() || 0} F + Livraison {cmd?.frais_livraison?.toLocaleString() || 0} F</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Articles</div>
                  <div className="font-black" style={{ color: 'var(--text-primary)' }}>{cmd?.detailsCommande?.reduce((sum, d) => sum + (d.quantite_commandee || 0), 0) || 0} article(s)</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{cmd?.detailsCommande?.length || 0} produit(s) différent(s)</div>
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
        {activeTab === 'historique' && visibleItems.map(d => {
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
                {cmd?.client?.utilisateur?.prenom} {cmd?.client?.utilisateur?.nom} · {((cmd?.total_marchandises || 0) + (cmd?.frais_livraison || 0)).toLocaleString()} F ({cmd?.detailsCommande?.reduce((sum, d) => sum + (d.quantite_commandee || 0), 0) || 0} articles)
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          )
        })}

        {hasMore && (
          <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronDown size={14} /> Charger plus ({showList.length - visibleCount} restant{showList.length - visibleCount > 1 ? 's' : ''})
          </button>
        )}
      </div>

      {/* ACCEPT MODAL — Driver types client code to accept */}
      {acceptModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setAcceptModal(null); setAcceptCode('') }}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto" style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Accepter la course</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Commande #{acceptModal.id_commande} — Demandez le code de vérification au client
              </p>

              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Lock size={12} className="inline align-middle" /> Code de vérification du client
                </div>
                <div className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                  Le client vous a communiqué un code. Saisissez-le pour confirmer que vous avez bien le bon client.
                </div>
                <input type="text" value={acceptCode} onChange={e => setAcceptCode(e.target.value.toUpperCase())}
                  placeholder="Ex: K7-4X"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none text-center tracking-[0.3em]"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>

              <button onClick={() => accepterCourse(acceptModal.id_commande)}
                disabled={submitting || !acceptCode.trim()}
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                style={{
                  background: (!acceptCode.trim() || submitting) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Vérification…</> : <><Rocket size={14} className="inline align-middle" /> Accepter la course</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZE MODAL — Scan client's finalize QR (real-time camera) or type code */}
      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setFinalizeOpen(null); cleanupScanner() }}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto" style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Finaliser la livraison</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Commande #{finalizeOpen.commande?.id_commande} — Scannez le QR du client</p>

              {/* QR Scanner — real-time camera */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <QrCode size={12} /> Scanner le QR code de finalisation
                </div>
                <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  Demandez au client d'afficher son QR de finalisation. Scannez-le avec l'appareil photo.
                </div>
                {finalizeScanResult ? (
                  <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                    <CheckCircle size={20} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                    <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>QR scanné avec succès !</div>
                  </div>
                ) : (
                  <div id="qr-finalize-reader" className="rounded-xl overflow-hidden" style={{ minHeight: 200 }} />
                )}
                {!finalizeScanResult && (
                  <button onClick={() => {
                    cleanupScanner()
                    const scanner = new Html5Qrcode('qr-finalize-reader')
                    scanner.start(
                      { facingMode: 'environment' },
                      { fps: 10, qrbox: { width: 250, height: 250 } },
                      (decodedText) => {
                        setFinalizeScanResult(decodedText)
                        scanner.stop().then(() => scanner.clear()).catch(() => {})
                      },
                      () => {}
                    ).catch(err => {
                      showToast('Caméra impossible: ' + (err.message || err))
                      cleanupScanner()
                    })
                    scannerRef.current = scanner
                  }}
                    className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                    <QrCode size={14} className="inline align-middle" /> Activer l'appareil photo
                  </button>
                )}
              </div>

              <button onClick={handleFinalize} disabled={submitting || !finalizeScanResult}
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                style={{
                  background: (!finalizeScanResult || submitting) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Envoi…</> : <><CheckCircle size={14} className="inline align-middle" /> Confirmer la livraison</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT MODAL — Camera-only QR scan */}
      {collectOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setCollectOpen(null); setScanResult(null); cleanupScanner() }}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto" style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Scanner le QR du vendeur</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Commande #{collectOpen.commande?.id_commande}</p>

              {/* QR Scanner — camera permission required */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <QrCode size={12} /> Scanner le QR code du vendeur
                </div>
                <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  Demandez au vendeur d'afficher son QR code. Scannez-le avec l'appareil photo pour confirmer la collecte.
                </div>
                {scanResult ? (
                  <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                    <CheckCircle size={20} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                    <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>QR du vendeur scanné avec succès !</div>
                  </div>
                ) : (
                  <div id="qr-collect-reader" className="rounded-xl overflow-hidden" />
                )}
                {!scanResult && (
                  <div id="qr-collect-reader" className="rounded-xl overflow-hidden" style={{ minHeight: 200 }} />
                )}
                {!scanResult && (
                  <button onClick={() => {
                    cleanupScanner()
                    const scanner = new Html5Qrcode('qr-collect-reader')
                    scanner.start(
                      { facingMode: 'environment' },
                      { fps: 10, qrbox: { width: 250, height: 250 } },
                      (decodedText) => {
                        setScanResult(decodedText)
                        scanner.stop().then(() => scanner.clear()).catch(() => {})
                      },
                      () => {}
                    ).catch(err => {
                      showToast('Caméra impossible: ' + (err.message || err))
                      cleanupScanner()
                    })
                    scannerRef.current = scanner
                  }}
                    className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                    <QrCode size={14} className="inline align-middle" /> Activer l'appareil photo
                  </button>
                )}
              </div>

              <button onClick={submitCollection} disabled={submitting || !scanResult}
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                style={{
                  background: (!scanResult || submitting) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Confirmation…</> : <><CheckCircle size={14} className="inline align-middle" /> Confirmer la collecte</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
