import { useState, useEffect } from 'react'
import { api } from '../../services/api'

export default function Statistiques() {
  const [onglet, setOnglet] = useState('apercu')
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/vendor/statistiques')
      .then(setProduits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalVendus = produits.reduce((s, p) => s + p.vendus, 0)
  const totalRejets = produits.reduce((s, p) => s + p.rejets, 0)
  const totalRevenu = produits.reduce((s, p) => s + p.revenu, 0)
  const tauxRejet = totalVendus > 0 ? ((totalRejets / totalVendus) * 100).toFixed(1) : 0

  const TOP_VENDUS = [...produits].sort((a, b) => b.vendus - a.vendus)
  const TOP_REJETES = [...produits].sort((a, b) => b.rejets - a.rejets)

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex gap-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-full w-24 animate-pulse" style={{ background: 'var(--border)' }} />)}</div>
        <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      <div className="flex gap-2">
        {[
          { id: 'apercu', label: '📊 Aperçu' },
          { id: 'vendus', label: '🏆 Top ventes' },
          { id: 'rejets', label: '⚠️ Top rejets' },
        ].map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
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

      {onglet === 'apercu' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total vendus', val: totalVendus, accent: '#1D9E75', sub: 'unités' },
              { label: 'Taux de rejet', val: `${tauxRejet}%`, accent: '#D85A30', sub: `${totalRejets} articles` },
              { label: 'Revenu brut', val: `${totalRevenu.toLocaleString()} F`, accent: '#BA7517', sub: 'tous produits' },
              { label: 'Produits actifs', val: produits.length, accent: 'var(--text-primary)', sub: 'en catalogue' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="font-black text-xl mt-1" style={{ color: s.accent }}>{s.val}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Détail par produit</div>
          {produits.map((p) => {
            const pctVentes = totalVendus > 0 ? (p.vendus / totalVendus * 100).toFixed(0) : 0
            return (
              <div key={p.id} className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'var(--surface-alt)' }}>{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Stock: {p.stock} {p.unite}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm" style={{ color: '#BA7517' }}>{p.revenu.toLocaleString()} F</div>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--surface-alt)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pctVentes}%`, background: '#BA7517' }} />
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{p.vendus} vendus ({pctVentes}%)</span>
                  <span>{p.rejets} rejeté{p.rejets > 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </>
      )}

      {onglet === 'vendus' && (
        <>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Produits classés par nombre de ventes.</div>
          {TOP_VENDUS.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: i === 0 ? '#FAEEDA' : 'var(--surface-alt)', color: i === 0 ? '#BA7517' : 'var(--text-muted)' }}>
                #{i + 1}
              </div>
              <span className="text-xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.revenu.toLocaleString()} F de revenu</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm" style={{ color: '#1D9E75' }}>{p.vendus}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vendus</div>
              </div>
            </div>
          ))}
        </>
      )}

      {onglet === 'rejets' && (
        <>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Produits classés par nombre de rejets.</div>
          {TOP_REJETES.map((p, i) => {
            const tauxRejetProd = p.vendus > 0 ? ((p.rejets / p.vendus) * 100).toFixed(1) : 0
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                  style={{ background: i === 0 ? '#FAECE7' : 'var(--surface-alt)', color: i === 0 ? '#D85A30' : 'var(--text-muted)' }}>
                  #{i + 1}
                </div>
                <span className="text-xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Taux: {tauxRejetProd}%</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm" style={{ color: '#D85A30' }}>{p.rejets}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>rejeté{p.rejets > 1 ? 's' : ''}</div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
