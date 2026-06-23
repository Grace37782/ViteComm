import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../services/api'
import { Undo2, Package, Truck, Store, Rocket, CheckCircle, ChevronDown, Search, XCircle } from 'lucide-react'

const PAGE_SIZE = 10

export default function RetourLivreur() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const { t } = useLang()
  const [retours, setRetours] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    api.get('/livreur/retours')
      .then(data => { setRetours(data.retours || []); setStats(data.stats || null) })
      .catch(e => showToast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function changerStatut(id_litige, current) {
    const next = current === 'a_recuperer' ? 'en_cours' : current === 'en_cours' ? 'recupere' : null
    if (!next) return
    try {
      await api.put(`/livreur/returns/${id_litige}`, { statut_retour: next })
      setRetours(prev => prev.map(r => r.id_litige === id_litige ? { ...r, statut_retour: next } : r))
      showToast(next === 'recupere' ? t('livreur.retours.recoveryComplete') : t('livreur.retours.statusUpdated'))
    } catch (e) { showToast(e.message) }
  }

  function statutStyle(statut) {
    const map = {
      a_recuperer: { label: t('livreur.retours.aRecuperer'), bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
      en_cours: { label: t('livreur.retours.enCours'), bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
      recupere: { label: t('livreur.retours.recupere'), bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
    }
    return map[statut] || map.a_recuperer
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4 ">
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}</div>
        <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
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
            <div className="text-white font-black text-base leading-tight">{t('nav.retours')}</div>
            <div className="text-white/70 text-xs">{retours?.length ?? 0} {t('livreur.retours.count')}</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl" style={{ background: '#D85A30' }}>
          {toast}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'total', label: t('livreur.retours.total'), value: stats?.total ?? 0, icon: <Undo2 size={20} />,
            bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3', color: isDark ? '#E87D55' : '#993C1D' },
          { key: 'a_recuperer', label: t('livreur.retours.aRecuperer'), value: stats?.a_recuperer ?? 0, icon: <Package size={20} />,
            bg: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA', border: isDark ? '#BA7517' : '#FAC775', color: isDark ? '#F3A83B' : '#854F0B' },
          { key: 'en_cours', label: t('livreur.retours.enCours'), value: stats?.en_cours ?? 0, icon: <Truck size={20} />,
            bg: isDark ? 'rgba(29,158,117,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB', color: isDark ? '#34D399' : '#0F6E56' },
        ].map(s => (
          <div key={s.key} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
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
          { id: 'all', labelKey: 'common.all' },
          { id: 'a_recuperer', labelKey: 'livreur.retours.aRecuperer' },
          { id: 'en_cours', labelKey: 'livreur.retours.enCours' },
          { id: 'recupere', labelKey: 'livreur.retours.recuperes' },
        ].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setVisibleCount(PAGE_SIZE) }}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all active:scale-95"
            style={{
              background: filter === f.id ? '#D85A30' : 'var(--surface)',
              color: filter === f.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${filter === f.id ? '#D85A30' : 'var(--border)'}`,
            }}>
            {t(f.labelKey)}
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
            placeholder={t('livreur.retours.searchPlaceholder')}
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

      {(() => {
        const baseList = filter === 'all' ? retours : retours.filter(r => r.statut_retour === filter)
        const filteredList = search.trim()
          ? baseList.filter(r => {
              const q = search.toLowerCase().trim()
              const id = String(r.id_commande || '')
              const client = (r.client || '').toLowerCase()
              const vendeur = (r.vendeur || '').toLowerCase()
              return id.includes(q) || client.includes(q) || vendeur.includes(q)
            })
          : baseList
        if (filteredList.length === 0 && retours.length === 0) {
          return (
            <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
              {t('livreur.retours.empty')}
            </div>
          )
        }
        if (filteredList.length === 0 && retours.length > 0) {
          return (
            <div className="text-center text-sm py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
              {search.trim() ? t('livreur.retours.noResultsFor', { search }) : t('livreur.retours.noReturnsCategory')}
              {search.trim() && (
                <button onClick={() => setSearch('')}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
                  {t('common.clearSearch')}
                </button>
              )}
            </div>
          )
        }
        return (
          <>
            {filteredList.slice(0, visibleCount).map(retour => {
              const st = statutStyle(retour.statut_retour)
              return (
                <div key={retour.id_litige} className="rounded-2xl p-4 transition-all hover:shadow-md active:scale-98"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('livreur.retours.returnLabel')}{retour.id_litige}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('livreur.retours.orderLabel')}{retour.id_commande} · {retour.client}</div>
                    </div>
                    <span className="rounded-2xl px-3 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Store size={12} className="inline align-middle" /> {t('livreur.retours.vendor')} {retour.vendeur}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="font-semibold">{t('livreur.retours.articles')}</div>
                      {retour.articles?.map((a, i) => (
                        <div key={i}>{a.nom} × {a.quantite}</div>
                      )) || <div>{t('livreur.retours.articleCount', { count: retour.qte })}</div>}
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="font-semibold">{t('livreur.retours.amount')}</div>
                      <div>{retour.montant?.toLocaleString()} F</div>
                    </div>
                  </div>

                  <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('livreur.retours.reason')} {retour.motif}</div>

                  {retour.statut_retour !== 'recupere' && (
                    <button onClick={() => changerStatut(retour.id_litige, retour.statut_retour)}
                      className="w-full rounded-2xl py-3 font-black text-white cursor-pointer transition-all active:scale-98"
                      style={{ background: '#D85A30', border: 'none' }}>
                      {retour.statut_retour === 'a_recuperer' ? <><Rocket size={14} className="inline align-middle" /> {t('livreur.retours.startRecovery')}</> : <><CheckCircle size={14} className="inline align-middle" /> {t('livreur.retours.markAsRecovered')}</>}
                    </button>
                  )}
                </div>
              )
            })}

            {filteredList.length > visibleCount && (
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                <ChevronDown size={14} /> {t('common.loadMore')} ({filteredList.length - visibleCount} {filteredList.length - visibleCount > 1 ? t('common.remainingPlural') : t('common.remainingSingular')})
              </button>
            )}
          </>
        )
      })()}
    </div>
  )
}
