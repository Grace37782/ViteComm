import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const STATUT_STYLE = {
  'Livree': { label: 'Livrée', bg: '#E1F5EE', color: '#0F6E56' },
  'Echec': { label: 'Échec', bg: '#FDE8E2', color: '#D85A30' },
  'En cours de livraison': { label: 'En cours', bg: '#FAEEDA', color: '#854F0B' },
  'Collectee': { label: 'Collectée', bg: '#E8F4FF', color: '#1664C1' },
  'En attente': { label: 'En attente', bg: '#F5F5F0', color: '#888780' },
  'Validee': { label: 'Validée', bg: '#FAEEDA', color: '#854F0B' },
}

export default function Historique() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/livreur/deliveries')
      .then(data => setDeliveries(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? deliveries
    : deliveries.filter(d => d.statut_livraison === filter)

  const completed = deliveries.filter(d => d.statut_livraison === 'Livree')
  const failed = deliveries.filter(d => d.statut_livraison === 'Echec')
  const inProgress = deliveries.filter(d => d.statut_livraison !== 'Livree' && d.statut_livraison !== 'Echec')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Chargement de l'historique…</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Terminées', value: completed.length, accent: '#1D9E75' },
          { label: 'En cours', value: inProgress.length, accent: '#BA7517' },
          { label: 'Échecs', value: failed.length, accent: '#D85A30' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Tout' },
          { id: 'Livree', label: '✅ Livrées' },
          { id: 'En cours de livraison', label: '🚚 En cours' },
          { id: 'Echec', label: '❌ Échecs' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap"
            style={{
              background: filter === f.id ? '#D85A30' : 'var(--surface)',
              color: filter === f.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${filter === f.id ? '#D85A30' : 'var(--border)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-sm py-10" style={{ color: 'var(--text-muted)' }}>
            Aucune livraison trouvée.
          </div>
        )}

        {filtered.map(d => {
          const cmd = d.commande
          const style = STATUT_STYLE[d.statut_livraison] || STATUT_STYLE['En attente']
          const clientName = cmd?.client?.utilisateur
            ? `${cmd.client.utilisateur.prenom} ${cmd.client.utilisateur.nom}`
            : '—'

          return (
            <div key={d.id_livraison} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{clientName}</div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.color }}>
                  {style.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Destination</div>
                  <div>{cmd?.client?.adresse_livraison || '—'}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Montant</div>
                  <div>{(cmd?.frais_livraison || 1500).toLocaleString()} F</div>
                </div>
              </div>

              {d.frais_retour_calcules > 0 && (
                <div className="rounded-xl px-4 py-2 text-xs mb-2" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                  ↩️ Frais retour : {d.frais_retour_calcules.toLocaleString()} F
                </div>
              )}

              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Prise en charge : {d.date_prise_en_charge ? new Date(d.date_prise_en_charge).toLocaleDateString('fr-FR') : '—'}</span>
                <span>Fin : {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
