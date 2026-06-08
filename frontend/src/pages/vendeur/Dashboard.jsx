import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

/* ── Données statiques (remplacer par API) ───────────────── */
const VENDEUR = {
  prenom: 'Maman Adjoua',
  etal: 'Étal légumes',
  marche: 'Dantokpa',
}

const FINANCES = {
  revenu_brut:      45200,
  commission:       271,
  pertes_rejets:    3600,
  gains_nets:       41329,
}

const REPUTATION = {
  score:    4.8,
  nb_avis:  134,
  nb_commandes: 89,
}

const ALERTES_STOCK = [
  { id: 102, emoji: '🧅', nom: 'Oignons rouges', stock: 1 },
  { id: 104, emoji: '🌶️', nom: 'Piments frais',  stock: 2 },
]

const COMMANDES_RECENTES = [
  { id: 1042, heure: '09:32', articles: 3, total: 1110, statut: 'en_attente' },
  { id: 1041, heure: '08:15', articles: 2, total: 800,  statut: 'collecte'   },
  { id: 1039, heure: 'Hier',  articles: 4, total: 2200, statut: 'livre'      },
]

export default function DashboardVendeur() {
  const navigate = useNavigate()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const STATUT_STYLE = {
    en_attente: { label: 'En attente', bg: isDark ? 'rgba(186,117,23,0.15)' : '#FAEEDA', color: isDark ? '#F3A83B' : '#854F0B' },
    collecte:   { label: 'Collecté',   bg: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE', color: isDark ? '#34D399' : '#0F6E56' },
    livre:      { label: 'Livré',      bg: isDark ? 'rgba(59,130,246,0.15)' : '#E6F1FB', color: isDark ? '#60A5FA' : '#185FA5' },
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* ══ PROFIL & RÉPUTATION ══ */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: '#BA7517', color: '#fff' }}>
            {VENDEUR.prenom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
              {VENDEUR.prenom}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {VENDEUR.etal} · {VENDEUR.marche}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg" style={{ color: '#BA7517' }}>{REPUTATION.score}</span>
              <span className="text-sm">⭐</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{REPUTATION.nb_avis} avis</div>
          </div>
        </div>
      </div>

      {/* ══ BILAN FINANCIER ══ */}
      <div>
        <h2 className="font-black text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
          Bilan financier
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Revenu brut',     val: FINANCES.revenu_brut,    color: 'var(--text-primary)', bg: 'var(--surface)',    border: 'var(--border)' },
            { label: 'Gains nets',      val: FINANCES.gains_nets,     color: isDark ? '#2DC491' : '#0F6E56', bg: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', border: isDark ? '#2DC491' : '#9FE1CB' },
            { label: 'Commission 0,6%', val: -FINANCES.commission,    color: isDark ? '#E87D55' : '#D85A30', bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3' },
            { label: 'Pertes rejets',   val: -FINANCES.pertes_rejets, color: isDark ? '#E87D55' : '#D85A30', bg: isDark ? 'rgba(216,90,48,0.12)' : '#FAECE7', border: isDark ? '#D85A30' : '#F5C4B3' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
              <div className="font-black text-lg" style={{ color: s.color }}>
                {s.val < 0 ? '−' : ''}{Math.abs(s.val).toLocaleString()} F
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ALERTES STOCK ══ */}
      {ALERTES_STOCK.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{
            background: isDark ? 'rgba(186,117,23,0.12)' : '#FAEEDA',
            border: `1.5px solid ${isDark ? '#BA7517' : '#FAC775'}`,
          }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-black text-sm" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>
              Stock faible — action requise
            </h3>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {ALERTES_STOCK.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.55)' }}>
                <span className="text-xl">{a.emoji}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: isDark ? '#F3A83B' : '#854F0B' }}>
                  {a.nom}
                </span>
                <span className="font-black text-xs px-2.5 py-1 rounded-full"
                  style={{ background: '#D85A30', color: '#fff' }}>
                  {a.stock} restant{a.stock > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/vendeur/catalogue')}
            className="w-full py-2.5 rounded-xl text-xs font-black cursor-pointer"
            style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
            Mettre à jour les stocks →
          </button>
        </div>
      )}

      {/* ══ COMMANDES RÉCENTES ══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
            Commandes récentes
          </h2>
          <button onClick={() => navigate('/vendeur/commandes')}
            className="text-xs font-semibold cursor-pointer"
            style={{ color: '#BA7517', background: 'none', border: 'none' }}>
            Voir tout →
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {COMMANDES_RECENTES.map((c) => {
            const st = STATUT_STYLE[c.statut]
            return (
              <button key={c.id}
                onClick={() => navigate('/vendeur/commandes')}
                className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all active:scale-98"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex-1">
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                    Commande #{c.id}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {c.heure} · {c.articles} articles
                  </div>
                </div>
                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  {c.total.toLocaleString()} F
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ ACTIONS RAPIDES ══ */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '📦', label: 'Mon catalogue', sub: 'Gérer mes produits',  route: '/vendeur/catalogue' },
          { icon: '🛒', label: 'Commandes',     sub: 'Gérer les remises',   route: '/vendeur/commandes' },
          { icon: '↩️', label: 'Retours',        sub: 'Articles rejetés',   route: '/vendeur/retours'   },
          { icon: '🚩', label: 'Signaler',       sub: 'Client ou livreur',  route: '/vendeur/signalement' },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.route)}
            className="rounded-2xl p-4 text-left cursor-pointer transition-all hover:shadow-md active:scale-98"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.sub}</div>
          </button>
        ))}
      </div>

    </div>
  )
}
