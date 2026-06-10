import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function PaiementClient() {
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const statusParam = searchParams.get('status')

  const [paymentStatus, setPaymentStatus] = useState(statusParam || 'pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) {
      navigate('/client/mes-commandes')
      return
    }

    if (statusParam === 'success') {
      setPaymentStatus('completed')
      setLoading(false)
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/client/payment/status/${ref}`)
        setPaymentStatus(res.statut)
        if (res.statut === 'completed' || res.statut === 'failed' || res.statut === 'cancelled') {
          clearInterval(interval)
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [ref, statusParam, navigate])

  const isCompleted = paymentStatus === 'completed'
  const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled'

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      <div className="px-4 py-4 flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>

        {loading && !isCompleted && !isFailed && (
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
          </div>
        )}

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
              Votre commande est en cours de traitement.
            </p>
            <button
              onClick={() => navigate('/client/suivi-commande')}
              className="w-full py-3 rounded-2xl text-white font-black text-sm cursor-pointer"
              style={{ background: '#1D9E75', border: 'none' }}
            >
              Suivre ma commande →
            </button>
          </div>
        )}

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
              onClick={() => navigate(-1)}
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
