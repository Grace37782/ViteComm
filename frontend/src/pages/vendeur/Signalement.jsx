import { useState } from 'react'

const MOTIFS = [
  'Comportement inapproprié',
  'Fraude ou arnaque',
  'Produit non conforme',
  'Non-respect des délais',
  'Harcèlement',
  'Autre',
]

const SIGNALEMENTS_INIT = [
  { id: 1, cible: 'Amadou K.', type: 'client', motif: 'Comportement inapproprié', description: 'Client agressif lors de la livraison', statut: 'en_cours', date: '2026-06-01T14:30' },
  { id: 2, cible: 'Fatima S.', type: 'livreur', motif: 'Non-respect des délais', description: 'Livreur a retardé de 2h sans prévenir', statut: 'traite', date: '2026-05-28T09:15' },
  { id: 3, cible: 'Youssouf M.', type: 'client', motif: 'Fraude ou arnaque', description: 'Paiement contesté après réception', statut: 'en_attente', date: '2026-06-05T16:45' },
]

const STATUT_COLORS = {
  en_attente: { bg: '#FFF8E7', text: '#854F0B', border: '#FAC775', label: '⏳ En attente' },
  en_cours: { bg: '#E6F1FB', text: '#2B6CB0', border: '#90CDF4', label: '🔍 En cours' },
  traite: { bg: '#E1F5EE', text: '#0F6E56', border: '#9AE6B4', label: '✅ Traité' },
}

