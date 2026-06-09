import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'

export default function Gains() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [gains, setGains] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/livreur/gains')
      .then(data => setGains(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const monthlyData = {}
  ;(gains?.livraisons || []).forEach(d => {
    const key = d.date ? new Date(d.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) : 'Inconnu'
    if (!monthlyData[key]) monthlyData[key] = { count: 0, gains: 0 }
    monthlyData[key].count++
    monthlyData[key].gains += d.total
  })

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        <div className="grid grid-cols-2 gap-3">{[1,2].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* TOTAL */}
      <div className="rounded-2xl p-6 text-center transition-all hover:shadow-md"
        style={{ background: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: `1.5px solid ${isDark ? '#D85A30' : '#F5C4B3'}` }}>
        <div className="text-4xl mb-2">💰</div>
        <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Gains totaux</div>
        <div className="text-3xl font-black" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{(gains?.total_gains || 0).toLocaleString()} F</div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{gains?.nb_livraisons || 0} livraison(s) terminée(s)</div>
      </div>

      {/* BREAKDOWN */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
          style={{ background: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: `1.5px solid ${isDark ? '#2DC491' : '#9FE1CB'}` }}>
          <div className="text-lg mb-1">🚚</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Livraisons</div>
          <div className="font-black text-lg" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>{(gains?.total_livraisons || 0).toLocaleString()} F</div>
        </div>
        <div className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
          style={{ background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: `1.5px solid ${isDark ? '#BA7517' : '#FAC775'}` }}>
          <div className="text-lg mb-1">↩️</div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Frais retour</div>
          <div className="font-black text-lg" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>{(gains?.total_frais_retour || 0).toLocaleString()} F</div>
        </div>
      </div>

      {/* DETAIL LIST */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>📋 Détail des livraisons</div>
        {(!gains?.livraisons || gains.livraisons.length === 0) && (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>Aucun gain enregistré.</div>
        )}
        {gains?.livraisons?.map(d => (
          <div key={d.id_livraison} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2 transition-all hover:shadow-sm"
            style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{d.id_commande}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.client} · {d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-black text-sm" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{d.total.toLocaleString()} F</div>
              {d.frais_retour > 0 && (
                <div className="text-[10px]" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>+{d.frais_retour.toLocaleString()} F retour</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MONTHLY */}
      {Object.keys(monthlyData).length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>📅 Par mois</div>
          {Object.entries(monthlyData).map(([month, data]) => (
            <div key={month} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2 transition-all hover:shadow-sm"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
              <div>
                <div className="font-bold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{month}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{data.count} course(s)</div>
              </div>
              <div className="font-black text-sm" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{data.gains.toLocaleString()} F</div>
            </div>
          ))}
        </div>
      )}

      {/* INFO */}
      <div className="rounded-2xl p-4"
        style={{ background: isDark ? 'rgba(186,117,23,0.08)' : '#FAFAF7', border: `1.5px solid ${isDark ? '#3A3B38' : '#E8E6DF'}` }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>ℹ️ Calcul des gains (RG28)</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          • Forfait livraison : <strong>1 500 F</strong> par course<br />
          • Frais retour : <strong>500 F</strong> par produit rejeté (ajoutés)<br />
          • Créditation après finalisation (statut "Livrée")
        </div>
      </div>
    </div>
  )
}
