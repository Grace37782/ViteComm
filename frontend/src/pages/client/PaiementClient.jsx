import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Loader2, CheckCircle, XCircle, RefreshCw, Smartphone, ShieldCheck, ArrowLeft, Download, FileText } from 'lucide-react'

function formatPrice(n) { return (n || 0).toLocaleString() + ' F' }

export default function PaiementClient() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const stateOrderId = location.state?.id_commande
  const stateTotal = location.state?.total
  const ref = searchParams.get('ref')
  const statusParam = searchParams.get('status')
  const paramIdCommande = searchParams.get('id_commande')

  const [idCommande] = useState(stateOrderId || (paramIdCommande ? parseInt(paramIdCommande, 10) : null))
  const [total, setTotal] = useState(stateTotal || 0)
  const [telephone, setTelephone] = useState('')
  const [modePaiement, setModePaiement] = useState('momo')
  const [initiating, setInitiating] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(statusParam || null)
  const [loading, setLoading] = useState(!!ref)
  const [facture, setFacture] = useState(null)
  const [toast, setToast] = useState('')
  const [portalTimeout, setPortalTimeout] = useState(false)
  const intervalRef = useRef(null)

  const isCompleted = paymentStatus === 'completed'
  const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled'
  const isPending = paymentStatus === 'pending' || loading

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!idCommande && !ref) {
      navigate('/client/mes-commandes')
      return
    }

    if (ref) {
      setLoading(true)
      let pollCount = 0
      const MAX_POLLS = 30

      const checkStatus = async () => {
        pollCount++
        try {
          const res = await api.get(`/client/payment/status/${ref}`)
          setPaymentStatus(res.statut)
          if (res.statut === 'completed' || res.statut === 'failed' || res.statut === 'cancelled') {
            clearInterval(intervalRef.current)
            setLoading(false)
            setPortalTimeout(false)
          } else if (pollCount >= MAX_POLLS) {
            clearInterval(intervalRef.current)
            setLoading(false)
            showToast('Délai dépassé — vérifiez votre commande depuis l\'historique')
          }
        } catch {
          if (pollCount >= MAX_POLLS) {
            clearInterval(intervalRef.current)
            setLoading(false)
          }
        }
      }

      checkStatus()
      intervalRef.current = setInterval(checkStatus, 4000)

      return () => { clearInterval(intervalRef.current); setLoading(false) }
    }

    // No ref — use URL status param as fallback display
    setPaymentStatus(statusParam === 'success' ? 'completed' : statusParam === 'failed' ? 'failed' : statusParam || null)
    setLoading(false)
    setPortalTimeout(false)
  }, [idCommande, ref, statusParam, navigate])

  // Portal timeout fallback — if FedaPay redirect hangs
  useEffect(() => {
    if (!isPending || isCompleted || isFailed) return
    const timer = setTimeout(() => setPortalTimeout(true), 20000)
    return () => clearTimeout(timer)
  }, [isPending, isCompleted, isFailed])

  // Fetch total from facture when total is 0 (lost on redirect after FedaPay)
  useEffect(() => {
    if (!total && idCommande && !isCompleted && !isFailed) {
      api.get(`/client/orders/${idCommande}/facture`)
        .then(data => {
          if (data?.facture?.montant_total_du) setTotal(data.facture.montant_total_du)
        })
        .catch(() => {})
    }
  }, [idCommande, total, isCompleted, isFailed])

  // Fetch facture when payment is completed, then redirect to SuiviCommande
  useEffect(() => {
    if (paymentStatus === 'completed' && idCommande) {
      api.get(`/client/orders/${idCommande}/facture`)
        .then(data => {
          setFacture(data)
          if (data?.facture?.montant_total_du) {
            setTotal(data.facture.montant_total_du)
          }
        })
        .catch(() => {})
      // After 2s, redirect to SuiviCommande to avoid back-button loop through FedaPay
      const redirectTimer = setTimeout(() => {
        navigate('/client/suivi', { state: { id_commande }, replace: true })
      }, 2000)
      return () => clearTimeout(redirectTimer)
    }
  }, [paymentStatus, idCommande, navigate])

  async function initierPaiement() {
    if (!telephone.trim()) {
      showToast('Veuillez saisir votre numéro de téléphone')
      return
    }
    if (!idCommande) {
      showToast('Commande introuvable — retour à la liste')
      setTimeout(() => navigate('/client/mes-commandes'), 1500)
      return
    }
    setInitiating(true)
    try {
      const res = await api.post('/client/payment/initiate', {
        id_commande: idCommande,
        mode_paiement: modePaiement,
        telephone: telephone.trim(),
      }, { timeout: 60000 })
      window.location.href = res.checkout_url
    } catch (err) {
      const msg = err.message || 'Erreur lors de l\'initiation du paiement'
      showToast(msg.includes('trop de temps') || msg.includes('contacter')
        ? `${msg}. Le serveur peut se réveiller au prochain essai.`
        : msg)
      setInitiating(false)
    }
  }

  function manualRefresh() {
    if (!ref) return
    setLoading(true)
    api.get(`/client/payment/status/${ref}`)
      .then(res => {
        setPaymentStatus(res.statut)
        if (res.statut === 'completed' || res.statut === 'failed' || res.statut === 'cancelled') {
          setLoading(false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function downloadFacture() {
    if (!facture) return
    const lines = [
      '═══════════════════════════════════════',
      '           VITECOMM — FACTURE',
      '═══════════════════════════════════════',
      '',
      `Facture #${facture.facture.id_facture}`,
      `Commande #${facture.commande.id_commande}`,
      `Date : ${new Date(facture.facture.date_emission).toLocaleDateString('fr-FR')}`,
      '',
      '───────── Articles ─────────',
      ...facture.commande.articles.map(a =>
        `  ${a.nom}  ×${a.quantite}  ${formatPrice(a.sous_total)}`
      ),
      '',
      '───────── Détails ─────────',
      `  Marchandises    : ${formatPrice(facture.facture.montant_marchandises)}`,
      `  Livraison       : ${formatPrice(facture.facture.montant_frais_livraison)}`,
      `  Frais retour    : ${formatPrice(facture.facture.montant_frais_retour)}`,
      `  Commission      : ${formatPrice(facture.facture.montant_commission)}`,
      '─────────────────────────────',
      `  TOTAL DU        : ${formatPrice(facture.facture.montant_total_du)}`,
      '',
    ]
    if (facture.paiement) {
      lines.push(
        '───────── Paiement ─────────',
        `  Montant reçu    : ${formatPrice(facture.paiement.montant_percu)}`,
        `  Mode            : ${facture.paiement.mode_reglement}`,
        `  Référence       : ${facture.paiement.reference_transaction}`,
        `  Statut          : ${facture.paiement.statut}`,
        `  Date            : ${new Date(facture.paiement.date_paiement).toLocaleString('fr-FR')}`,
        '',
      )
    }
    lines.push('═══════════════════════════════════════', '  Merci pour votre achat sur ViteComm', '═══════════════════════════════════════')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-${facture.facture.id_facture}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)' }}>

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
          style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #164032 0%, #121311 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(45,196,145,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div>
            <div className="text-white font-black text-base">Paiement sécurisé</div>
            <div className="text-white/70 text-xs">Commande #{idCommande} · Mobile Money</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>

        {/* FORM STATE — no ref yet, show phone input */}
        {!ref && !isCompleted && !isFailed && (
          <div className="w-full max-w-md flex flex-col gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE' }}>
                  <Smartphone size={24} style={{ color: '#1D9E75' }} />
                </div>
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Payer par Mobile Money</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>MTN MoMo, Moov Pay, Celtis Cash</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Numéro de téléphone</label>
                <input
                  type="tel"
                  placeholder="ex: 0197000000"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Mode de paiement</label>
                <div className="flex gap-2">
                  {[
                    { id: 'momo', label: 'MTN MoMo' },
                    { id: 'moov', label: 'Moov Pay' },
                    { id: 'celtis', label: 'Celtis Cash' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setModePaiement(m.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                      style={{
                        background: modePaiement === m.id ? '#1D9E75' : 'var(--surface-alt)',
                        color: modePaiement === m.id ? '#fff' : 'var(--text-secondary)',
                        border: `1.5px solid ${modePaiement === m.id ? '#1D9E75' : 'var(--border)'}`,
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Total à payer</span>
                  <span className="font-black text-lg" style={{ color: '#1D9E75' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <button onClick={initierPaiement}
              disabled={!telephone.trim() || initiating}
              className="w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all active:scale-98"
              style={{
                background: (!telephone.trim() || initiating) ? (isDark ? '#3A3B38' : '#D3D1C7') : '#1D9E75',
                border: 'none',
                boxShadow: (!telephone.trim() || initiating) ? 'none' : '0 6px 24px rgba(29,158,117,0.4)',
                opacity: initiating ? 0.8 : 1,
              }}>
              {initiating
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Redirection vers FedaPay…</span>
                : <span className="flex items-center justify-center gap-2"><ShieldCheck size={16} /> Payer {formatPrice(total)}</span>}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Vous serez redirigé vers FedaPay pour confirmer le paiement.
            </p>
          </div>
        )}

        {/* PENDING — waiting for payment confirmation */}
        {isPending && !isCompleted && !isFailed && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Loader2 size={48} className="animate-spin" style={{ color: '#1D9E75' }} />
            </div>
            <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Paiement en cours…
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Confirmez le paiement sur votre téléphone.
            </p>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Transaction : {ref}
            </p>

            {portalTimeout && (
              <div className="mt-6 rounded-2xl p-5 text-left" style={{ background: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB', border: '1.5px solid #F59E0B' }}>
                <p className="text-sm font-bold mb-2" style={{ color: '#92400E' }}>Le portail FedaPay ne répond pas ?</p>
                <p className="text-xs mb-3" style={{ color: '#92400E' }}>
                  Si la page de paiement est bloquée, vous pouvez revenir ici et vérifier le statut de votre paiement.
                </p>
                <button onClick={manualRefresh}
                  className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: '#F59E0B', color: '#fff', border: 'none' }}>
                  <RefreshCw size={14} /> Vérifier mon paiement
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-6 justify-center">
              <button onClick={manualRefresh}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                <RefreshCw size={14} /> Vérifier
              </button>
              <button onClick={() => { clearInterval(intervalRef.current); navigate('/client/mes-commandes') }}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED — with facture */}
        {isCompleted && (
          <div className="w-full max-w-md">
            <div className="text-center mb-4">
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(45,196,145,0.15)' : '#D1FAE5' }}>
                  <CheckCircle size={40} style={{ color: '#1D9E75' }} />
                </div>
              </div>
              <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                Paiement confirmé !
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Votre commande #{idCommande} a été payée avec succès.
              </p>
            </div>

            {/* Facture */}
            {facture && facture.facture && (
              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Facture #{facture.facture.id_facture}</div>
                </div>

                <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {facture.commande.articles.map((a, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{a.nom} ×{a.quantite}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(a.sous_total)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 space-y-1 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Livraison</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatPrice(facture.facture.montant_frais_livraison)}</span>
                  </div>
                  {facture.facture.montant_frais_retour > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Frais retour</span>
                      <span style={{ color: 'var(--text-primary)' }}>{formatPrice(facture.facture.montant_frais_retour)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1">
                    <span style={{ color: 'var(--text-primary)' }}>Total payé</span>
                    <span style={{ color: '#1D9E75' }}>{formatPrice(facture.facture.montant_total_du)}</span>
                  </div>
                </div>

                {facture.paiement && (
                  <div className="mt-3 pt-3 text-[10px] space-y-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <div>Réf: {facture.paiement.reference_transaction}</div>
                    <div>Payé le {new Date(facture.paiement.date_paiement).toLocaleString('fr-FR')}</div>
                  </div>
                )}

                <button onClick={downloadFacture}
                  className="mt-4 w-full py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', border: 'none' }}>
                  <Download size={14} /> Télécharger la facture
                </button>
              </div>
            )}

            {!facture && isCompleted && idCommande && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Facture en cours de chargement…</p>
                <button onClick={() => {
                  api.get(`/client/orders/${idCommande}/facture`)
                    .then(data => { setFacture(data); if (data?.facture?.montant_total_du) setTotal(data.facture.montant_total_du) })
                    .catch(() => showToast('Erreur — réessayez'))
                }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', border: 'none' }}>
                  <RefreshCw size={14} className="inline" /> Réessayer
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/client/evaluation')}
              className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{ background: '#1D9E75', border: 'none' }}
            >
              Évaluer ma commande →
            </button>
          </div>
        )}

        {/* FAILED */}
        {isFailed && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(248,113,113,0.15)' : '#FEE2E2' }}>
                <XCircle size={40} style={{ color: '#E24B4A' }} />
              </div>
            </div>
            <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Paiement échoué
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Le paiement n'a pas pu être traité. Vous pouvez réessayer.
            </p>
            <button
              onClick={() => {
                clearInterval(intervalRef.current)
                navigate('/client/paiement', { state: { id_commande: idCommande, total }, replace: true })
              }}
              className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2"
              style={{ background: '#1D9E75', border: 'none' }}
            >
              <RefreshCw size={14} /> Réessayer le paiement
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
