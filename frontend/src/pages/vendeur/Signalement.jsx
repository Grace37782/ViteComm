import { useState } from 'react'

const MOTIFS = [
  'Comportement inapproprié',
  'Non-respect des délais',
  'Produits non conformes',
  'Harcèlement',
  'Fraude ou tentative de fraude',
  'Autre',
]

const SIGNALEMENTS_INIT = [
  {
    id: 1,
    date: '06 juin 2026',
    cible_nom: 'Rodrigue K.',
    cible_role: 'Livreur',
    motif: 'Non-respect des délais',
    description: 'Livreur a mis plus de 2 heures pour une livraison prévue en 30 min.',
    statut: 'en_cours',
  },
  {
    id: 2,
    date: '01 juin 2026',
    cible_nom: 'M. Koffi',
    cible_role: 'Client',
    motif: 'Comportement inapproprié',
    description: 'Client a insulté le livreur lors de la livraison.',
    statut: 'traite',
    decision: 'Avertissement au client',
  },
]

export default function Signalement() {
  const [signalements, setSignalements] = useState(SIGNALEMENTS_INIT)
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({ cible_nom: '', cible_role: 'Client', motif: '', description: '' })
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function envoyer() {
    if (!form.cible_nom.trim() || !form.motif || !form.description.trim()) {
      return showToast('⚠️ Remplissez tous les champs')
    }
    const now = new Date()
    const dateStr = `${now.getDate()} ${now.toLocaleString('fr', { month: 'long' })} ${now.getFullYear()}`
    setSignalements((prev) => [
      { id: Date.now(), date: dateStr, ...form, statut: 'soumis' },
      ...prev,
    ])
    setMode(null)
    setForm({ cible_nom: '', cible_role: 'Client', motif: '', description: '' })
    showToast('✅ Signalement envoyé')
  }

  const STATUT_STYLE = {
    soumis: { label: 'Soumis', bg: '#FAEEDA', color: '#854F0B', icon: '📨' },
    en_cours: { label: 'En cours', bg: '#E6F1FB', color: '#185FA5', icon: '🔍' },
    traite: { label: 'Traité', bg: '#E1F5EE', color: '#0F6E56', icon: '✅' },
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: 'var(--accent)' }}>
          {toast}
        </div>
      )}

      {!mode ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Signalements</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{signalements.length} signalement{signalements.length > 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setMode('new')}
              className="px-4 py-2 rounded-full text-sm font-black cursor-pointer"
              style={{ background: '#D85A30', color: '#fff', border: 'none' }}>
              + Signaler
            </button>
          </div>

          {signalements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🚩</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Aucun signalement.</p>
            </div>
          ) : (
            signalements.map((s) => {
              const st = STATUT_STYLE[s.statut]
              return (
                <div key={s.id} className="rounded-2xl p-4"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                        {s.cible_nom}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {s.cible_role} · {s.date}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div className="rounded-xl px-3 py-2 mb-2"
                    style={{ background: 'var(--surface-alt)' }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Motif</div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.motif}</div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                  {s.decision && (
                    <div className="mt-2 rounded-xl px-3 py-2"
                      style={{ background: '#E1F5EE', border: '1px solid #9FE1CB' }}>
                      <div className="text-[10px] font-bold" style={{ color: '#0F6E56' }}>Décision admin</div>
                      <div className="text-xs font-semibold" style={{ color: '#0F6E56' }}>{s.decision}</div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setMode(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              ←
            </button>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Nouveau signalement</div>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>

            {/* Nom de la cible */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Nom de la personne *</label>
              <input type="text" placeholder="Ex: Rodrigue K."
                value={form.cible_nom} onChange={(e) => setForm((p) => ({ ...p, cible_nom: e.target.value }))}
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>

            {/* Rôle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Rôle</label>
              <div className="flex gap-2">
                {['Client', 'Livreur'].map((r) => (
                  <button key={r} onClick={() => setForm((p) => ({ ...p, cible_role: r }))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{
                      background: form.cible_role === r ? '#D85A30' : 'var(--surface-alt)',
                      color: form.cible_role === r ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${form.cible_role === r ? '#D85A30' : 'var(--border)'}`,
                    }}>
                    {r === 'Client' ? '🛒' : '🏍️'} {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Motif */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Motif *</label>
              <div className="flex flex-wrap gap-2">
                {MOTIFS.map((m) => (
                  <button key={m} onClick={() => setForm((p) => ({ ...p, motif: m }))}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer"
                    style={{
                      background: form.motif === m ? '#D85A30' : 'var(--surface-alt)',
                      color: form.motif === m ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${form.motif === m ? '#D85A30' : 'var(--border)'}`,
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Description *</label>
              <textarea rows={3} placeholder="Décrivez la situation…"
                value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>

            <button onClick={envoyer}
              className="w-full py-3 rounded-xl text-white text-sm font-black cursor-pointer"
              style={{ background: '#D85A30', border: 'none' }}>
              Envoyer le signalement
            </button>
          </div>
        </>
      )}
    </div>
  )
}
