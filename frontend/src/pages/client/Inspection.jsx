import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { Package, AlertTriangle, Camera, Loader2, Leaf, Fish, Drumstick, Flame, Droplets, Wheat, CircleDot, UtensilsCrossed, Apple, Citrus } from 'lucide-react'

const FRAIS_RETOUR_PAR_ARTICLE = 500

function productEmoji(name) {
  const n = name?.toLowerCase() || ''
  if (n.includes('tomate')) return <Apple size={24} />
  if (n.includes('gombo')) return <Leaf size={24} />
  if (n.includes('poisson') || n.includes('capitaine') || n.includes('evie')) return <Fish size={24} />
  if (n.includes('poulet')) return <Drumstick size={24} />
  if (n.includes('boeuf') || n.includes('bœuf')) return <Drumstick size={24} />
  if (n.includes('banane')) return <Citrus size={24} />
  if (n.includes('oignon') || n.includes('ognon')) return <CircleDot size={24} />
  if (n.includes('piment')) return <Flame size={24} />
  if (n.includes('huile')) return <Droplets size={24} />
  if (n.includes('riz')) return <UtensilsCrossed size={24} />
  if (n.includes('maïs') || n.includes('blé')) return <Wheat size={24} />
  if (n.includes('sel')) return <Droplets size={24} />
  return <Package size={24} />
}

