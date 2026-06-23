import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { FileText, Download, ChevronDown, ArrowLeft, Receipt, Loader2, CheckCircle, Search, XCircle } from 'lucide-react'

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

const PAGE_SIZE = 10

export default function MesFactures() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const { t } = useLang()
  const isDark = resolved === 'dark'
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailFacture, setDetailFacture] = useState(null)
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/client/factures')
      .then(setFactures)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtres = {
    tous: factures,
    paye: factures.filter(f => f.statut_paiement === 'Paye'),
    attente: factures.filter(f => f.statut_paiement !== 'Paye'),
  }

  const baseList = filtres[filtre] || factures

  const liste = search.trim()
    ? baseList.filter(f => {
        const q = search.toLowerCase().trim()
        const id = String(f.id_facture)
        const cmdId = String(f.id_commande)
        const articles = (f.articles || []).map(a => (a.nom || '').toLowerCase()).join(' ')
        return id.includes(q) || cmdId.includes(q) || articles.includes(q)
      })
    : baseList

  const visibleItems = liste.slice(0, visibleCount)
  const hasMore = visibleCount < liste.length

  function downloadFacture(f) {
    const lines = [
      '═══════════════════════════════════════',
      '           VITECOMM — FACTURE',
      '═══════════════════════════════════════',
      '',
      `Facture #FAC-${String(f.id_facture).padStart(4, '0')}`,
      `Commande #${f.id_commande}`,
      `Date : ${new Date(f.date_emission).toLocaleDateString('fr-FR')}`,
      '',
      '───────── Articles ─────────',
      ...f.articles.map(a =>
        `  ${a.nom}  ×${a.quantite}  ${formatPrice(a.sous_total)}`
      ),
      '',
      '───────── Détails ─────────',
      `  Marchandises    : ${formatPrice(f.montant_marchandises)}`,
      `  Livraison       : ${formatPrice(f.montant_frais_livraison)}`,
      `  Frais retour    : ${formatPrice(f.montant_frais_retour)}`,
      `  Commission      : ${formatPrice(f.montant_commission)}`,
      '─────────────────────────────',
      `  TOTAL DU        : ${formatPrice(f.montant_total_du)}`,
      '',
    ]
    if (f.paiement) {
      lines.push(
        '───────── Paiement ─────────',
        `  Montant reçu    : ${formatPrice(f.paiement.montant_percu)}`,
        `  Mode            : ${f.paiement.mode_reglement}`,
        `  Référence       : ${f.paiement.reference_transaction}`,
        `  Statut          : ${f.paiement.statut}`,
        `  Date            : ${new Date(f.paiement.date_paiement).toLocaleString('fr-FR')}`,
        '',
      )
    }
    lines.push('═══════════════════════════════════════', '  Merci pour votre achat sur ViteComm', '═══════════════════════════════════════')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-FAC-${String(f.id_facture).padStart(4, '0')}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen font-sans flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('invoice.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div>
            <div className="text-white font-black text-base">{t('invoice.title')}</div>
            <div className="text-white/70 text-xs">{t('invoice.count', { count: factures.length })}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {!detailFacture ? (
          <>
            {/* TABS */}
            <div className="flex gap-2">
              {[
                { id: 'tous', label: t('invoice.filter.all') },
                { id: 'paye', label: t('invoice.filter.paid') },
                { id: 'attente', label: t('invoice.filter.pending') },
              ].map(ft => (
                <button key={ft.id} onClick={() => { setFiltre(ft.id); setVisibleCount(PAGE_SIZE) }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                  style={{
                    background: filtre === ft.id ? '#1D9E75' : 'var(--surface)',
                    color: filtre === ft.id ? '#fff' : 'var(--text-secondary)',
                    border: `1.5px solid ${filtre === ft.id ? '#1D9E75' : 'var(--border)'}`,
                  }}>
                  {ft.label}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={t('invoice.search')}
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

            {factures.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <Receipt size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{t('invoice.empty')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('invoice.emptyDesc')}</p>
              </div>
            ) : liste.length === 0 ? (
              <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
                {search.trim() ? `${t('common.noResults')} "${search}"` : t('invoice.noResultsInCategory')}
                {search.trim() && (
                  <button onClick={() => setSearch('')} className="block mx-auto mt-2 text-xs font-bold cursor-pointer" style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                    {t('common.clearSearch')}
                  </button>
                )}
              </div>
            ) : (
              visibleItems.map((f) => {
                const isPaid = f.statut_paiement === 'Paye'
                return (
                  <button key={f.id_facture} onClick={() => setDetailFacture(f)}
                    className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all active:scale-98"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>FAC-{String(f.id_facture).padStart(4, '0')}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('invoice.order')} #{f.id_commande}</div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: isPaid ? (isDark ? 'rgba(45,196,145,0.15)' : '#E1F5EE') : (isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA'),
                          color: isPaid ? (isDark ? '#34D399' : '#0F6E56') : (isDark ? '#F3A83B' : '#854F0B'),
                        }}>
                        {isPaid ? <><CheckCircle size={12} className="inline" /> {t('invoice.paid')}</> : <><Loader2 size={12} className="inline" /> {t('invoice.pending')}</>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')} · {f.articles.length} {t('common.items')}</span>
                      <span className="font-black text-sm" style={{ color: '#1D9E75' }}>{formatPrice(f.montant_total_du)}</span>
                    </div>
                  </button>
                )
              })
            )}

            {hasMore && (
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                <ChevronDown size={14} /> {t('common.loadMore')} ({liste.length - visibleCount} {t('common.remaining')}{liste.length - visibleCount > 1 ? 's' : ''})
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setDetailFacture(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <ArrowLeft size={14} style={{ color: 'var(--text-primary)' }} />
              </button>
              <div className="flex-1">
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>FAC-{String(detailFacture.id_facture).padStart(4, '0')}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('invoice.order')} #{detailFacture.id_commande}</div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('invoice.articles')}</div>
              </div>
              <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {detailFacture.articles.map((a, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{a.nom} ×{a.quantite}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(a.sous_total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>{t('invoice.financialDetail')}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{t('invoice.merchandise')}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatPrice(detailFacture.montant_marchandises)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{t('invoice.deliveryFees')}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatPrice(detailFacture.montant_frais_livraison)}</span>
                </div>
                {detailFacture.montant_frais_retour > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{t('invoice.returnFees')}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatPrice(detailFacture.montant_frais_retour)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{t('order.total')}</span>
                  <span style={{ color: '#1D9E75' }}>{formatPrice(detailFacture.montant_total_du)}</span>
                </div>
              </div>
            </div>

            {detailFacture.paiement && (
              <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : '#E1F5EE', border: `1.5px solid ${isDark ? 'rgba(45,196,145,0.3)' : '#9FE1CB'}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: '#1D9E75' }} />
                  <div className="text-xs font-black" style={{ color: '#0F6E56' }}>{t('invoice.paymentReceived')}</div>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: '#0F6E56' }}>{t('invoice.mode')}</span>
                    <span className="font-bold" style={{ color: '#0F6E56' }}>{detailFacture.paiement.mode_reglement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#0F6E56' }}>{t('invoice.amountReceived')}</span>
                    <span className="font-bold" style={{ color: '#0F6E56' }}>{formatPrice(detailFacture.paiement.montant_percu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#0F6E56' }}>Réf</span>
                    <span className="font-bold" style={{ color: '#0F6E56' }}>{detailFacture.paiement.reference_transaction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#0F6E56' }}>{t('order.date')}</span>
                    <span className="font-bold" style={{ color: '#0F6E56' }}>{new Date(detailFacture.paiement.date_paiement).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => downloadFacture(detailFacture)}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2"
              style={{ background: '#1D9E75', border: 'none' }}>
              <Download size={16} /> {t('invoice.download')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
