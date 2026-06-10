import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Loader2, CheckCircle, XCircle, RefreshCw, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react'

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

  const [idCommande, setIdCommande] = useState(stateOrderId || null)
  const [total, setTotal] = useState(stateTotal || 0)
  const [telephone, setTelephone] = useState('')
  const [initiating, setInitiating] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(statusParam || null)
  const [loading, setLoading] = useState(!!ref)
  const [attempts, setAttempts] = useState(0)
  const [toast, setToast] = useState('')
  const intervalRef = useRef(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!idCommande && !ref) {
      navigate('/client/mes-commandes')
      return
    }

    if (statusParam === 'success') {
      setPaymentStatus('completed')
      setLoading(false)
      return
    }

    if (ref) {
      setLoading(true)
      intervalRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/client/payment/status/${ref}`)
          setPaymentStatus(res.statut)
          setAttempts(a => a + 1)
          if (res.statut === 'completed' || res.statut === 'failed' || res.statut === 'cancelled') {
            clearInterval(intervalRef.current)
            setLoading(false)
          }
        } catch {
          setAttempts(a => a + 1)
        }
      }, 4000)

      return () => clearInterval(intervalRef.current)
    }
  }, [idCommande, ref, statusParam, navigate])

  async function initierPaiement() {
    if (!telephone.trim()) {
      showToast('Veuillez saisir votre numéro de téléphone')
      return
    }
    setInitiating(true)
    try {
      const res = await api.post('/client/payment/initiate', {
        id_commande: idCommande,
        mode_paiement: 'momo',
        telephone: telephone.trim(),
      })
      window.location.href = res.checkout_url
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'initiation du paiement')
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

  const isCompleted = paymentStatus === 'completed'
  const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled'
  const isPending = paymentStatus === 'pending' || loading

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

        {/* COMPLETED */}
        {isCompleted && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(45,196,145,0.15)' : '#D1FAE5' }}>
                <CheckCircle size={40} style={{ color: '#1D9E75' }} />
              </div>
            </div>
            <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Paiement confirmé !
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Votre commande #{idCommande} a été payée avec succès.
            </p>
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
              onClick={() => { setPaymentStatus(null); setTelephone('') }}
              className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer flex items-center justify-center gap-2"
              style={{ background: '#1D9E75', border: 'none' }}
            >
              <RefreshCw size={14} /> Réessayer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
