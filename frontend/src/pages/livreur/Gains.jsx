import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../services/api'
import { Wallet, Truck, Undo2, ClipboardList, Calendar, ChevronDown, Search, XCircle } from 'lucide-react'

const PAGE_SIZE = 10

export default function Gains() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { t } = useLang()
  const [gains, setGains] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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
      <div className="px-4 py-4 flex flex-col gap-4 ">
        <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        <div className="grid grid-cols-2 gap-3">{[1,2].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 ">

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5 -mx-4 -mt-4"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D1A10 0%, #121011 100%)' : 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">{t('livreur.gains.title')}</div>
            <div className="text-white/70 text-xs">{t('livreur.gains.earned', { amount: (gains?.total_gains ?? 0).toLocaleString() })}</div>
          </div>
        </div>
      </div>

      {/* TOTAL */}
      <div className="rounded-2xl p-6 text-center transition-all hover:shadow-md"
        style={{ background: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: `1.5px solid ${isDark ? '#D85A30' : '#F5C4B3'}` }}>
        <div className="mb-2 flex justify-center"><Wallet size={40} /></div>
        <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t('livreur.gains.totalEarnings')}</div>
        <div className="text-3xl font-black" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{(gains?.total_gains || 0).toLocaleString()} F</div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('livreur.gains.deliveriesCompleted', { count: gains?.nb_livraisons || 0 })}</div>
      </div>

      {/* BREAKDOWN */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
          style={{ background: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: `1.5px solid ${isDark ? '#2DC491' : '#9FE1CB'}` }}>
          <div className="mb-1"><Truck size={20} /></div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{t('livreur.gains.deliveries')}</div>
          <div className="font-black text-lg" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>{(gains?.total_livraisons || 0).toLocaleString()} F</div>
        </div>
        <div className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
          style={{ background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: `1.5px solid ${isDark ? '#BA7517' : '#FAC775'}` }}>
          <div className="mb-1"><Undo2 size={20} /></div>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{t('livreur.gains.returnFees')}</div>
          <div className="font-black text-lg" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>{(gains?.total_frais_retour || 0).toLocaleString()} F</div>
        </div>
      </div>

      {/* DETAIL LIST */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}><ClipboardList size={14} className="inline align-middle" /> {t('livreur.gains.detail')}</div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={t('livreur.gains.searchPlaceholder')}
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

      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        {(!gains?.livraisons || gains.livraisons.length === 0) && (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>{t('livreur.gains.noEarnings')}</div>
        )}
        {gains?.livraisons && gains.livraisons.length > 0 && (() => {
          const filtered = gains.livraisons.filter(d => {
            if (!search.trim()) return true
            const q = search.toLowerCase().trim()
            const id = String(d.id_commande || '')
            const client = (d.client || '').toLowerCase()
            return id.includes(q) || client.includes(q)
          })
          if (filtered.length === 0) {
            return (
              <div className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
                {search.trim() ? t('livreur.noResultsFor', { query: search }) : t('livreur.gains.noDeliveries')}
                {search.trim() && (
                  <button onClick={() => setSearch('')}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer block mx-auto"
                    style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                    {t('common.clearSearch')}
                  </button>
                )}
              </div>
            )
          }
          return filtered.slice(0, visibleCount).map(d => (
            <div key={d.id_livraison} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2 transition-all hover:shadow-sm"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('livreur.commandeNumber')}{d.id_commande}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.client} · {d.date ? new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{d.total.toLocaleString()} F</div>
                {d.frais_retour > 0 && (
                  <div className="text-[10px]" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>{t('livreur.gains.returnFeeItem', { amount: d.frais_retour.toLocaleString() })}</div>
                )}
              </div>
            </div>
          ))
        })()}
        {(() => {
          const filteredCount = (gains?.livraisons || []).filter(d => {
            if (!search.trim()) return true
            const q = search.toLowerCase().trim()
            return String(d.id_commande || '').includes(q) || (d.client || '').toLowerCase().includes(q)
          }).length
          return filteredCount > visibleCount ? (
            <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              <ChevronDown size={14} /> {t('common.loadMore')} ({filteredCount - visibleCount} {t('common.remaining')}{filteredCount - visibleCount > 1 ? 's' : ''})
            </button>
          ) : null
        })()}
      </div>

      {/* MONTHLY */}
      {Object.keys(monthlyData).length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}><Calendar size={14} className="inline align-middle" /> {t('livreur.gains.byMonth')}</div>
          {Object.entries(monthlyData).map(([month, data]) => (
            <div key={month} className="flex items-center justify-between rounded-xl px-4 py-3 mb-2 transition-all hover:shadow-sm"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
              <div>
                <div className="font-bold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{month}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{data.count} {t('livreur.gains.trips')}</div>
              </div>
              <div className="font-black text-sm" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>{data.gains.toLocaleString()} F</div>
            </div>
          ))}
        </div>
      )}


    </div>
  )
}
