import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react'

const PAGE_SIZE = 10

export default function RetourVendeur() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [retours, setRetours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('tous')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchReturns()
  }, [])

  async function fetchReturns() {
    try {
      setLoading(true)
      const data = await api.get('/vendor/returns')
      setRetours(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function marquerRecupere(retour) {
    try {
      setUpdating(retour.id)
      await api.put(`/vendor/returns/${retour.id_commande}/${retour.id_produit}/recover`)
      setRetours((prev) => prev.map((r) =>
        r.id === retour.id ? { ...r, statut: 'recupere' } : r
      ))
    } catch (err) {
      console.error('Erreur récupération:', err.message)
    } finally {
      setUpdating(null)
    }
  }

  const STATUT_STYLE = {
    a_recuperer: { label: 'À récupérer', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    recupere: { label: 'Récupéré', bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
  }

  const filtres = {
    tous: retours,
    a_recuperer: retours.filter((r) => r.statut === 'a_recuperer'),
    recupere: retours.filter((r) => r.statut === 'recupere'),
  }

  const liste = filtres[filtre] || retours
  const visibleItems = liste.slice(0, visibleCount)
  const hasMore = visibleCount < liste.length
  const totalRetours = retours.length
  const totalPertes = retours.reduce((sum, r) => sum + r.perte, 0)
  const enAttente = filtres.a_recuperer.length

  if (loading) {
    return (
    <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-4xl">
        <div className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="h-3 rounded w-16 mb-2" style={{ background: 'var(--border)' }} /><div className="h-7 rounded w-12" style={{ background: 'var(--border)' }} /></div>
            <div><div className="h-3 rounded w-20 mb-2" style={{ background: 'var(--border)' }} /><div className="h-7 rounded w-20" style={{ background: 'var(--border)' }} /></div>
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl h-48 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex justify-center mb-3"><AlertTriangle size={40} style={{ color: '#E24B4A' }} /></div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
          <button onClick={fetchReturns}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#BA7517', color: '#fff' }}>
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #3D2A10 0%, #121110 100%)' : 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">Retours</div>
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Retours</div>
            <div className="font-black text-2xl" style={{ color: 'var(--text-primary)' }}>{totalRetours}</div>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Pertes estimées</div>
            <div className="font-black text-2xl" style={{ color: '#D85A30' }}>{totalPertes.toLocaleString()} F</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tous', label: `Tous (${totalRetours})` },
          { id: 'a_recuperer', label: `À récupérer (${enAttente})` },
          { id: 'recupere', label: `Récupérés (${filtres.recupere.length})` },
        ].map((item) => (
          <button key={item.id} onClick={() => { setFiltre(item.id); setVisibleCount(PAGE_SIZE) }}
            className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer"
            style={{
              background: filtre === item.id ? '#BA7517' : 'var(--surface)',
              color: filtre === item.id ? '#fff' : 'var(--text-secondary)',
              border: `1.5px solid ${filtre === item.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            {item.label}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex justify-center mb-3"><CheckCircle size={48} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>
            Aucun retour à afficher dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleItems.map((retour) => {
            const st = STATUT_STYLE[retour.statut] || STATUT_STYLE.a_recuperer
            const isUpdating = updating === retour.id
            return (
              <div key={retour.id} className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>

                <div className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Retour #{retour.id_commande}-{retour.id_produit}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Commande #{retour.commandeId} · {retour.date}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Produit</div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{retour.produit}</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Quantité</div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                        {retour.qte} {retour.unite}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Motif du rejet</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{retour.motif}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Client</div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{retour.client}</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Lieu de retour</div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{retour.lieu}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Perte estimée</div>
                      <div className="font-black text-sm" style={{ color: '#D85A30' }}>{retour.perte.toLocaleString()} F</div>
                    </div>
                    {retour.statut === 'a_recuperer' ? (
                      <button onClick={() => marquerRecupere(retour)}
                        disabled={isUpdating}
                        className="px-4 py-3 rounded-2xl text-sm font-black cursor-pointer"
                        style={{
                          background: isUpdating ? '#999' : '#BA7517',
                          color: '#fff',
                          border: 'none',
                          opacity: isUpdating ? 0.7 : 1,
                        }}>
                        {isUpdating ? '...' : 'Marquer récupéré'}
                      </button>
                    ) : (
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: isDark ? '#34D399' : '#0F6E56' }}><CheckCircle size={12} /> Récupération confirmée</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
          <ChevronDown size={14} /> Charger plus ({liste.length - visibleCount} restant{liste.length - visibleCount > 1 ? 's' : ''})
        </button>
      )}

    </div>
  )
}
