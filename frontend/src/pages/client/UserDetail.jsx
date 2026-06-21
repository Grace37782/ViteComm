import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { ArrowLeft, User, Star, Truck, Package, MapPin, Mail, Shield, Loader2, ShoppingCart, Store } from 'lucide-react'

export default function UserDetail() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/client/users/${userId}`)
      .then(setData)
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [userId, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!data) return null

  const { user, roleData } = data
  const role = roleData?.type || 'client'

  const ROLE_CONFIG = {
    vendeur: { color: '#BA7517', label: 'Vendeur', icon: Store },
    livreur: { color: '#D85A30', label: 'Livreur', icon: Truck },
    client: { color: '#1D9E75', label: 'Client', icon: User },
    admin: { color: '#6366F1', label: 'Admin', icon: Shield },
  }
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.client
  const RoleIcon = cfg.icon

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-6 flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer">
            <ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Profil</h1>
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          {user.photo_url ? (
            <img src={user.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: cfg.color }} />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black" style={{ background: cfg.color }}>
              {user.prenom?.[0]}{user.nom?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base truncate" style={{ color: 'var(--text-primary)' }}>{user.prenom} {user.nom}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: cfg.color + '20', color: cfg.color }}>
                <RoleIcon size={10} /> {cfg.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.statut_compte === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {user.statut_compte}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Info Card */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Informations</h3>
          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{user.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Role-specific data */}
        {role === 'vendeur' && roleData && (
          <>
            {/* Vendor Stats */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Stats Vendeur</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : '#FEF3C7' }}>
                  <Star size={16} className="mx-auto mb-1 text-amber-500" />
                  <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{roleData.score_reputation?.toFixed(1) || '—'}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Note</p>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : '#FEF3C7' }}>
                  <Package size={16} className="mx-auto mb-1 text-amber-500" />
                  <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{roleData.productCount || 0}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Produits</p>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : '#FEF3C7' }}>
                  <MapPin size={16} className="mx-auto mb-1 text-amber-500" />
                  <p className="font-extrabold text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>{roleData.marche?.nom || '—'}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Marché</p>
                </div>
              </div>
            </div>

            {/* Products */}
            {roleData.products?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Catalogue ({roleData.productCount})</h3>
                <div className="space-y-2">
                  {roleData.products.map(p => (
                    <div key={p.id_produit} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(186,117,23,0.1)' : '#FEF3C7' }}>
                        <Package size={14} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{p.nom}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.prix_unitaire?.toLocaleString()} F</p>
                      </div>
                    </div>
                  ))}
                </div>
                {roleData.vendorId && (
                  <button onClick={() => navigate(`/client/catalogue/${roleData.vendorId}`)}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors" style={{ background: cfg.color }}>
                    Voir tout le catalogue
                  </button>
                )}
              </div>
            )}

            {/* Vendor Feedback */}
            {roleData.feedbacks?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Avis clients</h3>
                <div className="space-y-3">
                  {roleData.feedbacks.slice(0, 5).map(f => (
                    <div key={f.id_feedback} className="pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} className={s <= f.note ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                          {f.livraison?.commande?.client?.utilisateur?.prenom}
                        </span>
                      </div>
                      {f.commentaire && <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{f.commentaire}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {role === 'livreur' && roleData && (
          <>
            {/* Driver Stats */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Stats Livreur</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : '#FEE2E2' }}>
                  <Star size={16} className="mx-auto mb-1 text-red-400" />
                  <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{roleData.score_reputation?.toFixed(1) || '—'}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Note</p>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : '#FEE2E2' }}>
                  <Truck size={16} className="mx-auto mb-1 text-red-400" />
                  <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{roleData.livraisonCount || 0}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Livraisons</p>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(216,90,48,0.1)' : '#FEE2E2' }}>
                  <Shield size={16} className="mx-auto mb-1 text-red-400" />
                  <p className="font-extrabold text-[11px]" style={{ color: roleData.est_disponible ? '#16A34A' : '#DC2626' }}>
                    {roleData.est_disponible ? 'Disponible' : 'Occupé'}
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Statut</p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Véhicule</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Type</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{roleData.type_vehicule || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Immatriculation</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{roleData.immatriculation || '—'}</span>
                </div>
              </div>
            </div>

            {/* Driver Feedback */}
            {roleData.feedbacks?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Avis clients</h3>
                <div className="space-y-3">
                  {roleData.feedbacks.slice(0, 5).map(f => (
                    <div key={f.id_feedback} className="pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} className={s <= f.note ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                          {f.livraison?.commande?.client?.utilisateur?.prenom}
                        </span>
                      </div>
                      {f.commentaire && <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{f.commentaire}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {role === 'client' && roleData && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Stats Client</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(29,158,117,0.1)' : '#D1FAE5' }}>
                <ShoppingCart size={16} className="mx-auto mb-1 text-emerald-500" />
                <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{roleData.orderCount || 0}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Commandes</p>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: isDark ? 'rgba(29,158,117,0.1)' : '#D1FAE5' }}>
                <MapPin size={16} className="mx-auto mb-1 text-emerald-500" />
                <p className="font-extrabold text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>{roleData.adresse_livraison || '—'}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Adresse</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
