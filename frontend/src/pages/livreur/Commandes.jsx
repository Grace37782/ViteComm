import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { XCircle, CheckCircle, Loader2, Package, Truck, ClipboardList, Rocket, User, MapPin, Lock, ChevronDown, QrCode, Search, AlertTriangle, Hourglass, Map } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* eslint-disable react-hooks/set-state-in-effect */

const PAGE_SIZE = 10

function createVendorIcon(collected) {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg text-white ${
      collected ? 'bg-emerald-500' : 'bg-amber-500'
    }"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg></div>`,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

function createClientIcon() {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

export default function CommandesLivreur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [available, setAvailable] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [finalizeOpen, setFinalizeOpen] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('actives')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [finalizeScanResult, setFinalizeScanResult] = useState(null)
  const [acceptModal, setAcceptModal] = useState(null)
  const [acceptCode, setAcceptCode] = useState('')
  const [finalizeError, setFinalizeError] = useState(null)
  const [finalizeVerified, setFinalizeVerified] = useState(false)
  const scannerRef = useRef(null)

  // Multi-vendor collect state
  const [collectOpen, setCollectOpen] = useState(null)
  const [vendorStatus, setVendorStatus] = useState([])
  const [activeVendorIndex, setActiveVendorIndex] = useState(0)
  const [, setCollectPhase] = useState(null) // 'scanning' | 'verifying' | 'confirmed' | null
  const [collectScanData, setCollectScanData] = useState(null)
  const [collectError, setCollectError] = useState(null)
  const [collectVerified, setCollectVerified] = useState(false)
  const [allCollected, setAllCollected] = useState(false)

  // Map state
  const [showMap, setShowMap] = useState(false)

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

  useEffect(() => { loadDataFn(); const interval = setInterval(loadDataFn, 10000); return () => clearInterval(interval) }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Multi-vendor collect flow ───

  async function openCollect(delivery) {
    setCollectOpen(delivery)
    setCollectError(null)
    setCollectVerified(false)
    setCollectScanData(null)
    setCollectPhase(null)
    setAllCollected(false)
    setActiveVendorIndex(0)
    setVendorStatus([])
    try {
      const data = await api.get(`/livreur/deliveries/${delivery.commande.id_commande}/vendor-status`)
      setVendorStatus(data.vendors || [])
      const nextIdx = (data.vendors || []).findIndex(v => v.statut_collecte !== 'collectee')
      setActiveVendorIndex(nextIdx >= 0 ? nextIdx : 0)
      if (nextIdx < 0) {
        setAllCollected(true)
      }
    } catch (e) {
      showToast(e.message)
      setCollectOpen(null)
    }
  }

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {})
      } catch { /* ignore */ }
      scannerRef.current = null
    }
  }, [])

  const startCamera = useCallback(async (elementId, onSuccess) => {
    cleanupScanner()
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onSuccess(decodedText)
          scanner.stop().then(() => scanner.clear()).catch(() => {})
        },
        () => {}
      )
    } catch (err) {
      showToast('Caméra impossible: ' + (err.message || err))
      cleanupScanner()
    }
  }, [cleanupScanner])

  async function verifyVendorScan(scannedData) {
    if (!collectOpen || !vendorStatus[activeVendorIndex]) return
    const vendor = vendorStatus[activeVendorIndex]
    setSubmitting(true)
    setCollectError(null)
    try {
      await api.post(`/livreur/deliveries/${collectOpen.commande.id_commande}/verify-collect-vendor/${vendor.id_collecte}`, {
        scanned_qr_data: scannedData
      })
      setCollectVerified(true)
      setCollectScanData(scannedData)
      setCollectPhase('confirmed')
      showToast('QR code validé !')
    } catch (e) {
      setCollectError(e.message)
      setCollectScanData(null)
      setCollectVerified(false)
      setCollectPhase('scanning')
      cleanupScanner()
    } finally { setSubmitting(false) }
  }

  async function submitVendorCollect() {
    if (!collectOpen || !collectScanData || !vendorStatus[activeVendorIndex]) return
    const vendor = vendorStatus[activeVendorIndex]
    setSubmitting(true)
    try {
      await api.post(`/livreur/deliveries/${collectOpen.commande.id_commande}/collect-vendor/${vendor.id_collecte}`, {
        scanned_qr_data: collectScanData
      })
      showToast(`Collecte ${vendor.nom_etablissement || vendor.nom} confirmée !`)
      cleanupScanner()
      setCollectScanData(null)
      setCollectVerified(false)
      setCollectPhase(null)
      setCollectError(null)

      const data = await api.get(`/livreur/deliveries/${collectOpen.commande.id_commande}/vendor-status`)
      setVendorStatus(data.vendors || [])
      const nextIdx = (data.vendors || []).findIndex(v => v.statut_collecte !== 'collectee')
      if (nextIdx >= 0) {
        setActiveVendorIndex(nextIdx)
      } else {
        setAllCollected(true)
      }
    } catch (e) {
      setCollectError(e.message)
    } finally { setSubmitting(false) }
  }

  // ─── Finalize flow (kept as-is) ───

  async function verifyFinalizeScan(scannedData) {
    if (!finalizeOpen) return
    setSubmitting(true)
    setFinalizeError(null)
    try {
      await api.post(`/livreur/deliveries/${finalizeOpen.commande.id_commande}/verify-finalize`, { scanned_qr_data: scannedData })
      setFinalizeVerified(true)
      setFinalizeScanResult(scannedData)
      showToast('QR code de finalisation validé !')
    } catch (e) {
      setFinalizeError(e.message)
      setFinalizeScanResult(null)
    }
    finally { setSubmitting(false) }
  }

  async function submitFinalize() {
    if (!finalizeOpen || !finalizeScanResult) return
    setSubmitting(true)
    try {
      await api.post(`/livreur/deliveries/${finalizeOpen.commande.id_commande}/finalize`, { scanned_qr_data: finalizeScanResult })
      showToast('Livraison finalisée !')
      setFinalizeOpen(null); setFinalizeScanResult(null); setFinalizeVerified(false)
      cleanupScanner()
      loadDataFn()
    } catch (e) {
      setFinalizeError(e.message)
    }
    finally { setSubmitting(false) }
  }

  useEffect(() => {
    return () => cleanupScanner()
  }, [cleanupScanner])

  async function marquerEnRoute(id_commande) {
    try {
      await api.post(`/livreur/deliveries/${id_commande}/depart`)
      showToast('Départ enregistré !')
      loadDataFn()
    } catch (e) { showToast(e.message) }
  }

  function openFinalize(delivery) { setFinalizeOpen(delivery); setFinalizeScanResult(null); setFinalizeError(null); setFinalizeVerified(false) }

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
        const vendorName = (cmd.detailsCommande || []).map(d => (d.produit?.vendeur?.nom_etablissement || '').toLowerCase()).join(' ')
        const marketName = (cmd.detailsCommande || []).map(d => (d.produit?.vendeur?.localisation_marche || '').toLowerCase()).join(' ')
        return id.includes(q) || clientName.includes(q) || products.includes(q) || address.includes(q) || vendorName.includes(q) || marketName.includes(q)
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
    if (s === 'En cours de collecte') {
      const collectes = d.commande?.collecteVendeurs || []
      const validated = collectes.filter(cv => cv.statut_collecte !== 'en_attente').length
      const total = collectes.length || 1
      if (!d.commande?.validee_par_vendeur) {
        return {
          label: <><Hourglass size={14} className="inline align-middle animate-pulse" /> En attente de {validated}/{total} vendeur{total > 1 ? 's' : ''}</>,
          disabled: true,
          fn: () => {}
        }
      }
      return { label: <><Package size={14} className="inline align-middle" /> Scanner le QR du vendeur</>, fn: () => openCollect(d) }
    }
    if (s === 'Collectee') return { label: <><Truck size={14} className="inline align-middle" /> Partir en livraison</>, fn: () => marquerEnRoute(d.commande.id_commande) }
    if (s === 'En cours de livraison') return { label: <><CheckCircle size={14} className="inline align-middle" /> Finaliser la livraison</>, fn: () => openFinalize(d) }
    return null
  }

  function getVendorCounts(d) {
    const collectes = d.commande?.collecteVendeurs || []
    if (collectes.length > 0) {
      return {
        total: collectes.length,
        collected: collectes.filter(cv => cv.statut_collecte === 'collectee').length,
        validated: collectes.filter(cv => cv.statut_collecte !== 'en_attente').length,
      }
    }
    const vendors = d.commande?.detailsCommande || []
    const uniqueVendors = new Set(vendors.map(v => v.produit?.vendeur?.id_user_vendeur || v.produit?.vendeur?.nom_etablissement).filter(Boolean))
    return { total: uniqueVendors.size || 1, collected: 0, validated: 0 }
  }

  // Collect all active delivery markers for the map
  function getActiveDeliveryMarkers() {
    const markers = []
    activeDeliveries.forEach(d => {
      const cmd = d.commande
      const clientLat = cmd?.client?.latitude
      const clientLng = cmd?.client?.longitude
      if (clientLat && clientLng) {
        markers.push({ lat: parseFloat(clientLat), lng: parseFloat(clientLng), type: 'client', label: `#${cmd.id_commande} — Client` })
      }
      ;(cmd?.detailsCommande || []).forEach(detail => {
        const v = detail.produit?.vendeur
        if (v?.latitude && v?.longitude) {
          markers.push({ lat: parseFloat(v.latitude), lng: parseFloat(v.longitude), type: 'vendor', label: v.nom_etablissement || 'Vendeur' })
        }
      })
    })
    return markers
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

      {/* MAP */}
      {activeTab === 'actives' && (
        <div className="rounded-2xl overflow-hidden transition-all" style={{ border: '1.5px solid var(--border)' }}>
          <button onClick={() => setShowMap(!showMap)}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer transition-all active:scale-99"
            style={{ background: 'var(--surface)', border: 'none' }}>
            <div className="flex items-center gap-2">
              <Map size={16} style={{ color: '#D85A30' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {showMap ? 'Masquer la carte' : 'Afficher la carte'}
              </span>
            </div>
            <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showMap ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {showMap && (
            <div style={{ height: 300, position: 'relative' }}>
              <MapContainer
                center={[6.4969, 2.6289]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {getActiveDeliveryMarkers().map((m, i) => (
                  <Marker
                    key={i}
                    position={[m.lat, m.lng]}
                    icon={m.type === 'vendor' ? createVendorIcon(false) : createClientIcon()}
                  >
                    <Popup>{m.label}</Popup>
                  </Marker>
                ))}
                {getActiveDeliveryMarkers().length > 0 && (
                  <FitBounds positions={getActiveDeliveryMarkers()} />
                )}
              </MapContainer>
            </div>
          )}
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
            {search.trim() ? `Aucun résultat pour "${search}"` : (
              <>
                {activeTab === 'actives' && 'Aucune course active.'}
                {activeTab === 'disponibles' && 'Aucune course disponible.'}
                {activeTab === 'historique' && 'Aucune livraison dans l\'historique.'}
              </>
            )}
            {search.trim() && (
              <button onClick={() => setSearch('')}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {/* DISPONIBLES - can accept */}
        {activeTab === 'disponibles' && visibleItems.map(c => {
          const collectes = c.collecteVendeurs || []
          const validatedCount = collectes.filter(cv => cv.statut_collecte !== 'en_attente').length
          const totalCount = collectes.length || new Set((c.detailsCommande || []).map(d => d.produit?.vendeur?.nom_etablissement).filter(Boolean)).size
          return (
          <div key={c.id_commande} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
               <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{c.id_commande}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {c.date_creation ? new Date(c.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                  {' · '}
                  {c.date_creation ? new Date(c.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  {' · '}
                  {c.client?.adresse_livraison || '—'}
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
            {/* Group articles by vendor */}
            {(() => {
              const byVendor = {}
              ;(c.detailsCommande || []).forEach(d => {
                const vName = d.produit?.vendeur?.nom_etablissement || 'Autre vendeur'
                const vMarket = d.produit?.vendeur?.localisation_marche || ''
                if (!byVendor[vName]) byVendor[vName] = { market: vMarket, items: [] }
                byVendor[vName].items.push(d)
              })
              return Object.entries(byVendor).map(([vName, { market, items }]) => (
                <div key={vName} className="rounded-xl px-3 py-2 mb-1.5" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{vName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{market} · {items.length} article{items.length > 1 ? 's' : ''}</div>
                </div>
              ))
            })()}
            <div className="text-[11px] mb-3 font-bold" style={{ color: c.validee_par_vendeur ? '#1D9E75' : '#BA7517' }}>
              {c.validee_par_vendeur
                ? <>✓ {totalCount} vendeur{totalCount > 1 ? 's' : ''} validé{totalCount > 1 ? 's' : ''}</>
                : <>En attente de {validatedCount}/{totalCount} vendeur{totalCount > 1 ? 's' : ''}</>
              }
            </div>
            <button onClick={() => { setAcceptModal(c); setAcceptCode('') }}
              disabled={!c.validee_par_vendeur}
              className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
              style={{ background: !c.validee_par_vendeur ? 'var(--border)' : '#D85A30', color: !c.validee_par_vendeur ? 'var(--text-muted)' : '#fff', border: 'none', cursor: !c.validee_par_vendeur ? 'not-allowed' : 'pointer' }}>
              <Rocket size={14} className="inline align-middle" /> {c.validee_par_vendeur ? 'Accepter cette course' : 'En attente des vendeurs'}
            </button>
          </div>
          )
        })}

        {/* ACTIVES - show next action based on statut */}
        {activeTab === 'actives' && visibleItems.map(d => {
          const cmd = d.commande
          const st = statusStyle(d.statut_livraison)
          const action = nextAction(d)
          const vc = getVendorCounts(d)
          return (
            <div key={d.id_livraison} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cmd?.date_creation ? new Date(cmd.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                    {' · '}
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
              {vc.total > 0 && (
                <div className="text-[11px] mb-2 font-bold" style={{ color: 'var(--text-muted)' }}>
                  <Package size={11} className="inline align-middle" /> {vc.total} vendeur{vc.total > 1 ? 's' : ''} · {vc.validated}/{vc.total} validé{vc.validated > 1 ? 's' : ''} · {vc.collected}/{vc.total} collecté{vc.collected > 1 ? 's' : ''}
                </div>
              )}
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
                <button
                  onClick={action.fn}
                  disabled={action.disabled}
                  className="w-full rounded-2xl py-3 font-black text-white transition-all"
                  style={{
                    background: action.disabled ? 'var(--border)' : '#D85A30',
                    color: action.disabled ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    cursor: action.disabled ? 'not-allowed' : 'pointer'
                  }}
                >
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
                Passée le {cmd?.date_creation ? new Date(cmd.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                {' · '}
                Livrée {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
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

      {/* ACCEPT MODAL */}
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
                Commande #{acceptModal.id_commande}
                {acceptModal.date_creation && ` · Créée le ${new Date(acceptModal.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                {' — '} Demandez le code de vérification au client
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

      {/* FINALIZE MODAL */}
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
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Commande #{finalizeOpen.commande?.id_commande}
                {finalizeOpen.commande?.date_creation && ` · Créée le ${new Date(finalizeOpen.commande.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
              </p>

              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <QrCode size={12} /> Scanner le QR code de finalisation
                </div>
                <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  Demandez au client d'afficher son QR de finalisation. Scannez-le pour confirmer la livraison.
                </div>
                {finalizeVerified ? (
                  <div className="rounded-xl p-4 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                    <CheckCircle size={22} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                    <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>QR code de finalisation validé !</div>
                  </div>
                ) : submitting ? (
                  <div className="rounded-xl p-4 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                    <Loader2 size={20} className="mx-auto mb-1 animate-spin" style={{ color: '#1D9E75' }} />
                    <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>Vérification du QR code en cours…</div>
                  </div>
                ) : !finalizeError ? (
                  <div id="qr-finalize-reader" className="rounded-xl overflow-hidden" style={{ minHeight: 200 }} />
                ) : null}
                {!submitting && !finalizeError && !finalizeVerified && (
                  <button onClick={() => startCamera('qr-finalize-reader', verifyFinalizeScan)}
                    className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                    <QrCode size={14} className="inline align-middle" /> Activer l'appareil photo
                  </button>
                )}
                {finalizeError && (
                  <button onClick={() => { setFinalizeError(null); setFinalizeScanResult(null); setFinalizeVerified(false) }}
                    className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                    <QrCode size={14} className="inline align-middle" /> Réessayer le scan
                  </button>
                )}
              </div>

              {finalizeError && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: isDark ? 'rgba(226,75,74,0.12)' : '#FEE2E2', border: '1.5px solid rgba(226,75,74,0.3)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} style={{ color: '#E24B4A' }} />
                    <span className="text-xs font-black" style={{ color: '#E24B4A' }}>Échec de la vérification</span>
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    {finalizeError}
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    Vérifiez que vous scannez le QR code de la bonne commande.
                  </div>
                </div>
              )}

              <button onClick={submitFinalize} disabled={submitting || !finalizeVerified}
                className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                style={{
                  background: (!finalizeVerified || submitting) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                  border: 'none', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Envoi…</> : <><CheckCircle size={14} className="inline align-middle" /> Finaliser la livraison</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-VENDOR COLLECT MODAL — Stepper */}
      {collectOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setCollectOpen(null); cleanupScanner() }}>
          <div className="w-full max-w-lg rounded-t-[28px] overflow-y-auto" style={{ background: 'var(--surface)', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-8 pt-3">
              <h2 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Commande #{collectOpen.commande?.id_commande} — Collecte</h2>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                {collectOpen.commande?.date_creation && `Créée le ${new Date(collectOpen.commande.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
              </p>

              {/* Vendor Stepper */}
              <div className="flex flex-col gap-3 mb-5">
                {vendorStatus.map((v, i) => {
                  const collected = v.statut_collecte === 'collectee'
                  const isSelected = i === activeVendorIndex && !allCollected
                  const canScan = !collected && v.statut_collecte === 'validee'
                  return (
                    <div key={v.id_collecte}
                      onClick={() => { if (canScan) { setActiveVendorIndex(i); setCollectError(null); setCollectVerified(false); setCollectScanData(null); setCollectPhase(null); cleanupScanner() } }}
                      className={`rounded-2xl p-3 transition-all ${canScan ? 'cursor-pointer active:scale-98' : ''}`}
                      style={{
                      background: collected
                        ? (isDark ? 'rgba(29,158,117,0.1)' : '#E1F5EE')
                        : isSelected
                          ? (isDark ? 'rgba(59,130,246,0.1)' : '#E6F1FB')
                          : 'var(--surface-alt)',
                      border: `1.5px solid ${collected ? '#1D9E75' : isSelected ? '#3B82F6' : canScan ? '#D85A30' : 'var(--border)'}`,
                    }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0" style={{
                          background: collected ? '#1D9E75' : isSelected ? '#3B82F6' : canScan ? '#D85A30' : (isDark ? '#4A4B47' : '#9CA3AF'),
                        }}>
                          {collected ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {v.nom_etablissement || v.nom || `Vendeur ${i + 1}`}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {v.localisation_marche || '—'}
                          </div>
                        </div>
                        <div className="text-[10px] font-bold flex-shrink-0" style={{ color: collected ? '#1D9E75' : isSelected ? '#3B82F6' : 'var(--text-muted)' }}>
                          {collected ? (
                            <>Collecté{v.qr_scanne_at ? ` à ${new Date(v.qr_scanne_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}</>
                          ) : isSelected ? 'Scanner ici' : canScan ? 'Appuyez pour scanner' : 'En attente'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress */}
              {vendorStatus.length > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span>Progression</span>
                    <span>{vendorStatus.filter(v => v.statut_collecte === 'collectee').length}/{vendorStatus.length}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#2A2B28' : '#E5E7EB' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${vendorStatus.length > 0 ? (vendorStatus.filter(v => v.statut_collecte === 'collectee').length / vendorStatus.length) * 100 : 0}%`,
                      background: '#D85A30',
                    }} />
                  </div>
                </div>
              )}

              {/* All collected */}
              {allCollected && (
                <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: '1.5px solid rgba(29,158,117,0.3)' }}>
                  <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#1D9E75' }} />
                  <div className="text-sm font-black mb-1" style={{ color: '#0F6E56' }}>Tous les vendeurs collectés !</div>
                  <div className="text-xs mb-3" style={{ color: '#0F6E56' }}>Maintenant vous pouvez partir.</div>
                  <button onClick={() => { marquerEnRoute(collectOpen.commande.id_commande); setCollectOpen(null) }}
                    className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                    style={{ background: '#D85A30', border: 'none' }}>
                    <Truck size={14} className="inline align-middle" /> Marquer le départ
                  </button>
                </div>
              )}

              {/* QR Scanner for active vendor */}
              {!allCollected && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <QrCode size={12} /> Scanner le QR du vendeur
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                    {vendorStatus[activeVendorIndex]?.nom_etablissement || 'Vendeur'} — {vendorStatus[activeVendorIndex]?.localisation_marche || ''}
                  </div>

                  {collectVerified ? (
                    <div className="rounded-xl p-4 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                      <CheckCircle size={22} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                      <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>QR code validé !</div>
                    </div>
                  ) : submitting ? (
                    <div className="rounded-xl p-4 text-center" style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                      <Loader2 size={20} className="mx-auto mb-1 animate-spin" style={{ color: '#1D9E75' }} />
                      <div className="text-xs font-bold" style={{ color: '#0F6E56' }}>Vérification en cours…</div>
                    </div>
                  ) : !collectError ? (
                    <div id="qr-collect-reader" className="rounded-xl overflow-hidden" style={{ minHeight: 200 }} />
                  ) : null}

                  {!submitting && !collectError && !collectVerified && (
                    <button onClick={() => startCamera('qr-collect-reader', verifyVendorScan)}
                      className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                      <QrCode size={14} className="inline align-middle" /> Activer l'appareil photo
                    </button>
                  )}

                  {collectError && (
                    <button onClick={() => { setCollectError(null); setCollectScanData(null); setCollectVerified(false); setCollectPhase('scanning') }}
                      className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                      <QrCode size={14} className="inline align-middle" /> Réessayer le scan
                    </button>
                  )}
                </div>
              )}

              {collectError && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: isDark ? 'rgba(226,75,74,0.12)' : '#FEE2E2', border: '1.5px solid rgba(226,75,74,0.3)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} style={{ color: '#E24B4A' }} />
                    <span className="text-xs font-black" style={{ color: '#E24B4A' }}>Échec de la vérification</span>
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    {collectError}
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    Vérifiez que vous scannez le QR code du bon vendeur.
                  </div>
                </div>
              )}

              {!allCollected && collectVerified && (
                <button onClick={submitVendorCollect} disabled={submitting}
                  className="w-full py-4 rounded-2xl text-white font-black text-sm cursor-pointer transition-all active:scale-98"
                  style={{
                    background: submitting ? (isDark ? '#3A3B38' : '#D3D1C7') : '#D85A30',
                    border: 'none', opacity: submitting ? 0.7 : 1,
                  }}>
                  {submitting ? <><Loader2 size={14} className="animate-spin inline" /> Confirmation…</> : <><CheckCircle size={14} className="inline align-middle" /> Confirmer la collecte</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
