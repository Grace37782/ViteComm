import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { AlertTriangle, CheckCircle, RefreshCw, Loader2, Receipt, ChevronDown } from 'lucide-react'

const PAGE_SIZE = 10

const STATUT_STYLE = {
  en_attente: { label: 'En attente', bg: '#FAEEDA', color: '#854F0B', icon: Loader2 },
  paye: { label: 'Payé', bg: '#E1F5EE', color: '#0F6E56', icon: CheckCircle },
  partiel: { label: 'Partiel', bg: '#E6F1FB', color: '#185FA5', icon: RefreshCw },
}

export default function Factures() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('tous')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get('/vendor/factures')
      .then(setFactures)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtres = {
    tous: factures,
    en_attente: factures.filter((f) => f.statut_paiement === 'en_attente'),
    paye: factures.filter((f) => f.statut_paiement === 'paye'),
  }

  const liste = filtres[filtre] || factures
  const visibleItems = liste.slice(0, visibleCount)
  const hasMore = visibleCount < liste.length
  const totalEnAttente = factures.filter((f) => f.statut_paiement === 'en_attente').reduce((s, f) => s + f.montant_total_du, 0)
  const totalPaye = factures.filter((f) => f.statut_paiement === 'paye').reduce((s, f) => s + (f.montant_recu || 0), 0)
  const totalCommission = factures.reduce((s, f) => s + f.commission, 0)

  const facture = factures.find((f) => f.id === detail)
  const stDetail = facture ? STATUT_STYLE[facture.statut_paiement] : null

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />)}</div>
        {[1, 2].map((i) => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex justify-center mb-3"><AlertTriangle size={48} style={{ color: '#E24B4A' }} /></div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {!detail ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'En attente', val: totalEnAttente, accent: '#BA7517' },
              { label: 'Encaissé', val: totalPaye, accent: '#1D9E75' },
              { label: 'Commissions', val: totalCommission, accent: '#D85A30' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="font-black text-lg" style={{ color: s.accent }}>{s.val.toLocaleString()} F</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {[
              { id: 'tous', label: 'Toutes' },
              { id: 'en_attente', label: 'En attente' },
              { id: 'paye', label: 'Payées' },
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

          {liste.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3"><Receipt size={48} style={{ color: 'var(--text-muted)' }} /></div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Aucune facture.</p>
            </div>
          ) : (
            visibleItems.map((f) => {
              const st = STATUT_STYLE[f.statut_paiement] || STATUT_STYLE.en_attente
              return (
                <button key={f.id} onClick={() => setDetail(f.id)}
                  className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all active:scale-98"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{f.id}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cmd #{f.commandeId} · {f.client}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      <st.icon size={12} className="inline" /> {st.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.date} · {f.articles.length} articles</span>
                    <span className="font-black text-sm" style={{ color: '#BA7517' }}>{f.montant_total_du.toLocaleString()} F</span>
                  </div>
                </button>
              )
            })
          )}

          {hasMore && (
            <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              <ChevronDown size={14} /> Charger plus ({liste.length - visibleCount} restant{liste.length - visibleCount > 1 ? 's' : ''})
            </button>
          )}
        </>
      ) : facture && (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setDetail(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>←</button>
            <div className="flex-1">
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{facture.id}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Commande #{facture.commandeId}</div>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: STATUT_STYLE[facture.statut_paiement]?.bg, color: STATUT_STYLE[facture.statut_paiement]?.color }}>
               {stDetail?.icon && <stDetail.icon size={12} />} {stDetail?.label}
            </span>
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Client</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{facture.client}</div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Date facture : {facture.date}</div>
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Articles</div>
            <div className="flex flex-col gap-2">
              {facture.articles.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-alt)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{a.nom} × {a.qte}</span>
                  <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{(a.prix * a.qte).toLocaleString()} F</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Détail financier</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Marchandises', val: facture.total_marchandises },
                { label: 'Frais livraison', val: facture.frais_livraison },
                { label: 'Commission (0,6%)', val: facture.commission, negative: true },
                ...(facture.frais_retour > 0 ? [{ label: 'Frais retour', val: facture.frais_retour, negative: true }] : []),
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
                  <span className="text-xs font-semibold" style={{ color: l.negative ? '#D85A30' : 'var(--text-primary)' }}>
                    {l.negative ? '−' : ''}{l.val.toLocaleString()} F
                  </span>
                </div>
              ))}
              <div className="h-px my-1" style={{ background: 'var(--border)' }} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Total dû</span>
                <span className="text-sm font-black" style={{ color: '#BA7517' }}>{facture.montant_total_du.toLocaleString()} F</span>
              </div>
            </div>
          </div>

          {facture.statut_paiement === 'paye' && (
            <div className="rounded-2xl p-4"
              style={{ background: '#E1F5EE', border: '1.5px solid #9FE1CB' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} style={{ color: '#0F6E56' }} />
                <div className="text-xs font-black" style={{ color: '#0F6E56' }}>Paiement reçu</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#0F6E56' }}>Mode</span>
                  <span className="font-bold" style={{ color: '#0F6E56' }}>{facture.mode_reglement}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#0F6E56' }}>Montant reçu</span>
                  <span className="font-bold" style={{ color: '#0F6E56' }}>{(facture.montant_recu || 0).toLocaleString()} F</span>
                </div>
                {facture.date_paiement && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#0F6E56' }}>Date</span>
                    <span className="font-bold" style={{ color: '#0F6E56' }}>{facture.date_paiement}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {facture.statut_paiement === 'en_attente' && (
            <div className="rounded-2xl p-4"
              style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}>
              <div className="flex items-center gap-2">
                <Loader2 size={20} style={{ color: '#854F0B' }} className="animate-spin" />
                <div className="text-xs font-bold" style={{ color: '#854F0B' }}>
                  Paiement en attente — le paiement sera effectué en ligne.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
