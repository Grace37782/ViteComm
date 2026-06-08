import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PRODUITS = [
  { id: 101, emoji: '🍅', nom: 'Tomates fraîches', unite: 'kg', prix_actuel: 250 },
  { id: 102, emoji: '🧅', nom: 'Oignons rouges', unite: 'kg', prix_actuel: 180 },
  { id: 103, emoji: '🥬', nom: 'Gombo frais', unite: 'tas', prix_actuel: 300 },
  { id: 104, emoji: '🌶️', nom: 'Piments frais', unite: 'tas', prix_actuel: 150 },
]

const HISTORIQUE_INIT = {
  101: [
    { id: 1, date: '01 juin 2026', ancien: 200, nouveau: 250 },
    { id: 2, date: '15 mai 2026', ancien: 220, nouveau: 200 },
    { id: 3, date: '01 mai 2026', ancien: 180, nouveau: 220 },
  ],
  102: [
    { id: 4, date: '20 mai 2026', ancien: 150, nouveau: 180 },
  ],
  103: [
    { id: 5, date: '25 mai 2026', ancien: 280, nouveau: 300 },
    { id: 6, date: '10 mai 2026', ancien: 250, nouveau: 280 },
  ],
  104: [],
}

export default function HistoriquePrix() {
  const navigate = useNavigate()
  const [produitSelectionne, setProduitSelectionne] = useState(null)
  const [modeModification, setModeModification] = useState(false)
  const [nouveauPrix, setNouveauPrix] = useState('')
  const [historique, setHistorique] = useState(HISTORIQUE_INIT)
  const [toast, setToast] = useState(null)

  const produit = PRODUITS.find((p) => p.id === produitSelectionne)
  const historiqueProduit = produitSelectionne ? (historique[produitSelectionne] || []) : []

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function enregistrerPrix() {
    if (!produit || !nouveauPrix || isNaN(+nouveauPrix) || +nouveauPrix <= 0) {
      return showToast('⚠️ Prix invalide', 'error')
    }
    const prix = +nouveauPrix
    if (prix === produit.prix_actuel) {
      return showToast('⚠️ Le prix est identique', 'error')
    }
    const now = new Date()
    const dateStr = `${now.getDate()} ${now.toLocaleString('fr', { month: 'long' })} ${now.getFullYear()}`
    setHistorique((prev) => ({
      ...prev,
      [produit.id]: [
        { id: Date.now(), date: dateStr, ancien: produit.prix_actuel, nouveau: prix },
        ...(prev[produit.id] || []),
      ],
    }))
    setModeModification(false)
    setNouveauPrix('')
    showToast('✅ Prix mis à jour !')
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toast.type === 'ok' ? 'var(--accent)' : '#D85A30' }}>
          {toast.msg}
        </div>
      )}

      {!produitSelectionne ? (
        <>
          <div>
            <div className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Historique des prix</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sélectionnez un produit pour voir son évolution de prix.</div>
          </div>

          <div className="flex flex-col gap-2">
            {PRODUITS.map((p) => {
              const nbEvents = (historique[p.id] || []).length
              return (
                <button key={p.id} onClick={() => setProduitSelectionne(p.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left cursor-pointer transition-all active:scale-98"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: 'var(--surface-alt)' }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {nbEvents} modification{nbEvents > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-sm" style={{ color: '#BA7517' }}>{p.prix_actuel.toLocaleString()} F/{p.unite}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>prix actuel</div>
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
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              ←
            </button>
            <div className="flex-1">
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                {produit?.emoji} {produit?.nom}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {historiqueProduit.length} modification{historiqueProduit.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-lg" style={{ color: '#BA7517' }}>
                {produit?.prix_actuel.toLocaleString()} F
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/{produit?.unite}</div>
            </div>
          </div>

          {!modeModification ? (
            <button onClick={() => setModeModification(true)}
              className="w-full py-3 rounded-2xl text-sm font-black cursor-pointer"
              style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
              ✏️ Modifier le prix
            </button>
          ) : (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--surface)', border: '2px solid #BA7517' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Nouveau prix ({produit?.unite})
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
                  style={{ background: '#BA7517', border: 'none' }}>
                  Enregistrer
                </button>
                <button onClick={() => { setModeModification(false); setNouveauPrix('') }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {historiqueProduit.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Aucune modification de prix enregistrée.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Évolution
              </div>
              {historiqueProduit.map((h) => {
                const diff = h.nouveau - h.ancien
                const hausse = diff > 0
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: hausse ? '#FAEEDA' : '#E1F5EE' }}>
                      {hausse ? '📈' : '📉'}
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