export default function Inspection() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'
  const fileRef = useRef(null)

  const orderId = location.state?.id_commande
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statuts, setStatuts] = useState({})
  const [motifs, setMotifs] = useState({})
  const [photos, setPhotos] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!orderId) {
      navigate('/client/mes-commandes')
      return
    }
    api.get('/client/orders')
      .then(data => {
        const o = data.find(ord => ord.id_commande === orderId)
        if (!o) { navigate('/client/mes-commandes'); return }
        setCommande(o)
      })
      .catch(() => navigate('/client/mes-commandes'))
      .finally(() => setLoading(false))
  }, [orderId, navigate])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function setStatut(id, val) {
    setStatuts((p) => ({ ...p, [id]: val }))
    if (val === 'accepte') setMotifs((p) => { const n = { ...p }; delete n[id]; return n })
  }

  function ajouterPhoto(e) {
    const files = Array.from(e.target.files || [])
    const urls = files.map((f) => URL.createObjectURL(f))
    setPhotos((p) => [...p, ...urls])
  }

  const articles = commande?.detailsCommande || []
  const tousDefinis = articles.length > 0 && articles.every((a) => statuts[a.id_produit])
  const articlesAcceptes = articles.filter((a) => statuts[a.id_produit] === 'accepte')
  const articlesRejetes = articles.filter((a) => statuts[a.id_produit] === 'rejete')
  const totalMarchandises = articlesAcceptes.reduce((s, a) => s + a.prix_vente_applique * a.quantite_commandee, 0)
  const fraisRetour = articlesRejetes.length * FRAIS_RETOUR_PAR_ARTICLE
  const fraisLivraison = commande?.frais_livraison || 1500
  const totalFinal = totalMarchandises + fraisLivraison + fraisRetour
  const tousRejetes = articlesRejetes.length === articles.length
  const motifManquant = articlesRejetes.some((a) => !motifs[a.id_produit]?.trim())

  async function confirmer() {
    if (!tousDefinis || motifManquant || !commande) return
    setSubmitting(true)
    try {
      const statutsPayload = {}
      for (const a of articles) {
        statutsPayload[a.id_produit] = statuts[a.id_produit] === 'accepte' ? 'accepte' : 'rejete'
      }
      await api.post(`/client/orders/${commande.id_commande}/inspection`, {
        statuts: statutsPayload,
        motifs,
      })
      showToast('Inspection confirmée !')
      setTimeout(() => navigate('/client/paiement', {
        state: { id_commande: commande.id_commande, total: totalFinal }
      }), 1000)
    } catch (err) {
      showToast(err.message || 'Erreur lors de la confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen font-sans flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement de la commande...</div>
      </div>
    )
  }

  if (!commande) return null

  return (
    <div className="w-full min-h-screen font-sans mx-auto max-w-3xl" style={{ background: 'var(--bg)', paddingBottom: 80 }}>

      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-center max-w-md mx-auto"
          style={{ background: '#E24B4A', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <AlertTriangle size={16} className="inline" /> {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: isDark ? 'linear-gradient(135deg, #4D2113 0%, #141613 100%)' : 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: isDark ? 'rgba(232,125,85,0.1)' : 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/client/mes-commandes')}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Inspection — Commande #{commande.id_commande}</div>
            <div className="text-white/70 text-xs">Inspectez chaque article avant de payer</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* CONSIGNE */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: isDark ? 'rgba(232,125,85,0.08)' : '#FAECE7', border: `1.5px solid ${isDark ? 'rgba(232,125,85,0.2)' : '#F5C4B3'}` }}>
          <span className="flex-shrink-0"><Package size={20} /></span>
          <p className="text-xs font-semibold leading-relaxed" style={{ color: isDark ? '#E87D55' : '#993C1D' }}>
            Inspectez chaque article <strong>en présence du livreur</strong>. Acceptez ou rejetez article par article. Vous ne payez que ce que vous acceptez.
          </p>
        </div>

        {/* ARTICLES */}
        <div className="flex flex-col gap-3">
          {articles.map((a) => {
            const st = statuts[a.id_produit]
            const nom = a.produit?.nom || `Article #${a.id_produit}`
            const prix = a.prix_vente_applique
            const qte = a.quantite_commandee
            const unite = a.produit?.unite || 'kg'
            const vendeur = a.produit?.vendeur?.nom_etablissement || 'Vendeur'
            return (
              <div key={a.id_produit} className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: `2px solid ${st === 'accepte' ? (isDark ? 'rgba(45,196,145,0.3)' : '#9FE1CB') : st === 'rejete' ? (isDark ? 'rgba(232,125,85,0.3)' : '#F5C4B3') : 'var(--border)'}`,
                }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'var(--surface-alt)' }}>{productEmoji(nom)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{nom}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {qte} {unite} · {(prix * qte).toLocaleString()} F · {vendeur}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 px-4 pb-3">
                  <button onClick={() => setStatut(a.id_produit, 'accepte')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black cursor-pointer transition-all"
                    style={{
                      background: st === 'accepte' ? '#1D9E75' : 'var(--surface-alt)',
                      color: st === 'accepte' ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${st === 'accepte' ? '#1D9E75' : 'var(--border)'}`,
                    }}>
                    {st === 'accepte' ? '✓ Accepté' : '✓ Accepter'}
                  </button>
                  <button onClick={() => setStatut(a.id_produit, 'rejete')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black cursor-pointer transition-all"
                    style={{
                      background: st === 'rejete' ? '#D85A30' : 'var(--surface-alt)',
                      color: st === 'rejete' ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${st === 'rejete' ? '#D85A30' : 'var(--border)'}`,
                    }}>
                    {st === 'rejete' ? '✗ Rejeté' : '✗ Rejeter'}
                  </button>
                </div>

                {st === 'rejete' && (
                  <div className="px-4 pb-3">
                    <textarea
                      placeholder="Motif du rejet obligatoire (ex: produit avarié, mauvaise qualité…)"
                      value={motifs[a.id_produit] || ''}
                      onChange={(e) => setMotifs((p) => ({ ...p, [a.id_produit]: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
                      style={{
                        background: isDark ? 'rgba(232,125,85,0.06)' : '#FAECE7',
                        border: `1.5px solid ${motifs[a.id_produit]?.trim() ? (isDark ? 'rgba(232,125,85,0.2)' : '#F5C4B3') : '#E24B4A'}`,
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                      }}
                    />
                    {!motifs[a.id_produit]?.trim() && (
                      <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>⚠ Motif requis</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* PREUVES PHOTOS */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0"><Camera size={18} /></span>
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                Photos de preuve <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span>
              </h3>
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: isDark ? 'rgba(45,196,145,0.12)' : '#E1F5EE', color: isDark ? '#2DC491' : '#0F6E56', border: 'none' }}>
              + Ajouter
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhoto} />
          </div>
          {photos.length === 0 ? (
            <div className="rounded-xl py-4 text-center" style={{ background: 'var(--surface-alt)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ajoutez des photos si vous contestez la qualité</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-square">
                  <img src={url} alt={`preuve ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECAPITULATIF */}
        {tousDefinis && (
          <div className="rounded-2xl p-4"
            style={{ background: tousRejetes ? (isDark ? 'rgba(232,125,85,0.06)' : '#FAECE7') : (isDark ? 'rgba(45,196,145,0.06)' : '#E1F5EE'), border: `1.5px solid ${tousRejetes ? (isDark ? 'rgba(232,125,85,0.15)' : '#F5C4B3') : (isDark ? 'rgba(45,196,145,0.15)' : '#9FE1CB')}` }}>
            <h3 className="font-black text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Récapitulatif de paiement</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Articles acceptés ({articlesAcceptes.length}/{articles.length})</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalMarchandises.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Frais de livraison</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fraisLivraison.toLocaleString()} F</span>
              </div>
              {fraisRetour > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#D85A30' }}>Frais de retour ({articlesRejetes.length} article{articlesRejetes.length > 1 ? 's' : ''})</span>
                  <span className="font-semibold" style={{ color: '#D85A30' }}>+{fraisRetour.toLocaleString()} F</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1"
                style={{ borderTop: `1.5px solid ${tousRejetes ? (isDark ? 'rgba(232,125,85,0.15)' : '#F5C4B3') : (isDark ? 'rgba(45,196,145,0.15)' : '#9FE1CB')}` }}>
                <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                  {tousRejetes ? 'Frais de retour uniquement' : 'Total à payer maintenant'}
                </span>
                <span className="font-black text-base"
                  style={{ color: tousRejetes ? '#D85A30' : '#1D9E75' }}>
                  {tousRejetes ? fraisRetour.toLocaleString() : totalFinal.toLocaleString()} F
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BOUTON CONFIRMER */}
        <button onClick={confirmer}
          disabled={!tousDefinis || motifManquant || submitting}
          className="w-full py-4 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: (!tousDefinis || motifManquant) ? '#D3D1C7' : '#1D9E75',
            border: 'none',
            boxShadow: (!tousDefinis || motifManquant) ? 'none' : '0 6px 24px rgba(29,158,117,0.4)',
            cursor: (!tousDefinis || motifManquant) ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.75 : 1,
          }}>
          {submitting ? <><Loader2 size={16} className="inline animate-spin" /> Confirmation…</>
            : !tousDefinis ? 'Inspectez tous les articles pour continuer'
            : motifManquant ? 'Renseignez les motifs de rejet'
            : tousRejetes ? `Confirmer le retour — ${fraisRetour.toLocaleString()} F →`
            : `Confirmer et payer — ${totalFinal.toLocaleString()} F →`}
        </button>
      </div>
    </div>
  )
}
