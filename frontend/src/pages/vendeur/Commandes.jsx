import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { AlertTriangle, ShoppingCart, Loader2, CheckCircle, Package, ChevronDown, ShieldCheck, QrCode, XCircle, Search } from 'lucide-react'

const PAGE_SIZE = 10

export default function CommandesVendeur() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [validating, setValidating] = useState({})
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [qrModal, setQrModal] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [scanStatus, setScanStatus] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!qrModal) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScanStatus(null)
    const poll = async () => {
      try {
        const data = await api.get(`/vendor/orders/${qrModal.id}/scan-status`)
        setScanStatus(data)
        if (data.statut === 'echec') return
      } catch { /* polling error, ignore */ }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [qrModal])

  async function fetchOrders() {
    try {
      setLoading(true)
      const data = await api.get('/vendor/orders')
      setCommandes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const STATUT_STYLE = {
    en_attente: { label: 'En attente livreur', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    collecte: { label: 'Collecté', bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
  }

  const filtres = {
    tous: commandes,
    a_valider: commandes.filter((c) => !c.validee_par_vendeur),
    en_attente: commandes.filter((c) => c.validee_par_vendeur && c.statut_collecte === 'en_attente'),
    collecte: commandes.filter((c) => c.statut_collecte === 'collecte'),
  }

  const baseList = filtres[filtre] || commandes

  const liste = search.trim()
    ? baseList.filter((c) => {
        const q = search.toLowerCase().trim()
        const clientId = String(c.id)
        const clientName = (c.client?.nom || '').toLowerCase()
        const livreurName = (c.livreur?.nom || '').toLowerCase()
        const clientAdresse = (c.client?.adresse || '').toLowerCase()
        const productNames = (c.articles || []).map(a => (a.nom || '').toLowerCase()).join(' ')
        return clientId.includes(q) ||
          clientName.includes(q) ||
          livreurName.includes(q) ||
          clientAdresse.includes(q) ||
          productNames.includes(q)
      })
    : baseList
  const visibleItems = liste.slice(0, visibleCount)
  const hasMore = visibleCount < liste.length

  async function validerCommande(cmd) {
    try {
      setValidating((p) => ({ ...p, [cmd.id]: true }))
      await api.post(`/vendor/orders/${cmd.id}/validate`)
      setCommandes((prev) =>
        prev.map((c) => (c.id === cmd.id ? { ...c, validee_par_vendeur: true } : c))
      )
    } catch (err) {
      console.error('Validation error:', err)
    } finally {
      setValidating((p) => ({ ...p, [cmd.id]: false }))
    }
  }

  async function showQRCode(cmd) {
    setQrModal(cmd)
    setQrData(null)
    setScanStatus(null)
    try {
      const data = await api.get(`/vendor/orders/${cmd.id}/qrcode`)
      setQrData(data)
    } catch {
      setQrModal(null)
    }
  }

  if (loading) {
    return (
    <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="h-16" style={{ background: 'var(--surface-alt)' }} />
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="h-4 rounded w-3/4" style={{ background: 'var(--border)' }} />
              <div className="h-4 rounded w-1/2" style={{ background: 'var(--border)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-4xl mb-3"><AlertTriangle size={32} /></div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
          <button onClick={fetchOrders}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#BA7517', color: '#fff' }}>
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { id: 'tous', label: 'Toutes' },
          { id: 'a_valider', label: 'À valider' },
          { id: 'en_attente', label: 'En attente' },
          { id: 'collecte', label: 'Collectées' },
        ].map((f) => (
          <button key={f.id} onClick={() => { setFiltre(f.id); setVisibleCount(PAGE_SIZE) }}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
            style={{
              background: filtre === f.id ? '#BA7517' : 'var(--surface)',
              color: filtre === f.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${filtre === f.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            {f.label}
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
            placeholder="Rechercher par client, livreur, n° commande, produit..."
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
        <div className="text-center py-12">
          <div className="text-5xl mb-3"><ShoppingCart size={40} /></div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
            {search.trim() ? `Aucun résultat pour "${search}"` : 'Aucune commande dans cette catégorie'}
          </p>
          {search.trim() && (
            <button onClick={() => setSearch('')}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
              Effacer la recherche
            </button>
          )}
        </div>
      )}

      {visibleItems.map((cmd) => {
        const collecte = cmd.statut_collecte === 'collecte'
        const st = collecte ? STATUT_STYLE.collecte : STATUT_STYLE.en_attente
        const total = cmd.articles.reduce((s, a) => s + a.prix * a.qte, 0)

        return (
          <div key={cmd.id} className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: `1.5px solid ${collecte ? (isDark ? '#2DC491' : '#9FE1CB') : 'var(--border)'}`,
              boxShadow: 'var(--shadow)',
            }}>

            {/* En-tête commande */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{
                background: collecte ? (isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE') : 'var(--surface-alt)',
                borderBottom: '1px solid var(--border)',
              }}>
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  Commande #{cmd.id}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {cmd.client?.nom || 'Client'} · {cmd.heure} · Livreur: {cmd.livreur.nom}
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>

            {/* Articles */}
            <div className="px-4 py-3 flex flex-col gap-2">
              {cmd.articles.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-alt)' }}>
                  <span className="text-xl flex-shrink-0"><Package size={18} /></span>
                  <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
                    {a.nom} × {a.qte} {a.unite}
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#BA7517' }}>
                    {(a.prix * a.qte).toLocaleString()} F
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-1 pt-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total commande</span>
                <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                  {total.toLocaleString()} F
                </span>
              </div>
            </div>

            {/* Zone validation vendeur (avant la remise) */}
            {!cmd.validee_par_vendeur && !collecte && (
              <div className="px-4 pb-4 pt-3"
                style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
                  style={{ background: isDark ? 'rgba(234,179,8,0.12)' : '#FEF9C3' }}>
                  <ShieldCheck size={16} style={{ color: isDark ? '#FACC15' : '#A16207' }} />
                  <span className="text-xs font-semibold" style={{ color: isDark ? '#FACC15' : '#A16207' }}>
                    Validez la disponibilité des articles avant la remise
                  </span>
                </div>
                <button
                  onClick={() => validerCommande(cmd)}
                  disabled={validating[cmd.id]}
                  className="w-full py-3 rounded-xl text-sm font-black transition-all"
                  style={{
                    background: validating[cmd.id] ? (isDark ? 'var(--border)' : '#D3D1C7') : (isDark ? '#2DC491' : '#0F6E56'),
                    border: 'none',
                    color: '#fff',
                    cursor: validating[cmd.id] ? 'not-allowed' : 'pointer',
                  }}>
                  {validating[cmd.id] ? 'Validation…' : 'Articles disponibles →'}
                </button>
              </div>
            )}

            {/* QR Code button (after validation, before collection) */}
            {cmd.validee_par_vendeur && !collecte && (
              <div className="px-4 pb-4 pt-3"
                style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => showQRCode(cmd)}
                  className="w-full py-3 rounded-xl text-sm font-black cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5', border: 'none' }}>
                  <QrCode size={16} /> Afficher le QR code pour le livreur
                </button>
              </div>
            )}

            {/* Collecte confirmée */}
            {collecte && (
              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                  <CheckCircle size={18} />
                  <span className="text-xs font-black" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>
                    Remise confirmée — Articles collectés par le livreur
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {hasMore && (
        <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
          <ChevronDown size={14} /> Charger plus ({liste.length - visibleCount} restant{liste.length - visibleCount > 1 ? 's' : ''})
        </button>
      )}

      {/* QR CODE MODAL */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setQrModal(null); setQrData(null); setScanStatus(null) }}>
          <div className="rounded-3xl p-6 max-w-sm w-full text-center" style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-base" style={{ color: 'var(--text-primary)' }}>QR Code — Commande #{qrModal.id}</div>
              <button onClick={() => { setQrModal(null); setQrData(null); setScanStatus(null) }} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <XCircle size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            {scanStatus?.statut === 'echec' && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: isDark ? 'rgba(226,75,74,0.12)' : '#FEE2E2', border: '1.5px solid rgba(226,75,74,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} style={{ color: '#E24B4A' }} />
                  <span className="text-xs font-black" style={{ color: '#E24B4A' }}>Échec de la vérification</span>
                </div>
                <div className="text-xs" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                  {scanStatus.message || 'Le code QR n\'a pas été reconnu.'}
                </div>
                <div className="text-[10px] mt-2" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                  Le livreur peut réessayer en ouvrant à nouveau la caméra.
                </div>
              </div>
            )}
            {qrData ? (
              <>
                <img src={qrData.qrcode} alt="QR Code" className="mx-auto rounded-2xl mb-3" style={{ maxWidth: 250 }} />
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Le livreur doit scanner ce QR code pour confirmer la collecte
                </div>
              </>
            ) : (
              <div className="py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
