import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Données statiques (remplacer par API) ───────────────── */
const COMMANDES = [
  {
    id: 1042,
    heure: '09:32',
    statut_collecte: 'en_attente',
    livreur: { nom: 'Rodrigue K.', telephone: '+22997000002' },
    photo_collecte: false,
    code_correct: 'K7-4X',
    articles: [
      { id: 101, emoji: '🍅', nom: 'Tomates fraîches',  qte: 2, prix: 250,  unite: 'kg'  },
      { id: 103, emoji: '🥬', nom: 'Gombo frais',       qte: 1, prix: 300,  unite: 'tas' },
    ],
  },
  {
    id: 1041,
    heure: '08:15',
    statut_collecte: 'en_attente',
    livreur: { nom: 'Kofi A.', telephone: '+22997000004' },
    photo_collecte: true,
    code_correct: 'M3-2Z',
    articles: [
      { id: 101, emoji: '🍅', nom: 'Tomates fraîches', qte: 3, prix: 250, unite: 'kg' },
    ],
  },
  {
    id: 1039,
    heure: 'Hier',
    statut_collecte: 'collecte',
    livreur: { nom: 'Rodrigue K.', telephone: '+22997000002' },
    photo_collecte: true,
    code_correct: 'P9-1T',
    articles: [
      { id: 103, emoji: '🥬', nom: 'Gombo frais', qte: 2, prix: 300, unite: 'tas' },
      { id: 104, emoji: '🌶️', nom: 'Piments',     qte: 1, prix: 150, unite: 'tas' },
    ],
  },
]

const STATUT_STYLE = {
  en_attente: { label: 'En attente livreur', bg: '#FAEEDA', color: '#854F0B' },
  code_saisi: { label: 'Code en cours',      bg: '#E6F1FB', color: '#185FA5' },
  collecte:   { label: 'Collecté ✓',         bg: '#E1F5EE', color: '#0F6E56' },
}

