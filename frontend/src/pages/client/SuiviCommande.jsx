import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Loader2, CheckCircle, Motorbike, Package, Search, PartyPopper, ShieldCheck, Home, Smartphone, QrCode, XCircle, Ban, AlertTriangle } from 'lucide-react'

const STATUT_STEPS = [
  { key: 'En attente', icon: Loader2, titre: 'En attente', desc: 'En attente de validation' },
  { key: 'Validee', icon: Package, titre: 'Validée', desc: 'Commande validée par le vendeur' },
  { key: 'En collecte', icon: Package, titre: 'Collecte', desc: 'Articles en cours de collecte' },
  { key: 'En transit', icon: Motorbike, titre: 'En transit', desc: 'En route vers vous' },
  { key: 'Inspectee', icon: Search, titre: 'Inspection', desc: 'Inspectez vos articles' },
  { key: 'Livree', icon: PartyPopper, titre: 'Livrée', desc: 'Livraison terminée !' },
]

export default function SuiviCommande() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const { id_commande, code_verification } = location.state || {}
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [finalizeQR, setFinalizeQR] = useState(null)
  const [showFinalizeQR, setShowFinalizeQR] = useState(false)
  const [finalizeScanStatus, setFinalizeScanStatus] = useState(null)

  const fetchOrder = useCallback(async () => {
    if (!id_commande) return
    try {
      const data = await api.get('/client/orders')
      const o = data.find(ord => ord.id_commande === id_commande)
      if (o) setOrder(o)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [id_commande])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  useEffect(() => {
    if (showQR && id_commande && !qrCode) {
      api.get(`/client/orders/${id_commande}/qrcode`).then(setQrCode).catch(() => {})
    }
  }, [showQR, id_commande, qrCode])

  useEffect(() => {
    if (showFinalizeQR && id_commande && !finalizeQR) {
      api.get(`/client/orders/${id_commande}/finalize-qrcode`).then(setFinalizeQR).catch(() => {})
    }
  }, [showFinalizeQR, id_commande, finalizeQR])

  useEffect(() => {
    if (!showFinalizeQR || !id_commande) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFinalizeScanStatus(null)
    const poll = async () => {
      try {
        const data = await api.get(`/client/orders/${id_commande}/scan-status`)
        setFinalizeScanStatus(data)
        if (data.statut === 'echec') return
      } catch { /* polling error, ignore */ }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [showFinalizeQR, id_commande])

  const statut = order?.statut || 'En attente'
  const livreur = order?.livraison?.livreur
  const livreurNom = livreur
    ? `${livreur.utilisateur?.prenom} ${livreur.utilisateur?.nom}`
    : 'Votre livreur'

  const currentStepIndex = STATUT_STEPS.findIndex(s => s.key === statut)
  const verificationCode = code_verification || order?.code_verification
  const canCancel = statut === 'En attente'
  const [cancelling, setCancelling] = useState(false)

  async function handleCancel() {
    if (!confirm('Annuler cette commande ?')) return
    setCancelling(true)
    try {
      await api.post(`/client/orders/${id_commande}/cancel`)
      fetchOrder()
    } catch { /* ignore */ }
    finally { setCancelling(false) }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen font-sans flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/client/mes-commandes')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div>
            <div className="text-white font-black text-base">Suivi de commande</div>
            <div className="text-white/70 text-xs">Commande #{id_commande} · Mise à jour toutes les 10s</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* STATUT ACTUEL */}
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-4xl mb-2">{(() => { const step = STATUT_STEPS[Math.max(0, currentStepIndex)]; return step ? (step.key === 'En attente' ? <Loader2 size={36} className="animate-spin" /> : <step.icon size={36} />) : <Loader2 size={36} className="animate-spin" />; })()}</div>
          <div className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
            {STATUT_STEPS[Math.max(0, currentStepIndex)]?.titre || statut}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {STATUT_STEPS[Math.max(0, currentStepIndex)]?.desc || ''}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {livreurNom}
          </div>
        </div>

        {/* CODE DE VÉRIFICATION */}
        {verificationCode && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'var(--surface)', border: '2px solid var(--accent)', boxShadow: isDark ? '0 4px 20px rgba(45,196,145,0.1)' : '0 4px 20px rgba(29,158,117,0.15)' }}>
            <div className="text-[11px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} className="inline" /> Code de vérification
            </div>
            <div className="text-3xl font-black tracking-[8px] font-mono" style={{ color: 'var(--accent)' }}>
              {verificationCode}
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Communiquez ce code au livreur lors de la collecte (RG06).
            </div>
            {['En attente', 'Validee', 'En collecte'].includes(statut) && (
              <button onClick={() => setShowQR(true)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 mx-auto"
                style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', border: 'none' }}>
                <QrCode size={14} /> Afficher le QR code
              </button>
            )}
          </div>
        )}

        {/* QR CODE MODAL */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowQR(false)}>
            <div className="rounded-3xl p-6 max-w-sm w-full text-center" style={{ background: 'var(--surface)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="font-black text-base" style={{ color: 'var(--text-primary)' }}>QR Code</div>
                <button onClick={() => setShowQR(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                  <XCircle size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              {qrCode?.qrcode ? (
                <>
                  <img src={qrCode.qrcode} alt="QR Code" className="mx-auto rounded-2xl mb-3" style={{ maxWidth: 250 }} />
                  <div className="text-xs font-bold tracking-[6px] font-mono mb-2" style={{ color: 'var(--accent)' }}>
                    {verificationCode}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Montrez ce QR code au livreur lors de la collecte (RG06)
                  </div>
                </>
              ) : (
                <div className="py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
              )}
            </div>
          </div>
        )}

        {/* FINALIZE QR MODAL — Driver scans this at delivery */}
        {showFinalizeQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => { setShowFinalizeQR(false); setFinalizeQR(null); setFinalizeScanStatus(null) }}>
            <div className="rounded-3xl p-6 max-w-sm w-full text-center" style={{ background: 'var(--surface)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="font-black text-base" style={{ color: 'var(--text-primary)' }}>QR de finalisation</div>
                <button onClick={() => { setShowFinalizeQR(false); setFinalizeQR(null); setFinalizeScanStatus(null) }} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                  <XCircle size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              {finalizeScanStatus?.statut === 'echec' && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: isDark ? 'rgba(226,75,74,0.12)' : '#FEE2E2', border: '1.5px solid rgba(226,75,74,0.3)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} style={{ color: '#E24B4A' }} />
                    <span className="text-xs font-black" style={{ color: '#E24B4A' }}>Échec de la vérification</span>
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    {finalizeScanStatus.message || 'Le code QR n\'a pas été reconnu.'}
                  </div>
                  <div className="text-[10px] mt-2" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                    Le livreur peut réessayer en ouvrant à nouveau la caméra.
                  </div>
                </div>
              )}
              {finalizeQR?.qrcode ? (
                <>
                  <img src={finalizeQR.qrcode} alt="QR Finalisation" className="mx-auto rounded-2xl mb-3" style={{ maxWidth: 250 }} />
                  <div className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>
                    Le livreur scanne ce QR pour finaliser
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Ce QR est sécurisé et signé avec la collecte du vendeur. Expire dans 1 heure.
                  </div>
                </>
              ) : (
                <div className="py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS BAR */}
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-[11px] font-extrabold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Progression
          </div>
          <div className="flex flex-col gap-0">
            {STATUT_STEPS.map((step, i) => {
              const isActive = i === currentStepIndex
              const isPast = i < currentStepIndex
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all"
                      style={{
                        background: isPast ? '#1D9E75' : isActive ? 'var(--accent)' : 'var(--surface-alt)',
                        color: isPast || isActive ? '#fff' : 'var(--text-muted)',
                        border: `2px solid ${isPast || isActive ? 'var(--accent)' : 'var(--border)'}`,
                        boxShadow: isActive ? (isDark ? '0 0 12px rgba(45,196,145,0.3)' : '0 0 12px rgba(29,158,117,0.2)') : 'none',
                      }}>
                      {isPast ? <CheckCircle size={14} /> : step.key === 'En attente' ? <Loader2 size={14} className="animate-spin" /> : <step.icon size={14} />}
                    </div>
                    {i < STATUT_STEPS.length - 1 && (
                      <div className="w-0.5 h-5" style={{ background: isPast ? '#1D9E75' : 'var(--border)' }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <div className="text-xs font-bold" style={{ color: isActive ? 'var(--accent)' : isPast ? '#1D9E75' : 'var(--text-muted)' }}>
                      {step.titre}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{step.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2">
          {statut === 'En transit' && (
            <button onClick={() => { setShowFinalizeQR(true); setFinalizeQR(null); setFinalizeScanStatus(null) }}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{ background: '#1D9E75', border: 'none', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
               <QrCode size={16} className="inline" /> Afficher le QR de finalisation
            </button>
          )}
          {statut === 'Inspectee' && (
            <button onClick={() => navigate('/client/inspection', { state: { id_commande } })}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{ background: '#D85A30', border: 'none', boxShadow: '0 4px 16px rgba(216,90,48,0.3)' }}>
               <Search size={16} className="inline" /> Inspecter les articles
            </button>
          )}
          {statut === 'Livree' && order?.mode_paiement_status !== 'paye' && (
            <button onClick={() => {
              const total = (order?.detailsCommande || []).reduce((s, d) => s + (d.prix_vente_applique || 0) * d.quantite_commandee, 0)
                + (order?.frais_livraison || 0)
              navigate('/client/paiement', { state: { id_commande, total } })
            }}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{ background: '#1D9E75', border: 'none', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
               <Smartphone size={16} className="inline" /> Payer maintenant
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="w-full py-3.5 rounded-2xl font-black text-sm cursor-pointer"
              style={{ background: 'var(--surface)', color: '#D85A30', border: '1.5px solid #D85A30', opacity: cancelling ? 0.6 : 1 }}>
               <Ban size={16} className="inline" /> {cancelling ? 'Annulation…' : 'Annuler la commande'}
            </button>
          )}
          <button onClick={() => navigate('/client/accueil')}
            className="w-full py-3.5 rounded-2xl font-black text-sm cursor-pointer"
            style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1.5px solid var(--border)' }}>
             <Home size={16} className="inline" /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}
