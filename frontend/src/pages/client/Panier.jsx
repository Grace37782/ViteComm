import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/client/BottomNav'

/* ── Données statiques panier (remplacer par contexte/API) ── */
const PANIER_INIT = {
  101: { id: 101, emoji: '🍅', nom: 'Tomates fraîches',  prix: 250,  unite: 'kg',    qte: 2, stock: 7,  etalId: 1, etalNom: 'Étal Maman Adjoua' },
  201: { id: 201, emoji: '🐟', nom: 'Poisson capitaine', prix: 1800, unite: 'kg',    qte: 1, stock: 3,  etalId: 2, etalNom: 'Étal Brice Poisson' },
  103: { id: 103, emoji: '🥬', nom: 'Gombo frais',       prix: 300,  unite: 'tas',   qte: 1, stock: 5,  etalId: 1, etalNom: 'Étal Maman Adjoua' },
}

const FRAIS_LIVRAISON = 450
const COMMISSION      = 0.006 // 0.6%

export default function Panier() {
  const navigate = useNavigate()
  const [panier, setPanier] = useState(PANIER_INIT)
  const [adresse, setAdresse] = useState('')
  const [note, setNote]       = useState('')

  /* ── Calculs ─────────────────────────────────────────── */
  const articles     = Object.values(panier)
  const panierCount  = articles.reduce((s, p) => s + p.qte, 0)
  const sousTotal    = articles.reduce((s, p) => s + p.prix * p.qte, 0)
  const commission   = Math.round(sousTotal * COMMISSION)
  const total        = sousTotal + FRAIS_LIVRAISON

  // Grouper par étal
  const parEtal = articles.reduce((acc, p) => {
    if (!acc[p.etalId]) acc[p.etalId] = { nom: p.etalNom, items: [] }
    acc[p.etalId].items.push(p)
    return acc
  }, {})

  /* ── Actions ─────────────────────────────────────────── */
  function modifier(id, delta) {
    setPanier((prev) => {
      const p = prev[id]
      if (!p) return prev
      // Bloquer si on dépasse le stock disponible (RG01)
      if (delta > 0 && p.qte >= p.stock) return prev
      if (p.qte + delta <= 0) {
        const n = { ...prev }
        delete n[id]
        return n
      }
      return { ...prev, [id]: { ...p, qte: p.qte + delta } }
    })
  }

  function supprimer(id) {
    setPanier((prev) => {
      const n = { ...prev }
      delete n[id]
      return n
    })
  }

  function viderPanier() {
    setPanier({})
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/catalogue')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base leading-tight">Mon panier</div>
            <div className="text-white/70 text-xs">
              {panierCount} article{panierCount > 1 ? 's' : ''} · {Object.keys(parEtal).length} étal{Object.keys(parEtal).length > 1 ? 's' : ''}
            </div>
          </div>
          {panierCount > 0 && (
            <button
              onClick={viderPanier}
              className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Vider
            </button>
          )}
        </div>
      </div>

      {/* ══ PANIER VIDE ══ */}
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-black text-lg mb-2" style={{ color: '#2C2C2A' }}>Votre panier est vide</h2>
          <p className="text-sm mb-6" style={{ color: '#888780' }}>
            Ajoutez des produits depuis les catalogues des marchés.
          </p>
          <button
            onClick={() => navigate('/client/accueil')}
            className="px-6 py-3 rounded-2xl text-white font-black cursor-pointer"
            style={{ background: '#1D9E75', border: 'none' }}
          >
            Explorer les marchés →
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* ══ ARTICLES PAR ÉTAL ══ */}
          {Object.entries(parEtal).map(([etalId, etal]) => (
            <div
              key={etalId}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1.5px solid #E8E6DF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              {/* En-tête étal */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: '#F7F8F3', borderBottom: '1px solid #E8E6DF' }}
              >
                <span className="text-lg">🏪</span>
                <span className="font-black text-sm flex-1" style={{ color: '#2C2C2A' }}>{etal.nom}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#E1F5EE', color: '#0F6E56' }}
                >
                  {etal.items.length} article{etal.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Articles */}
              <div className="flex flex-col divide-y" style={{ borderColor: '#F1EFE8' }}>
                {etal.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Emoji */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: '#F7F8F3' }}
                    >
                      {item.emoji}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: '#2C2C2A' }}>
                        {item.nom}
                      </div>
                      <div className="text-xs font-medium" style={{ color: '#1D9E75' }}>
                        {item.prix.toLocaleString()} F/{item.unite}
                      </div>
                    </div>

                    {/* Compteur */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => modifier(item.id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-black cursor-pointer text-sm"
                          style={{ background: '#F1EFE8', border: 'none', color: '#5F5E5A' }}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-black text-sm" style={{ color: '#2C2C2A' }}>
                          {item.qte}
                        </span>
                        <button
                          onClick={() => modifier(item.id, +1)}
                          disabled={item.qte >= item.stock}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
                          style={{
                            background: item.qte >= item.stock ? '#D3D1C7' : '#1D9E75',
                            border: 'none',
                            color: '#fff',
                            cursor: item.qte >= item.stock ? 'not-allowed' : 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                      {item.qte >= item.stock && (
                        <span style={{ background: '#FAEEDA', color: '#854F0B', fontSize: 9, padding: '1px 5px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Max {item.stock}
                        </span>
                      )}
                    </div>

                    {/* Sous-total + supprimer */}
                    <div className="text-right ml-2 flex-shrink-0">
                      <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                        {(item.prix * item.qte).toLocaleString()} F
                      </div>
                      <button
                        onClick={() => supprimer(item.id)}
                        className="text-xs cursor-pointer mt-0.5"
                        style={{ color: '#E24B4A', background: 'none', border: 'none' }}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ══ ADRESSE DE LIVRAISON ══ */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📍</span>
              <h3 className="font-black text-sm" style={{ color: '#2C2C2A' }}>Adresse de livraison</h3>
            </div>
            <input
              type="text"
              placeholder="Ex: Akpakpa, Rue 14, Maison bleue…"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: '#FAFAF7',
                border: '1.5px solid #E8E6DF',
                color: '#2C2C2A',
              }}
            />
          </div>

          {/* ══ NOTE POUR LE LIVREUR ══ */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💬</span>
              <h3 className="font-black text-sm" style={{ color: '#2C2C2A' }}>Note pour le livreur</h3>
            </div>
            <textarea
              placeholder="Ex: Appeler à l'arrivée, portail vert…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: '#FAFAF7',
                border: '1.5px solid #E8E6DF',
                color: '#2C2C2A',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* ══ MODE DE PAIEMENT ══ */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#BA7517' }}
              >
                💵
              </div>
              <div>
                <div className="font-black text-sm" style={{ color: '#854F0B' }}>
                  Paiement à la livraison
                </div>
                <div className="text-xs" style={{ color: '#854F0B' }}>
                  Vous payez en espèces quand vous recevez vos articles
                </div>
              </div>
              <div
                className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#BA7517' }}
              >
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>
              </div>
            </div>
          </div>

          {/* ══ RÉCAPITULATIF ══ */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
          >
            <h3 className="font-black text-sm mb-3" style={{ color: '#2C2C2A' }}>Récapitulatif</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Sous-total ({panierCount} articles)</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{sousTotal.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Frais de livraison</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{FRAIS_LIVRAISON.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#888780' }}>Commission plateforme (0,6%)</span>
                <span className="font-semibold" style={{ color: '#2C2C2A' }}>{commission.toLocaleString()} F</span>
              </div>
              <div
                className="flex justify-between pt-2 mt-1"
                style={{ borderTop: '1.5px solid #E8E6DF' }}
              >
                <span className="font-black text-base" style={{ color: '#2C2C2A' }}>Total à payer</span>
                <span className="font-black text-base" style={{ color: '#1D9E75' }}>
                  {total.toLocaleString()} F
                </span>
              </div>
            </div>
          </div>

          {/* ══ BOUTON COMMANDER ══ */}
          <button
            onClick={() => navigate('/client/selection-livreur')}
            disabled={!adresse.trim()}
            className="w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all active:scale-98"
            style={{
              background: adresse.trim() ? '#1D9E75' : '#D3D1C7',
              border: 'none',
              boxShadow: adresse.trim() ? '0 6px 24px rgba(29,158,117,0.4)' : 'none',
            }}
          >
            {adresse.trim()
              ? `Choisir un livreur — ${total.toLocaleString()} F →`
              : 'Entrez votre adresse pour continuer'}
          </button>

          <p className="text-center text-xs pb-2" style={{ color: '#888780' }}>
            🔒 Paiement sécurisé · Vous inspectez avant de payer
          </p>

        </div>
      )}

      <BottomNav panierCount={panierCount} />
    </div>
  )
}