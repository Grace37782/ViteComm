import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { CheckCircle, Truck, XCircle, Undo2, ChevronDown, Search } from 'lucide-react'

const PAGE_SIZE = 10

export default function Historique() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [deliveries, setDeliveries] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    api.get('/livreur/historique')
      .then(data => { setDeliveries(data.livraisons || []); setStats(data.stats || null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const baseList = filter === 'all' ? deliveries : deliveries.filter(d => d.statut_livraison === filter)
  const filtered = search.trim()
    ? baseList.filter(d => {
        const q = search.toLowerCase().trim()
        const cmd = d.commande
        const id = String(cmd?.id_commande || '')
        const clientName = ((cmd?.client?.utilisateur?.prenom || '') + ' ' + (cmd?.client?.utilisateur?.nom || '')).toLowerCase()
        const address = (cmd?.client?.adresse_livraison || '').toLowerCase()
        const products = (cmd?.detailsCommande || []).map(dt => (dt.produit?.nom || '').toLowerCase()).join(' ')
        const vendorName = (cmd?.detailsCommande || []).map(dt => (dt.produit?.vendeur?.nom_etablissement || '').toLowerCase()).join(' ')
        const marketName = (cmd?.detailsCommande || []).map(dt => (dt.produit?.vendeur?.localisation_marche || '').toLowerCase()).join(' ')
        return id.includes(q) || clientName.includes(q) || address.includes(q) || products.includes(q) || vendorName.includes(q) || marketName.includes(q)
      })
    : baseList
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

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D1A10 0%, #121011 100%)' : 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">Historique</div>
          </div>
        </div>
      </div>

      {/* STATS */}
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

      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher par client, n° commande, produit, marché..."
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
        {filtered.length === 0 && (
          <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
            {search.trim() ? `Aucun résultat pour "${search}"` : 'Aucune livraison trouvée.'}
            {search.trim() && (
              <button onClick={() => setSearch('')}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                Effacer la recherche
              </button>
            )}
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
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {clientName}
                    {cmd?.date_creation && ` · Créée le ${new Date(cmd.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                  </div>
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
                  <div className="font-black" style={{ color: 'var(--text-primary)' }}>{((cmd?.total_marchandises || 0) + (cmd?.frais_livraison || 0)).toLocaleString()} F</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{cmd?.detailsCommande?.reduce((sum, d) => sum + (d.quantite_commandee || 0), 0) || 0} article(s)</div>
                </div>
              </div>
              {d.frais_retour_calcules > 0 && (
                <div className="rounded-xl px-4 py-2 text-xs mb-2"
                  style={{ background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' }}>
                  <Undo2 size={12} className="inline align-middle" /> Frais retour : {d.frais_retour_calcules.toLocaleString()} F
                </div>
              )}
              <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Prise en charge : {d.date_prise_en_charge ? new Date(d.date_prise_en_charge).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                <span>Fin : {d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
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