export default function Signalement() {
  const [signalements, setSignalements] = useState(SIGNALEMENTS_INIT)
  const [onglet, setOnglet] = useState('liste')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ cible: '', type: 'client', motif: '', description: '' })
  const [erreurs, setErreurs] = useState({})
  const [toast, setToast] = useState(null)
  const [detail, setDetail] = useState(null)

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtres = signalements.filter(s =>
    filtreStatut === 'tous' || s.statut === filtreStatut
  )

  const stats = {
    total: signalements.length,
    en_attente: signalements.filter(s => s.statut === 'en_attente').length,
    en_cours: signalements.filter(s => s.statut === 'en_cours').length,
    traites: signalements.filter(s => s.statut === 'traite').length,
  }

  function valider() {
    const e = {}
    if (!form.cible.trim()) e.cible = 'Nom de la cible requis'
    if (!form.motif) e.motif = 'Motif requis'
    if (!form.description.trim()) e.description = 'Description requise'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  function envoyerSignalement() {
    if (!valider()) return
    const nouveau = {
      id: Date.now(),
      cible: form.cible,
      type: form.type,
      motif: form.motif,
      description: form.description,
      statut: 'en_attente',
      date: new Date().toISOString(),
    }
    setSignalements(p => [nouveau, ...p])
    setForm({ cible: '', type: 'client', motif: '', description: '' })
    setErreurs({})
    setShowForm(false)
    showToast('✅ Signalement envoyé à l\'administrateur')
  }

  function supprimer(id) {
    setSignalements(p => p.filter(s => s.id !== id))
    setDetail(null)
    showToast('🗑️ Signalement supprimé')
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? '#BA7517' : '#D85A30' }}>
          {toast.msg}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {[
          { id: 'liste', label: '📋 Mes signalements' },
          { id: 'stats', label: '📊 Résumé' },
        ].map(o => (
          <button key={o.id} onClick={() => { setOnglet(o.id); setDetail(null) }}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
            style={{
              background: onglet === o.id ? '#BA7517' : 'var(--surface)',
              color: onglet === o.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${onglet === o.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {onglet === 'stats' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total', val: stats.total, accent: 'var(--text-primary)' },
            { label: 'En attente', val: stats.en_attente, accent: '#854F0B' },
            { label: 'En cours', val: stats.en_cours, accent: '#2B6CB0' },
            { label: 'Traités', val: stats.traites, accent: '#0F6E56' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="font-black text-xl mt-1" style={{ color: s.accent }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {onglet === 'liste' && !detail && (
        <>
          {/* Bouton nouveau */}
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-2xl text-white text-sm font-black cursor-pointer"
            style={{ background: '#BA7517', border: 'none' }}>
            ⚠️ Nouveau signalement
          </button>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {['tous', 'en_attente', 'en_cours', 'traite'].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer"
                style={{
                  background: filtreStatut === s ? '#BA7517' : 'var(--surface)',
                  color: filtreStatut === s ? '#fff' : 'var(--text-muted)',
                  border: `1.5px solid ${filtreStatut === s ? '#BA7517' : 'var(--border)'}`,
                }}>
                {s === 'tous' ? 'Tous' : STATUT_COLORS[s]?.label || s}
              </button>
            ))}
          </div>

          {/* Formulaire nouveau */}
          {showForm && (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--surface)', border: '2px solid #BA7517' }}>
              <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>⚠️ Nouveau signalement</div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Nom de la personne signalée *</label>
                <input type="text" placeholder="Ex: Amadou K."
                  value={form.cible} onChange={e => setForm(p => ({ ...p, cible: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                {erreurs.cible && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.cible}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Type d'utilisateur</label>
                <div className="flex gap-2">
                  {['client', 'vendeur', 'livreur'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer"
                      style={{
                        background: form.type === t ? '#FAEEDA' : 'var(--surface-alt)',
                        border: `1.5px solid ${form.type === t ? '#BA7517' : 'var(--border)'}`,
                        color: form.type === t ? '#BA7517' : 'var(--text-secondary)',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Motif *</label>
                <select value={form.motif} onChange={e => setForm(p => ({ ...p, motif: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Sélectionnez un motif</option>
                  {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {erreurs.motif && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.motif}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <textarea placeholder="Décrivez l'incident en détail…"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                {erreurs.description && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.description}</span>}
              </div>

              <div className="flex gap-2 mt-1">
                <button onClick={envoyerSignalement}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-black cursor-pointer"
                  style={{ background: '#BA7517', border: 'none' }}>
                  📨 Envoyer
                </button>
                <button onClick={() => { setShowForm(false); setErreurs({}) }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste signalements */}
          {filtres.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Aucun signalement</p>
            </div>
          ) : (
            filtres.map(s => (
              <div key={s.id} onClick={() => setDetail(s)}
                className="rounded-2xl p-4 cursor-pointer transition-all"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'var(--surface-alt)' }}>
                      {s.type === 'client' ? '🛒' : s.type === 'vendeur' ? '📦' : '🚲'}
                    </div>
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{s.cible}</div>
                      <div className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{s.type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: STATUT_COLORS[s.statut]?.bg, color: STATUT_COLORS[s.statut]?.text, border: `1px solid ${STATUT_COLORS[s.statut]?.border}` }}>
                    {STATUT_COLORS[s.statut]?.label}
                  </span>
                </div>
                <div className="text-xs font-bold mb-1" style={{ color: '#BA7517' }}>{s.motif}</div>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</div>
              </div>
            ))
          )}
        </>
      )}

      {/* Détail */}
      {detail && (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setDetail(null)}
              className="text-xs font-bold cursor-pointer"
              style={{ color: '#BA7517', background: 'none', border: 'none' }}>
              ← Retour
            </button>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: STATUT_COLORS[detail.statut]?.bg, color: STATUT_COLORS[detail.statut]?.text, border: `1px solid ${STATUT_COLORS[detail.statut]?.border}` }}>
              {STATUT_COLORS[detail.statut]?.label}
            </span>
          </div>

          <div className="text-center py-3">
            <div className="text-4xl mb-2">
              {detail.type === 'client' ? '🛒' : detail.type === 'vendeur' ? '📦' : '🚲'}
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

          {detail.statut === 'en_attente' && (
            <button onClick={() => supprimer(detail.id)}
              className="w-full py-3 rounded-2xl text-sm font-black cursor-pointer"
              style={{ background: '#FAECE7', color: '#D85A30', border: '1.5px solid #F5C4B3' }}>
              🗑️ Supprimer ce signalement
            </button>
          )}
        </div>
      )}
    </div>
  )
}
