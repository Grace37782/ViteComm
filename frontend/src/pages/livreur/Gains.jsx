import { useState, useEffect } from 'react'
import { api } from '../../services/api'

export default function Gains() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [dash, setDash] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/livreur/dashboard'),
      api.get('/livreur/deliveries'),
    ]).then(([d, del]) => {
      setDash(d)
      setDeliveries(del)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completed = deliveries.filter(d => d.statut_livraison === 'Livree')
  const totalGains = completed.reduce((acc, d) => acc + (d.commande?.frais_livraison || 0), 0)
  const totalReturns = completed.reduce((acc, d) => acc + (d.frais_retour_calcules || 0), 0)
  const netGains = totalGains + totalReturns

  const monthlyData = {}
  completed.forEach(d => {
    const key = d.date_fin_reelle ? new Date(d.date_fin_reelle).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }) : 'Inconnu'
    if (!monthlyData[key]) monthlyData[key] = { count: 0, gains: 0 }
    monthlyData[key].count++
    monthlyData[key].gains += (d.commande?.frais_livraison || 0) + (d.frais_retour_calcules || 0)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Chargement des gains…</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* TOTAL */}
      <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="text-4xl mb-2">💰</div>
        <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Gains totaux</div>
        <div className="text-3xl font-black" style={{ color: '#D85A30' }}>{netGains.toLocaleString()} F</div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {completed.length} livraison(s) terminée(s)
        </div>
      </div>

      {/* BREAKDOWN */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Livraisons</div>
          <div className="font-black text-lg" style={{ color: '#1D9E75' }}>{totalGains.toLocaleString()} F</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Frais retour</div>
          <div className="font-black text-lg" style={{ color: '#BA7517' }}>{totalReturns.toLocaleString()} F</div>
        </div>
      </div>

      {/* MONTHLY BREAKDOWN */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>📅 Détail par mois</div>
        {Object.keys(monthlyData).length === 0 && (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>Aucun gain enregistré.</div>
        )}
        {Object.entries(monthlyData).map(([month, data]) => (
          <div key={month} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div>
              <div className="font-bold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{month}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{data.count} course(s)</div>
            </div>
            <div className="font-black text-sm" style={{ color: '#D85A30' }}>{data.gains.toLocaleString()} F</div>
          </div>
        ))}
      </div>

      {/* RG28 INFO */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>ℹ️ Comment sont calculés vos gains ?</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          • Frais de livraison forfaitaire : <strong>1 500 F</strong> par course (RG28)<br />
          • Frais de retour : <strong>500 F</strong> par produit rejeté (ajoutés à votre gain)<br />
          • Les gains sont crédités après finalisation de la livraison (statut "Livrée")
        </div>
      </div>
    </div>
  )
}