export default function CommandesVendeur() {
  const navigate = useNavigate()
  const [codes,    setCodes]    = useState({})   // { cmdId: valeur saisie }
  const [confirmes, setConfirmes] = useState({}) // { cmdId: true }
  const [errCodes, setErrCodes] = useState({})   // { cmdId: message erreur }
  const [filtre,   setFiltre]   = useState('tous')

  const filtres = {
    tous:       COMMANDES,
    en_attente: COMMANDES.filter((c) => c.statut_collecte === 'en_attente'),
    collecte:   COMMANDES.filter((c) => c.statut_collecte === 'collecte' || confirmes[c.id]),
  }

  const liste = filtres[filtre] || COMMANDES

  function confirmerRemise(cmd) {
    const code = codes[cmd.id]?.trim().toUpperCase()
    if (!code) {
      setErrCodes((p) => ({ ...p, [cmd.id]: 'Saisissez le code du livreur' }))
      return
    }
    if (code !== cmd.code_correct) {
      setErrCodes((p) => ({ ...p, [cmd.id]: 'Code incorrect. Demandez au livreur de vérifier.' }))
      return
    }
    if (!cmd.photo_collecte) {
      setErrCodes((p) => ({ ...p, [cmd.id]: 'Attendez que le livreur prenne la photo.' }))
      return
    }
    setErrCodes((p) => ({ ...p, [cmd.id]: '' }))
    setConfirmes((p) => ({ ...p, [cmd.id]: true }))
    // TODO: PUT /api/vendeur/commandes/:id/confirmer-collecte { code }
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { id: 'tous',       label: 'Toutes' },
          { id: 'en_attente', label: 'En attente' },
          { id: 'collecte',   label: 'Collectées' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
            style={{
              background:  filtre === f.id ? '#BA7517' : '#fff',
              color:       filtre === f.id ? '#fff' : '#5F5E5A',
              border:      `1.5px solid ${filtre === f.id ? '#BA7517' : '#E8E6DF'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {liste.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-bold text-sm" style={{ color: '#888780' }}>
            Aucune commande dans cette catégorie
          </p>
        </div>
      )}

      {liste.map((cmd) => {
        const confirme   = confirmes[cmd.id]
        const collecte   = cmd.statut_collecte === 'collecte' || confirme
        const st         = collecte ? STATUT_STYLE.collecte : STATUT_STYLE.en_attente
        const codeSaisi  = codes[cmd.id]?.trim()
        const peutValider = codeSaisi && cmd.photo_collecte
        const total      = cmd.articles.reduce((s, a) => s + a.prix * a.qte, 0)

        return (
          <div key={cmd.id} className="rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              border: `1.5px solid ${collecte ? '#9FE1CB' : '#E8E6DF'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>

            {/* En-tête commande */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: collecte ? '#E1F5EE' : '#F7F8F3', borderBottom: '1px solid #E8E6DF' }}>
              <div>
                <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                  Commande #{cmd.id}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                  {cmd.heure} · Livreur: {cmd.livreur.nom}
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>

            {/* Articles */}
            <div className="px-4 py-3 flex flex-col gap-2">
              {cmd.articles.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: '#FAFAF7' }}>
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-xs font-semibold flex-1" style={{ color: '#2C2C2A' }}>
                    {a.nom} × {a.qte} {a.unite}
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#BA7517' }}>
                    {(a.prix * a.qte).toLocaleString()} F
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-1 pt-1">
                <span className="text-xs font-semibold" style={{ color: '#888780' }}>Total commande</span>
                <span className="text-xs font-black" style={{ color: '#2C2C2A' }}>
                  {total.toLocaleString()} F
                </span>
              </div>
            </div>

            {/* Zone validation (uniquement si pas encore collecté) */}
            {!collecte && (
              <div className="px-4 pb-4 flex flex-col gap-3"
                style={{ borderTop: '1px solid #E8E6DF' }}>
                <div className="pt-3" />

                {/* Indicateur photo livreur */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ background: cmd.photo_collecte ? '#E1F5EE' : '#F7F8F3' }}>
                  <span className="text-xl flex-shrink-0">
                    {cmd.photo_collecte ? '📸' : '⏳'}
                  </span>
                  <div>
                    <div className="text-xs font-bold"
                      style={{ color: cmd.photo_collecte ? '#0F6E56' : '#888780' }}>
                      {cmd.photo_collecte
                        ? 'Photo de collecte prise par le livreur ✓'
                        : 'En attente de la photo du livreur…'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                      {cmd.photo_collecte
                        ? 'Vous pouvez maintenant valider la remise'
                        : 'Le livreur doit photographier les articles'}
                    </div>
                  </div>
                </div>

                {/* Saisie code */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold" style={{ color: '#5F5E5A' }}>
                    🔑 Code de vérification du livreur
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: K7-4X"
                    value={codes[cmd.id] || ''}
                    onChange={(e) => {
                      setCodes((p) => ({ ...p, [cmd.id]: e.target.value.toUpperCase() }))
                      setErrCodes((p) => ({ ...p, [cmd.id]: '' }))
                    }}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none tracking-widest"
                    style={{
                      background:   '#FAFAF7',
                      border:       `1.5px solid ${errCodes[cmd.id] ? '#E24B4A' : codeSaisi ? '#BA7517' : '#E8E6DF'}`,
                      color:        '#2C2C2A',
                      fontFamily:   'monospace',
                      letterSpacing: '4px',
                    }}
                  />
                  {errCodes[cmd.id] && (
                    <span className="text-xs font-semibold" style={{ color: '#E24B4A' }}>
                      ⚠ {errCodes[cmd.id]}
                    </span>
                  )}
                </div>

                {/* Bouton confirmer */}
                <button
                  onClick={() => confirmerRemise(cmd)}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-black transition-all"
                  style={{
                    background: peutValider ? '#BA7517' : '#D3D1C7',
                    border:     'none',
                    cursor:     peutValider ? 'pointer' : 'not-allowed',
                    boxShadow:  peutValider ? '0 4px 16px rgba(186,117,23,0.3)' : 'none',
                  }}>
                  {!codeSaisi
                    ? 'Saisissez le code pour valider'
                    : !cmd.photo_collecte
                    ? 'En attente de la photo du livreur'
                    : 'Confirmer la remise des articles →'}
                </button>
              </div>
            )}

            {/* Collecte confirmée */}
            {collecte && (
              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: '#E1F5EE' }}>
                  <span className="text-lg">✅</span>
                  <span className="text-xs font-black" style={{ color: '#0F6E56' }}>
                    Remise confirmée — Articles collectés par le livreur
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

    </div>
  )
}
