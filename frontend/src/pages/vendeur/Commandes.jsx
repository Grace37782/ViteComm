import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

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

export default function CommandesVendeur() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const [codes,    setCodes]    = useState({})
  const [confirmes, setConfirmes] = useState({})
  const [errCodes, setErrCodes] = useState({})
  const [filtre,   setFiltre]   = useState('tous')

  const STATUT_STYLE = {
    en_attente: { label: 'En attente livreur', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    code_saisi: { label: 'Code en cours',      bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
    collecte:   { label: 'Collecté ✓',         bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
  }

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
              background:  filtre === f.id ? '#BA7517' : 'var(--surface)',
              color:       filtre === f.id ? '#fff' : 'var(--text-secondary)',
              border:      `1.5px solid ${filtre === f.id ? '#BA7517' : 'var(--border)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {liste.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
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
              background: 'var(--surface)',
              border: `1.5px solid ${collecte ? (isDark ? '#2DC491' : '#9FE1CB') : 'var(--border)'}`,
              boxShadow: 'var(--shadow)',
            }}>

            {/* En-tête commande */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{
                background: collecte ? (isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE') : 'var(--surface-alt)',
                borderBottom: '1px solid var(--border)',
              }}>
              <div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  Commande #{cmd.id}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
                  style={{ background: 'var(--surface-alt)' }}>
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
                    {a.nom} × {a.qte} {a.unite}
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#BA7517' }}>
                    {(a.prix * a.qte).toLocaleString()} F
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-1 pt-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total commande</span>
                <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                  {total.toLocaleString()} F
                </span>
              </div>
            </div>

            {/* Zone validation (uniquement si pas encore collecté) */}
            {!collecte && (
              <div className="px-4 pb-4 flex flex-col gap-3"
                style={{ borderTop: '1px solid var(--border)' }}>
                <div className="pt-3" />

                {/* Indicateur photo livreur */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ background: cmd.photo_collecte ? (isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE') : 'var(--surface-alt)' }}>
                  <span className="text-xl flex-shrink-0">
                    {cmd.photo_collecte ? '📸' : '⏳'}
                  </span>
                  <div>
                    <div className="text-xs font-bold"
                      style={{ color: cmd.photo_collecte ? (isDark ? '#34D399' : '#0F6E56') : 'var(--text-muted)' }}>
                      {cmd.photo_collecte
                        ? 'Photo de collecte prise par le livreur ✓'
                        : 'En attente de la photo du livreur…'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {cmd.photo_collecte
                        ? 'Vous pouvez maintenant valider la remise'
                        : 'Le livreur doit photographier les articles'}
                    </div>
                  </div>
                </div>

                {/* Saisie code */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
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
                      background:   'var(--surface-alt)',
                      border:       `1.5px solid ${errCodes[cmd.id] ? '#E24B4A' : codeSaisi ? '#BA7517' : 'var(--border)'}`,
                      color:        'var(--text-primary)',
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
                  className="w-full py-3.5 rounded-xl text-sm font-black transition-all"
                  style={{
                    background: peutValider ? '#BA7517' : (isDark ? 'var(--border)' : '#D3D1C7'),
                    border:     'none',
                    color:      peutValider ? '#fff' : (isDark ? 'var(--text-muted)' : '#7A7972'),
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
                  style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }}>
                  <span className="text-lg">✅</span>
                  <span className="text-xs font-black" style={{ color: isDark ? '#34D399' : '#0F6E56' }}>
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
