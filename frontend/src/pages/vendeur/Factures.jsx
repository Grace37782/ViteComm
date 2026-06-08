import { useState } from 'react'

const FACTURES_INIT = [
  {
    id: 'FAC-2026-0089',
    date: '07 juin 2026',
    commandeId: 1042,
    client: 'Mme Adja',
    articles: [
      { nom: 'Tomates fraîches', qte: 2, prix: 250 },
      { nom: 'Gombo frais', qte: 1, prix: 300 },
    ],
    total_marchandises: 800,
    frais_livraison: 1500,
    commission: 5,
    frais_retour: 360,
    montant_total_du: 1935,
    statut_paiement: 'en_attente',
    mode_reglement: null,
  },
  {
    id: 'FAC-2026-0085',
    date: '05 juin 2026',
    commandeId: 1039,
    client: 'M. Kofi',
    articles: [
      { nom: 'Gombo frais', qte: 2, prix: 300 },
      { nom: 'Piments frais', qte: 1, prix: 150 },
    ],
    total_marchandises: 750,
    frais_livraison: 1500,
    commission: 5,
    frais_retour: 0,
    montant_total_du: 2245,
    statut_paiement: 'paye',
    mode_reglement: 'ESPECES',
    date_paiement: '05 juin 2026',
    montant_recu: 2245,
  },
  {
    id: 'FAC-2026-0078',
    date: '01 juin 2026',
    commandeId: 1028,
    client: 'Mme Aïcha',
    articles: [
      { nom: 'Tomates fraîches', qte: 3, prix: 250 },
      { nom: 'Oignons rouges', qte: 2, prix: 180 },
    ],
    total_marchandises: 1110,
    frais_livraison: 1500,
    commission: 7,
    frais_retour: 150,
    montant_total_du: 2453,
    statut_paiement: 'paye',
    mode_reglement: 'ESPECES',
    date_paiement: '01 juin 2026',
    montant_recu: 2453,
  },
]

const STATUT_STYLE = {
  en_attente: { label: 'En attente', bg: '#FAEEDA', color: '#854F0B', icon: '⏳' },
  paye: { label: 'Payé', bg: '#E1F5EE', color: '#0F6E56', icon: '✅' },
  partiel: { label: 'Partiel', bg: '#E6F1FB', color: '#185FA5', icon: '🔄' },
}

export default function Factures() {
  const [factures, setFactures] = useState(FACTURES_INIT)
  const [filtre, setFiltre] = useState('tous')
  const [detail, setDetail] = useState(null)

  const filtres = {
    tous: factures,
    en_attente: factures.filter((f) => f.statut_paiement === 'en_attente'),
    paye: factures.filter((f) => f.statut_paiement === 'paye'),
  }

  const liste = filtres[filtre] || factures
  const totalEnAttente = factures.filter((f) => f.statut_paiement === 'en_attente').reduce((s, f) => s + f.montant_total_du, 0)
  const totalPaye = factures.filter((f) => f.statut_paiement === 'paye').reduce((s, f) => s + f.montant_recu, 0)
  const totalCommission = factures.reduce((s, f) => s + f.commission, 0)

  const facture = factures.find((f) => f.id === detail)

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {!detail ? (
        <>
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'En attente', val: totalEnAttente, accent: '#BA7517' },
              { label: 'Encaissé', val: totalPaye, accent: '#1D9E75' },
              { label: 'Commissions', val: totalCommission, accent: '#D85A30' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="font-black text-lg" style={{ color: s.accent }}>{s.val.toLocaleString()} F</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            {[
              { id: 'tous', label: 'Toutes' },
              { id: 'en_attente', label: 'En attente' },
              { id: 'paye', label: 'Payées' },
            ].map((f) => (
              <button key={f.id} onClick={() => setFiltre(f.id)}
                className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
                style={{
                  background: filtre === f.id ? '#BA7517' : 'var(--surface)',
                  color: filtre === f.id ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${filtre === f.id ? '#BA7517' : 'var(--border)'}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {liste.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Aucune facture.</p>
            </div>
          ) : (
            liste.map((f) => {
              const st = STATUT_STYLE[f.statut_paiement]
              return (
                <button key={f.id} onClick={() => setDetail(f.id)}
                  className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all active:scale-98"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{f.id}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cmd #{f.commandeId} · {f.client}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.date} · {f.articles.length} articles</span>
                    <span className="font-black text-sm" style={{ color: '#BA7517' }}>{f.montant_total_du.toLocaleString()} F</span>
                  </div>
                </button>
              )
            })
          )}
        </>
      ) : facture && (
        <>
          {/* En-tête détail */}
          <div className="flex items-center gap-3">
            <button onClick={() => setDetail(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              ←
            </button>
            <div className="flex-1">
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{facture.id}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Commande #{facture.commandeId}</div>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: STATUT_STYLE[facture.statut_paiement].bg, color: STATUT_STYLE[facture.statut_paiement].color }}>
              {STATUT_STYLE[facture.statut_paiement].icon} {STATUT_STYLE[facture.statut_paiement].label}
            </span>
          </div>

          {/* Client */}
          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Client</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{facture.client}</div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Date facture : {facture.date}</div>
          </div>

          {/* Articles */}
          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Articles</div>
            <div className="flex flex-col gap-2">
              {facture.articles.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-alt)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {a.nom} × {a.qte}
                  </span>
                  <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                    {(a.prix * a.qte).toLocaleString()} F
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail financier */}
          <div className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="text-xs font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Détail financier</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Marchandises', val: facture.total_marchandises },
                { label: 'Frais livraison', val: facture.frais_livraison },
                { label: 'Commission (0,6%)', val: facture.commission, negative: true },
                ...(facture.frais_retour > 0 ? [{ label: 'Frais retour', val: facture.frais_retour, negative: true }] : []),
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
                  <span className="text-xs font-semibold" style={{ color: l.negative ? '#D85A30' : 'var(--text-primary)' }}>
                    {l.negative ? '−' : ''}{l.val.toLocaleString()} F
                  </span>
                </div>
              ))}
              <div className="h-px my-1" style={{ background: 'var(--border)' }} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Total dû</span>
                <span className="text-sm font-black" style={{ color: '#BA7517' }}>{facture.montant_total_du.toLocaleString()} F</span>
              </div>
            </div>
          </div>

          {/* Paiement */}
          {facture.statut_paiement === 'paye' && (
            <div className="rounded-2xl p-4"
              style={{ background: '#E1F5EE', border: '1.5px solid #9FE1CB' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <div className="text-xs font-black" style={{ color: '#0F6E56' }}>Paiement reçu</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#0F6E56' }}>Mode</span>
                  <span className="font-bold" style={{ color: '#0F6E56' }}>{facture.mode_reglement}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#0F6E56' }}>Montant reçu</span>
                  <span className="font-bold" style={{ color: '#0F6E56' }}>{facture.montant_recu.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#0F6E56' }}>Date</span>
                  <span className="font-bold" style={{ color: '#0F6E56' }}>{facture.date_paiement}</span>
                </div>
              </div>
            </div>
          )}

          {facture.statut_paiement === 'en_attente' && (
            <div className="rounded-2xl p-4"
              style={{ background: '#FAEEDA', border: '1.5px solid #FAC775' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <div className="text-xs font-bold" style={{ color: '#854F0B' }}>
                  Paiement en attente — le livreur collectera le montant à la livraison (COD).
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
