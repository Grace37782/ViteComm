import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { CheckCircle, Truck, XCircle, Undo2, ChevronDown } from 'lucide-react'

const PAGE_SIZE = 10

export default function Historique() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [deliveries, setDeliveries] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    api.get('/livreur/historique')
      .then(data => { setDeliveries(data.livraisons || []); setStats(data.stats || null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? deliveries : deliveries.filter(d => d.statut_livraison === filter)
  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function statusStyle(statut) {
    const map = {
      'Livree': { bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
      'Echec': { bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', color: isDark ? '#F87171' : '#B91C1C' },
      'En cours de livraison': { bg: isDark ? 'rgba(216,90,48,0.15)' : '#FAECE7', color: isDark ? '#E87D55' : '#993C1D' },
      'Inspectee': { bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
      'Collectee': { bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
      'En attente': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      'Validee': { bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    }
    return map[statut] || map['En attente']
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

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Terminées', value: stats?.terminees ?? 0, icon: <CheckCircle size={20} />,
            bg: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB', color: isDark ? '#34D399' : '#0F6E56' },
          { label: 'En cours', value: stats?.en_cours ?? 0, icon: <Truck size={20} />,
            bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: isDark ? '#BA7517' : '#FAC775', color: isDark ? '#F3A83B' : '#854F0B' },
          { label: 'Échecs', value: stats?.echecs ?? 0, icon: <XCircle size={20} />,
            bg: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2', border: isDark ? '#EF4444' : '#FECACA', color: isDark ? '#F87171' : '#B91C1C' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div className="mb-1">{s.icon}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Tout' },
          { id: 'Livree', label: <><CheckCircle size={12} className="inline align-middle" /> Livrées</> },
          { id: 'En cours de livraison', label: <><Truck size={12} className="inline align-middle" /> En cours</> },
          { id: 'Echec', label: <><XCircle size={12} className="inline align-middle" /> Échecs</> },
        ].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setVisibleCount(PAGE_SIZE) }}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all active:scale-95"
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
          <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
            Aucune livraison trouvée.
          </div>
        )}

        {visibleItems.map(d => {
          const cmd = d.commande
          const st = statusStyle(d.statut_livraison)
          const clientName = cmd?.client?.utilisateur ? `${cmd.client.utilisateur.prenom} ${cmd.client.utilisateur.nom}` : '—'

          return (
            <div key={d.id_livraison} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{cmd?.id_commande}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{clientName}</div>
                </div>
                <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                  {d.statut_livraison === 'Livree' ? 'Livrée' : d.statut_livraison === 'Echec' ? 'Échec' : d.statut_livraison}
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
                <div className="rounded-xl px-4 py-2 text-xs mb-2"
                  style={{ background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' }}>
                  <Undo2 size={12} className="inline align-middle" /> Frais retour : {d.frais_retour_calcules.toLocaleString()} F
                </div>
              )}
              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Prise en charge : {d.date_prise_en_charge ? new Date(d.date_prise_en_charge).toLocaleDateString('fr-FR') : '—'}</span>
                <span>Fin : {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
            </div>
          )
        })}

        {hasMore && (
          <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronDown size={14} /> Charger plus ({filtered.length - visibleCount} restant{filtered.length - visibleCount > 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  )
}
