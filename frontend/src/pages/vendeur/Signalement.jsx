import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { AlertTriangle, CheckCircle, Search, Loader2, ClipboardList, BarChart3, ShoppingCart, Package, Bike, Send, ChevronDown } from 'lucide-react'

const MOTIFS = [
  'Comportement inapproprié',
  'Fraude ou arnaque',
  'Produit non conforme',
  'Non-respect des délais',
  'Harcèlement',
  'Autre',
]

const STATUT_ICONS = {
  en_attente: Loader2,
  en_cours: Search,
  traite: CheckCircle,
}

const STATUT_COLORS = {
  en_attente: { bg: '#FFF8E7', text: '#854F0B', border: '#FAC775', label: 'En attente' },
  en_cours: { bg: '#E6F1FB', text: '#2B6CB0', border: '#90CDF4', label: 'En cours' },
  traite: { bg: '#E1F5EE', text: '#0F6E56', border: '#9AE6B4', label: 'Traité' },
}

const PAGE_SIZE = 10

export default function Signalement() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onglet, setOnglet] = useState('liste')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ cible: '', type: 'client', motif: '', description: '' })
  const [erreurs, setErreurs] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [detail, setDetail] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    fetchSignalements()
  }, [])

  async function fetchSignalements() {
    try {
      setLoading(true)
      const data = await api.get('/vendor/signalements')
      setSignalements(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtres = signalements.filter((s) =>
    filtreStatut === 'tous' || s.statut === filtreStatut
  )
  const visibleItems = filtres.slice(0, visibleCount)
  const hasMore = visibleCount < filtres.length

  const stats = {
    total: signalements.length,
    en_attente: signalements.filter((s) => s.statut === 'en_attente').length,
    en_cours: signalements.filter((s) => s.statut === 'en_cours').length,
    traites: signalements.filter((s) => s.statut === 'traite').length,
  }

  function valider() {
    const e = {}
    if (!form.cible.trim()) e.cible = 'Nom de la cible requis'
    if (!form.motif) e.motif = 'Motif requis'
    if (!form.description.trim()) e.description = 'Description requise'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  async function envoyerSignalement() {
    if (!valider()) return
    setSaving(true)
    try {
      await api.post('/vendor/signalements', {
        cible: form.cible,
        type_cible: form.type,
        motif: form.motif,
        description: form.description,
      })
      setForm({ cible: '', type: 'client', motif: '', description: '' })
      setErreurs({})
      setShowForm(false)
      showToast("Signalement envoyé à l'administrateur")
      fetchSignalements()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
    <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-4xl">
        <div className="flex gap-2">{[1, 2].map((i) => <div key={i} className="h-8 rounded-full w-32 animate-pulse" style={{ background: 'var(--border)' }} />)}</div>
        {[1, 2].map((i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex justify-center mb-3"><AlertTriangle size={40} style={{ color: '#E24B4A' }} /></div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D2A10 0%, #121110 100%)' : 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">Signaler</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? '#BA7517' : '#D85A30' }}>
          {toast.type === 'error' && <AlertTriangle size={14} className="inline mr-1" />}
          {toast.type === 'ok' && <CheckCircle size={14} className="inline mr-1" />}
          {toast.msg}
        </div>
      )}

      <div className="flex gap-2">
        {[
          { id: 'liste', label: 'Mes signalements', icon: ClipboardList },
          { id: 'stats', label: 'Résumé', icon: BarChart3 },
        ].map((o) => (
          <button key={o.id} onClick={() => { setOnglet(o.id); setDetail(null) }}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer flex items-center gap-1.5"
            style={{
              background: onglet === o.id ? '#BA7517' : 'var(--surface)',
              color: onglet === o.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${onglet === o.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            <o.icon size={12} />
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'stats' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total', val: stats.total, accent: 'var(--text-primary)' },
            { label: 'En attente', val: stats.en_attente, accent: '#854F0B' },
            { label: 'En cours', val: stats.en_cours, accent: '#2B6CB0' },
            { label: 'Traités', val: stats.traites, accent: '#0F6E56' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="font-black text-xl mt-1" style={{ color: s.accent }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {onglet === 'liste' && !detail && (
        <>
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-2xl text-white text-sm font-black cursor-pointer flex items-center justify-center gap-2"
            style={{ background: '#BA7517', border: 'none' }}>
            <AlertTriangle size={14} /> Nouveau signalement
          </button>

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {['tous', 'en_attente', 'en_cours', 'traite'].map((s) => (
              <button key={s} onClick={() => { setFiltreStatut(s); setVisibleCount(PAGE_SIZE) }}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
                style={{
                  background: filtreStatut === s ? '#BA7517' : 'var(--surface)',
                  color: filtreStatut === s ? '#fff' : 'var(--text-muted)',
                  border: `1.5px solid ${filtreStatut === s ? '#BA7517' : 'var(--border)'}`,
                }}>
                {s === 'tous' ? 'Tous' : (() => { const Icon = STATUT_ICONS[s]; return Icon ? <><Icon size={10} className={s === 'en_attente' ? 'animate-spin' : ''} /> {STATUT_COLORS[s]?.label}</> : s })()}
              </button>
            ))}
          </div>

          {showForm && (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--surface)', border: '2px solid #BA7517' }}>
              <div className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><AlertTriangle size={14} /> Nouveau signalement</div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Nom de la personne signalée *</label>
                <input type="text" placeholder="Ex: Amadou K."
                  value={form.cible} onChange={(e) => setForm((p) => ({ ...p, cible: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                {erreurs.cible && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.cible}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Type d'utilisateur</label>
                <div className="flex gap-2">
                  {[
                    { value: 'client', icon: ShoppingCart },
                    { value: 'vendeur', icon: Package },
                    { value: 'livreur', icon: Bike },
                  ].map((t) => (
                    <button key={t.value} type="button" onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer flex items-center justify-center gap-1"
                      style={{
                        background: form.type === t.value ? '#FAEEDA' : 'var(--surface-alt)',
                        border: `1.5px solid ${form.type === t.value ? '#BA7517' : 'var(--border)'}`,
                        color: form.type === t.value ? '#BA7517' : 'var(--text-secondary)',
                      }}>
                      <t.icon size={12} /> {t.value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Motif *</label>
                <select value={form.motif} onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Sélectionnez un motif</option>
                  {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {erreurs.motif && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.motif}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <textarea placeholder="Décrivez l'incident en détail…"
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                {erreurs.description && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.description}</span>}
              </div>

              <div className="flex gap-2 mt-1">
                <button onClick={envoyerSignalement} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-black cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: saving ? '#999' : '#BA7517', border: 'none', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Envoi…' : <><Send size={14} /> Envoyer</>}
                </button>
                <button onClick={() => { setShowForm(false); setErreurs({}) }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {filtres.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3"><CheckCircle size={48} style={{ color: 'var(--text-muted)' }} /></div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Aucun signalement</p>
            </div>
          ) : (
            visibleItems.map((s) => (
              <div key={s.id} onClick={() => setDetail(s)}
                className="rounded-2xl p-4 cursor-pointer transition-all"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--surface-alt)' }}>
                      {s.type === 'client' ? <ShoppingCart size={14} style={{ color: 'var(--text-secondary)' }} /> : s.type === 'vendeur' ? <Package size={14} style={{ color: 'var(--text-secondary)' }} /> : <Bike size={14} style={{ color: 'var(--text-secondary)' }} />}
                    </div>
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{s.cible}</div>
                      <div className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{s.type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ background: STATUT_COLORS[s.statut]?.bg, color: STATUT_COLORS[s.statut]?.text, border: `1px solid ${STATUT_COLORS[s.statut]?.border}` }}>
                    {(() => { const Icon = STATUT_ICONS[s.statut]; return Icon ? <Icon size={10} className={s.statut === 'en_attente' ? 'animate-spin' : ''} /> : null })()}
                    {STATUT_COLORS[s.statut]?.label}
                  </span>
                </div>
                <div className="text-xs font-bold mb-1" style={{ color: '#BA7517' }}>{s.motif}</div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</div>
              </div>
            ))
          )}

          {hasMore && (
            <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              <ChevronDown size={14} /> Charger plus ({filtres.length - visibleCount} restant{filtres.length - visibleCount > 1 ? 's' : ''})
            </button>
          )}
        </>
      )}

      {detail && (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setDetail(null)}
              className="text-xs font-bold cursor-pointer"
              style={{ color: '#BA7517', background: 'none', border: 'none' }}>← Retour</button>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: STATUT_COLORS[detail.statut]?.bg, color: STATUT_COLORS[detail.statut]?.text, border: `1px solid ${STATUT_COLORS[detail.statut]?.border}` }}>
              {(() => { const Icon = STATUT_ICONS[detail.statut]; return Icon ? <Icon size={10} className={detail.statut === 'en_attente' ? 'animate-spin' : ''} /> : null })()}
              {STATUT_COLORS[detail.statut]?.label}
            </span>
          </div>

          <div className="text-center py-3">
            <div className="flex justify-center mb-2">
              {detail.type === 'client' ? <ShoppingCart size={32} style={{ color: 'var(--text-secondary)' }} /> : detail.type === 'vendeur' ? <Package size={32} style={{ color: 'var(--text-secondary)' }} /> : <Bike size={32} style={{ color: 'var(--text-secondary)' }} />}
            </div>
            <div className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{detail.cible}</div>
            <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>Type: {detail.type}</div>
          </div>

          <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Motif</div>
            <div className="text-sm font-black" style={{ color: '#BA7517' }}>{detail.motif}</div>
          </div>

          <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Description</div>
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{detail.description}</div>
          </div>

          <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Date</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(detail.date)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
