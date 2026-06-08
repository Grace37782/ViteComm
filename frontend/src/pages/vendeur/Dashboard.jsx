import { useNavigate } from 'react-router-dom'
import BottomNavVendeur from '../../components/vendeur/BottomNav'

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

const STATUT_STYLE = {
  en_attente: { label: 'En attente', bg: '#FAEEDA', color: '#854F0B' },
  collecte:   { label: 'Collecté',   bg: '#E1F5EE', color: '#0F6E56' },
  livre:      { label: 'Livré',      bg: '#E6F1FB', color: '#185FA5' },
}

export default function DashboardVendeur() {
  const navigate = useNavigate()

  return (
    <div className="w-full min-h-screen font-sans"
      style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-black text-lg leading-tight">
              Bonjour {VENDEUR.prenom} 👋
            </div>
            <div className="text-white/70 text-xs mt-0.5">
              {VENDEUR.etal} · {VENDEUR.marche}
            </div>
          </div>
          <button onClick={() => navigate('/profil')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            👤
          </button>
        </div>

        {/* Score réputation */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0"
            style={{ background: '#BA7517', color: '#fff' }}>
            {REPUTATION.score}
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-sm">Score de réputation</div>
            <div className="text-white/80 text-sm leading-none mt-0.5">
              {'⭐'.repeat(Math.round(REPUTATION.score))}
            </div>
            <div className="text-white/60 text-xs mt-0.5">{REPUTATION.nb_avis} avis clients</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-white font-black text-xl">{REPUTATION.nb_commandes}</div>
            <div className="text-white/60 text-xs">commandes</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ══ BILAN FINANCIER ══ */}
        <div>
          <h2 className="font-black text-sm mb-3" style={{ color: '#2C2C2A' }}>
            Bilan financier
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Revenu brut',     val: FINANCES.revenu_brut,    color: '#2C2C2A', bg: '#fff',    border: '#E8E6DF' },
              { label: 'Gains nets',      val: FINANCES.gains_nets,     color: '#1D9E75', bg: '#E1F5EE', border: '#9FE1CB' },
              { label: 'Commission 0,6%', val: -FINANCES.commission,    color: '#D85A30', bg: '#FAECE7', border: '#F5C4B3' },
              { label: 'Pertes rejets',   val: -FINANCES.pertes_rejets, color: '#D85A30', bg: '#FAECE7', border: '#F5C4B3' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4"
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#888780' }}>
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
            style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h3 className="font-black text-sm" style={{ color: '#854F0B' }}>
                Stock faible — action requise
              </h3>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {ALERTES_STOCK.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.55)' }}>
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: '#854F0B' }}>
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
            <h2 className="font-black text-sm" style={{ color: '#2C2C2A' }}>
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
                  style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                  <div className="flex-1">
                    <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
                      Commande #{c.id}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#888780' }}>
                      {c.heure} · {c.articles} articles
                    </div>
                  </div>
                  <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>
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
              style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>{a.label}</div>
              <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{a.sub}</div>
            </button>
          ))}
        </div>

      </div>

      <BottomNavVendeur />
    </div>
  )
}