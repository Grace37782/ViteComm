import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useLang } from '../../context/LangContext'
import { AlertTriangle, CheckCircle, XCircle, BarChart3, Pencil, TrendingUp, TrendingDown, Package } from 'lucide-react'

export default function HistoriquePrix() {
  const { t } = useLang()
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [produitSelectionne, setProduitSelectionne] = useState(null)
  const [modeModification, setModeModification] = useState(false)
  const [nouveauPrix, setNouveauPrix] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/vendor/price-history')
      .then(setProduits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const produit = produits.find((p) => p.id === produitSelectionne)
  const historiqueProduit = produit?.historique || []

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function enregistrerPrix() {
    if (!produit || !nouveauPrix || isNaN(+nouveauPrix) || +nouveauPrix <= 0) {
      return showToast(<><AlertTriangle size={14} className="inline" /> {t('vendor.historique.prixInvalide')}</>, 'error')
    }
    const prix = +nouveauPrix
    if (prix === produit.prix_actuel) {
      return showToast(<><AlertTriangle size={14} className="inline" /> {t('vendor.historique.prixIdentique')}</>, 'error')
    }
    try {
      await api.put(`/vendor/products/${produit.id}`, { prix })
      const updated = await api.get('/vendor/price-history')
      setProduits(updated)
      setModeModification(false)
      setNouveauPrix('')
      showToast(<><CheckCircle size={14} className="inline" /> {t('vendor.historique.prixMisAJour')}</>)
    } catch (e) {
      showToast(<><XCircle size={14} className="inline" /> {e.message}</>, 'error')
    }
  }

  if (loading) {
    return (
    <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-4xl">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />)}
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

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? '#BA7517' : '#D85A30' }}>
          {toast.msg}
        </div>
      )}

      {!produitSelectionne ? (
        <>
          <div>
            <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{t('vendor.historique.titre')}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vendor.historique.sousTitre')}</div>
          </div>

          <div className="flex flex-col gap-2">
            {produits.map((p) => {
              const nbEvents = p.historique?.length || 0
              return (
                <button key={p.id} onClick={() => setProduitSelectionne(p.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left cursor-pointer transition-all active:scale-98"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--surface-alt)' }}><Package size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {nbEvents} {t('vendor.historique.modification')}{nbEvents > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-sm" style={{ color: '#BA7517' }}>{p.prix_actuel.toLocaleString()} F/{p.unite}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('vendor.historique.prixActuel')}</div>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => { setProduitSelectionne(null); setModeModification(false); setNouveauPrix('') }}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>←</button>
            <div className="flex-1">
              <div className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Package size={20} /> {produit?.nom}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {historiqueProduit.length} {t('vendor.historique.modification')}{historiqueProduit.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-lg" style={{ color: '#BA7517' }}>{produit?.prix_actuel.toLocaleString()} F</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/{produit?.unite}</div>
            </div>
          </div>

          {!modeModification ? (
            <button onClick={() => setModeModification(true)}
              className="w-full py-3 rounded-2xl text-sm font-black cursor-pointer"
              style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
              <Pencil size={16} className="inline" /> {t('vendor.historique.modifierPrix')}
            </button>
          ) : (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--surface)', border: '2px solid #BA7517' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {t('vendor.historique.nouveauPrix')} ({produit?.unite})
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={nouveauPrix} onChange={(e) => setNouveauPrix(e.target.value)}
                  placeholder={produit?.prix_actuel.toString()}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-black outline-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>F</span>
              </div>
              <div className="flex gap-2">
                <button onClick={enregistrerPrix}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-black cursor-pointer"
                  style={{ background: '#BA7517', border: 'none' }}>{t('common.save')}</button>
                <button onClick={() => { setModeModification(false); setNouveauPrix('') }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {historiqueProduit.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3"><BarChart3 size={48} style={{ color: 'var(--text-muted)' }} /></div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{t('vendor.historique.aucuneModification')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('vendor.historique.evolution')}</div>
              {historiqueProduit.map((h) => {
                const diff = h.nouveau - h.ancien
                const hausse = diff > 0
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: hausse ? '#FAEEDA' : '#E1F5EE' }}>
                      {hausse ? <TrendingUp size={20} style={{ color: '#854F0B' }} /> : <TrendingDown size={20} style={{ color: '#0F6E56' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold line-through" style={{ color: 'var(--text-muted)' }}>
                          {h.ancien.toLocaleString()} F
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                          {h.nouveau.toLocaleString()} F
                        </span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{h.date}</div>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: hausse ? '#FAEEDA' : '#E1F5EE', color: hausse ? '#854F0B' : '#0F6E56' }}>
                      {hausse ? '+' : ''}{diff.toLocaleString()} F
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
