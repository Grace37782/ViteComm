import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'users', label: 'Utilisateurs', icon: '👥' },
  { id: 'products', label: 'Produits', icon: '📦' },
  { id: 'signalements', label: 'Signalements', icon: '🚩' },
  { id: 'litiges', label: 'Litiges', icon: '⚖️' },
]

const STATUS_COLORS = { Actif: '#1D9E75', Suspendu: '#BA7517', Banni: '#D85A30' }

const stored = localStorage.getItem('vc_user')
const initialUser = stored ? JSON.parse(stored) : null

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [admin] = useState(initialUser?.est_admin ? initialUser : null)

  useEffect(() => {
    if (!admin) navigate('/accueil')
  }, [admin, navigate])

  if (!admin) return null

  return (
    <div className="min-h-screen bg-[#F7F8F3] font-sans">
      <Header admin={admin} onLogout={() => { localStorage.clear(); navigate('/accueil') }} tab={tab} onTabChange={setTab} />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'signalements' && <SignalementsTab />}
        {tab === 'litiges' && <LitigesTab />}
      </main>
    </div>
  )
}

function Header({ admin, onLogout, tab, onTabChange }) {
  return (
    <div className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg font-black text-[#1D9E75]">V</div>
            <div>
              <div className="text-white font-black text-sm">Console de Supervision Globale</div>
              <div className="text-white/60 text-xs">
                {admin.prenom} {admin.nom} · Administrateur
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Déconnexion
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => onTabChange(t.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
              style={{ background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.7)' }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}18` }}>{icon}</div>
        <span className="text-xs font-semibold" style={{ color: '#888780' }}>{label}</span>
      </div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function DashboardTab() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard').then(setData).catch(e => setErr(e.message))
  }, [])

  if (err) return <div className="text-center py-12 text-sm font-semibold" style={{ color: '#D85A30' }}>⚠️ {err}</div>
  if (!data) return <div className="text-center py-12 text-sm text-[#888780]">Chargement...</div>

  const { financier, alertes, produits_populaires, produits_refuses, classements } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ventes totales" value={`${(financier.total_ventes || 0).toLocaleString()} F`} icon="💰" color="#1D9E75" />
        <StatCard label="Commissions" value={`${(financier.total_commissions_plateforme || 0).toLocaleString()} F`} icon="📈" color="#0F6E56" />
        <StatCard label="Litiges ouverts" value={alertes.litiges_ouverts} icon="⚖️" color="#D85A30" />
        <StatCard label="Signalements" value={alertes.signalements_en_attente} icon="🚩" color="#BA7517" />
      </div>

      <LeaderboardSection data={classements} />
      <ProductRanking title="Produits les plus populaires" items={produits_populaires} color="#1D9E75" />
      <ProductRanking title="Produits les plus refusés" items={produits_refuses} color="#D85A30" />
    </div>
  )
}

function LeaderboardSection({ data }) {
  if (!data) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <LeaderboardCard title="🏪 Vendeurs (CA)" items={data.vendeurs} valueKey="chiffre_affaires" unit="F" color="#BA7517" />
      <LeaderboardCard title="🏍️ Livreurs (Volume)" items={data.livreurs} valueKey="volume_livre" unit="F" color="#D85A30" />
      <LeaderboardCard title="🛒 Clients (Achats)" items={data.clients} valueKey="volume_achat" unit="F" color="#1D9E75" />
    </div>
  )
}

function LeaderboardCard({ title, items, valueKey, unit, color }) {
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
      <h3 className="font-black text-sm mb-4" style={{ color: '#2C2C2A' }}>{title}</h3>
      <div className="flex flex-col gap-2.5">
        {items.slice(0, 5).map((item, i) => (
          <div key={item.id_user} className="flex items-center gap-3">
            <span className="w-5 text-xs font-black" style={{ color: i < 3 ? color : '#888780' }}>#{i + 1}</span>
            <div className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: item.photo_url ? `url(${item.photo_url})` : 'none', background: item.photo_url ? undefined : '#E8E6DF' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: '#2C2C2A' }}>
                {item.nom_etablissement || `${item.prenom} ${item.nom}`}
              </div>
              <div className="text-[10px]" style={{ color: '#888780' }}>{item.prenom} {item.nom}</div>
            </div>
            <span className="text-xs font-black flex-shrink-0" style={{ color }}>{(item[valueKey] || 0).toLocaleString()} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductRanking({ title, items, color }) {
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
      <h3 className="font-black text-sm mb-4" style={{ color: '#2C2C2A' }}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left" style={{ color: '#888780' }}>
            <th className="pb-2 pr-3 font-semibold">Produit</th>
            <th className="pb-2 pr-3 font-semibold">Vendeur</th>
            <th className="pb-2 pr-3 font-semibold">Marché</th>
            <th className="pb-2 pr-3 font-semibold text-right">Qté</th>
            <th className="pb-2 font-semibold text-right">Prix</th>
          </tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id_produit} className="border-t" style={{ borderColor: '#F1EFE8' }}>
                <td className="py-2.5 pr-3 font-bold" style={{ color: '#2C2C2A' }}>{p.nom}</td>
                <td className="py-2.5 pr-3" style={{ color: '#5F5E5A' }}>{p.vendeur?.nom_etablissement || '-'}</td>
                <td className="py-2.5 pr-3" style={{ color: '#5F5E5A' }}>{p.vendeur?.localisation_marche || '-'}</td>
                <td className="py-2.5 pr-3 text-right font-bold" style={{ color }}>{p.quantite}</td>
                <td className="py-2.5 text-right font-bold" style={{ color: '#2C2C2A' }}>{p.prix_reference?.toLocaleString()} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('tous')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  function fetchUsers() {
    setLoading(true)
    api.get('/admin/users').then(d => { setUsers(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, []) // eslint-disable-line react-hooks/set-state-in-effect

  const roles = ['tous', 'client', 'vendeur', 'livreur', 'admin']
  const statuses = ['tous', 'Actif', 'Suspendu', 'Banni']

  const filtered = users.filter(u => {
    const name = `${u.nom} ${u.prenom} ${u.email}`.toLowerCase()
    const role = u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin'
    return name.includes(search.toLowerCase()) &&
      (roleFilter === 'tous' || role === roleFilter) &&
      (statusFilter === 'tous' || u.statut_compte === statusFilter)
  })

  function getRole(u) { return u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin' }
  function getRoleIcon(u) { const r = getRole(u); return r === 'client' ? '🛒' : r === 'vendeur' ? '🏪' : r === 'livreur' ? '🏍️' : '🔐' }

  async function loadDetails(id) {
    setSelected(id)
    try {
      const d = await api.get(`/admin/users/${id}/details`)
      setDetails(d)
    } catch { setDetails(null) }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/admin/users/${id}/status`, { statut_compte: status })
      fetchUsers()
      if (selected === id) loadDetails(id)
    } catch (e) { alert(e.message) }
  }

  async function deleteUser(id, name) {
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      if (selected === id) { setSelected(null); setDetails(null) }
      fetchUsers()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none border" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }}>
          {roles.map(r => <option key={r} value={r}>{r === 'tous' ? 'Tous les rôles' : r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }}>
          {statuses.map(s => <option key={s} value={s}>{s === 'tous' ? 'Tous les statuts' : s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? <div className="text-center py-8 text-sm text-[#888780]">Chargement...</div> :
         filtered.length === 0 ? <div className="text-center py-8 text-sm text-[#888780]">Aucun utilisateur trouvé</div> :
         filtered.map(u => {
           const isSelected = selected === u.id_user
           const role = getRole(u)
           const photoUrl = u.photo_url
           return (
             <div key={u.id_user}>
               <button onClick={() => loadDetails(isSelected ? null : u.id_user)}
                 className="w-full text-left rounded-2xl p-4 border transition-all cursor-pointer"
                 style={{ background: isSelected ? '#E1F5EE' : '#fff', borderColor: isSelected ? '#9FE1CB' : '#E8E6DF' }}>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-cover bg-center flex-shrink-0 flex items-center justify-center text-lg"
                     style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : { background: '#F1EFE8' }}>
                     {!photoUrl && getRoleIcon(u)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-bold truncate" style={{ color: '#2C2C2A' }}>{u.prenom} {u.nom}</span>
                       <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[u.statut_compte]}18`, color: STATUS_COLORS[u.statut_compte] }}>{u.statut_compte}</span>
                     </div>
                     <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{u.email} · {u.telephone} · Rôle: {role}</div>
                   </div>
                   <span className="text-base">{isSelected ? '▲' : '▼'}</span>
                 </div>
               </button>

               {isSelected && details && details.user && details.user.id_user === u.id_user && (
                 <UserDetailsPanel details={details} onUpdateStatus={updateStatus} onDelete={deleteUser} />
               )}
               {isSelected && (!details || details.user?.id_user !== u.id_user) && (
                 <div className="text-center py-4 text-xs text-[#888780]">Chargement des détails...</div>
               )}
             </div>
           )
         })}
      </div>
    </div>
  )
}

function UserDetailsPanel({ details, onUpdateStatus, onDelete }) {
  if (!details) return null
  const { user, roleData, feedbacks } = details

  return (
    <div className="rounded-2xl p-5 border mt-2" style={{ background: '#F7F8F3', borderColor: '#E8E6DF' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black" style={{ color: '#2C2C2A' }}>Détails du compte</h4>
        <div className="flex gap-2">
          {['Actif', 'Suspendu', 'Banni'].map(s => (
            <button key={s} onClick={() => onUpdateStatus(user.id_user, s)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all"
              style={{ background: user.statut_compte === s ? STATUS_COLORS[s] : 'transparent', borderColor: STATUS_COLORS[s], color: user.statut_compte === s ? '#fff' : STATUS_COLORS[s] }}>
              {s}
            </button>
          ))}
          <button onClick={() => onDelete(user.id_user, `${user.prenom} ${user.nom}`)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer"
            style={{ borderColor: '#D85A30', color: '#D85A30' }}>Supprimer</button>
        </div>
      </div>

      {roleData && roleData.type === 'vendeur' && roleData.products && (
        <div className="mb-4">
          <div className="text-xs font-bold mb-2" style={{ color: '#BA7517' }}>Catalogue ({roleData.products.length} produits)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left" style={{ color: '#888780' }}>
                <th className="pb-1.5 pr-3 font-semibold">Produit</th>
                <th className="pb-1.5 pr-3 font-semibold">Prix</th>
                <th className="pb-1.5 pr-3 font-semibold">Stock</th>
                <th className="pb-1.5 font-semibold">Dernier prix</th>
              </tr></thead>
              <tbody>
                {roleData.products.map(p => (
                  <tr key={p.id_produit} className="border-t" style={{ borderColor: '#E8E6DF' }}>
                    <td className="py-1.5 pr-3 font-semibold" style={{ color: '#2C2C2A' }}>{p.nom}</td>
                    <td className="py-1.5 pr-3" style={{ color: '#2C2C2A' }}>{p.prix_reference.toLocaleString()} F</td>
                    <td className="py-1.5 pr-3" style={{ color: '#5F5E5A' }}>{p.stock_disponible}</td>
                    <td className="py-1.5" style={{ color: '#5F5E5A' }}>{p.historiques?.[p.historiques.length - 1]?.prix?.toLocaleString() || '-'} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {roleData && roleData.type !== 'admin' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {roleData.score_reputation !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{roleData.score_reputation.toFixed(1)}</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Réputation</div>
            </div>
          )}
          {roleData.total_commandes !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{roleData.total_commandes}</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Commandes</div>
            </div>
          )}
          {roleData.total_depense !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{(roleData.total_depense || 0).toLocaleString()} F</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Dépenses</div>
            </div>
          )}
          {roleData.total_ventes !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#BA7517' }}>{roleData.total_ventes}</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Ventes</div>
            </div>
          )}
          {roleData.total_revenu !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#BA7517' }}>{(roleData.total_revenu || 0).toLocaleString()} F</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Revenu</div>
            </div>
          )}
          {roleData.total_livraisons !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#D85A30' }}>{roleData.total_livraisons}</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Livraisons</div>
            </div>
          )}
          {roleData.volume_total !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: '#D85A30' }}>{(roleData.volume_total || 0).toLocaleString()} F</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Volume</div>
            </div>
          )}
          {roleData.est_disponible !== undefined && (
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff' }}>
              <div className="text-lg font-black" style={{ color: roleData.est_disponible ? '#1D9E75' : '#D85A30' }}>{roleData.est_disponible ? 'Disponible' : 'Indisponible'}</div>
              <div className="text-[10px] font-semibold" style={{ color: '#888780' }}>Statut livreur</div>
            </div>
          )}
        </div>
      )}

      {feedbacks && feedbacks.length > 0 && (
        <div>
          <div className="text-xs font-bold mb-2" style={{ color: '#2C2C2A' }}>Avis récents ({feedbacks.length})</div>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {feedbacks.map(f => (
              <div key={f.id_feedback} className="rounded-xl p-3" style={{ background: '#fff' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: '#2C2C2A' }}>{'★'.repeat(f.note)}{'☆'.repeat(5 - f.note)}</span>
                  <span className="text-[10px]" style={{ color: '#888780' }}>{f.type_feedback}</span>
                </div>
                {f.commentaire && <p className="text-[11px]" style={{ color: '#5F5E5A' }}>{f.commentaire}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {roleData && roleData.deliveries && roleData.deliveries.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold mb-2" style={{ color: '#D85A30' }}>Livraisons récentes ({roleData.deliveries.length})</div>
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left" style={{ color: '#888780' }}>
                <th className="pb-1.5 pr-3 font-semibold">Commande</th>
                <th className="pb-1.5 pr-3 font-semibold">Statut</th>
                <th className="pb-1.5 font-semibold">Date</th>
              </tr></thead>
              <tbody>
                {roleData.deliveries.map(d => (
                  <tr key={d.id_livraison} className="border-t" style={{ borderColor: '#E8E6DF' }}>
                    <td className="py-1.5 pr-3 font-semibold" style={{ color: '#2C2C2A' }}>#{d.id_commande}</td>
                    <td className="py-1.5 pr-3" style={{ color: '#5F5E5A' }}>{d.statut_livraison}</td>
                    <td className="py-1.5" style={{ color: '#5F5E5A' }}>{new Date(d.date_prise_en_charge).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {roleData && roleData.orders && roleData.orders.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold mb-2" style={{ color: '#1D9E75' }}>Commandes récentes ({roleData.orders.length})</div>
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left" style={{ color: '#888780' }}>
                <th className="pb-1.5 pr-3 font-semibold">#</th>
                <th className="pb-1.5 pr-3 font-semibold">Total</th>
                <th className="pb-1.5 font-semibold">Statut</th>
              </tr></thead>
              <tbody>
                {roleData.orders.map(o => (
                  <tr key={o.id_commande} className="border-t" style={{ borderColor: '#E8E6DF' }}>
                    <td className="py-1.5 pr-3 font-semibold" style={{ color: '#2C2C2A' }}>#{o.id_commande}</td>
                    <td className="py-1.5 pr-3" style={{ color: '#2C2C2A' }}>{o.total_marchandises.toLocaleString()} F</td>
                    <td className="py-1.5" style={{ color: '#5F5E5A' }}>{o.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [priceHistory, setPriceHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/products').then(d => { setProducts(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.nom?.toLowerCase().includes(search.toLowerCase()))

  async function showPriceHistory(id) {
    try {
      const h = await api.get(`/admin/products/${id}/price-history`)
      setPriceHistory(h)
    } catch { setPriceHistory([]) }
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="text" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
        className="rounded-2xl px-4 py-3 text-sm outline-none border" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }} />

      {loading ? <div className="text-center py-8 text-sm text-[#888780]">Chargement...</div> :
       <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#E8E6DF' }}>
         <table className="w-full text-xs" style={{ background: '#fff' }}>
           <thead><tr className="text-left" style={{ background: '#F7F8F3', color: '#888780' }}>
             <th className="p-3 font-semibold">Produit</th>
             <th className="p-3 font-semibold">Vendeur</th>
             <th className="p-3 font-semibold">Marché</th>
             <th className="p-3 font-semibold text-right">Prix</th>
             <th className="p-3 font-semibold text-right">Stock</th>
             <th className="p-3 font-semibold text-right">Dernier prix</th>
             <th className="p-3 font-semibold"></th>
           </tr></thead>
           <tbody>
             {filtered.map(p => (
               <tr key={p.id_produit} className="border-t" style={{ borderColor: '#F1EFE8' }}>
                 <td className="p-3 font-bold" style={{ color: '#2C2C2A' }}>{p.nom}</td>
                 <td className="p-3" style={{ color: '#5F5E5A' }}>{p.vendeur?.nom_etablissement || '-'}</td>
                 <td className="p-3" style={{ color: '#5F5E5A' }}>{p.vendeur?.localisation_marche || '-'}</td>
                 <td className="p-3 text-right font-bold" style={{ color: '#2C2C2A' }}>{p.prix_reference?.toLocaleString()} F</td>
                 <td className="p-3 text-right" style={{ color: p.stock_disponible > 0 ? '#1D9E75' : '#D85A30' }}>{p.stock_disponible}</td>
                 <td className="p-3 text-right" style={{ color: '#888780' }}>{p.historiques?.[0]?.prix?.toLocaleString() || '-'} F</td>
                 <td className="p-3 text-right">
                   <button onClick={() => showPriceHistory(p.id_produit)} className="text-xs font-bold cursor-pointer" style={{ color: '#1D9E75', background: 'none', border: 'none' }}>
                     Historique
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
      }

      {priceHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPriceHistory(null)}>
          <div className="rounded-2xl p-6 border max-w-lg w-full max-h-[70vh] overflow-y-auto" style={{ background: 'hsl(250, 25%, 10%)', borderColor: '#333' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white">Historique des prix</h3>
              <button onClick={() => setPriceHistory(null)} className="text-white/60 hover:text-white text-lg cursor-pointer" style={{ background: 'none', border: 'none' }}>✕</button>
            </div>
            {priceHistory.length === 0 ? <div className="text-sm text-white/60 text-center py-4">Aucun historique</div> :
             <div className="flex flex-col gap-2">
               {priceHistory.map(h => (
                 <div key={h.id_historique} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                   <span className="text-sm font-bold text-white">{h.prix.toLocaleString()} F</span>
                   <span className="text-xs text-white/50">{new Date(h.date_modification).toLocaleDateString()}</span>
                 </div>
               ))}
             </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

function SignalementsTab() {
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)

  function fetchSignalements() {
    setLoading(true)
    api.get('/admin/signalements').then(d => { setSignalements(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchSignalements() }, []) // eslint-disable-line react-hooks/set-state-in-effect

  async function updateStatus(id, status) {
    try {
      await api.put(`/admin/signalements/${id}`, { statut_traitement: status })
      fetchSignalements()
    } catch (e) { alert(e.message) }
  }

  const col = (s) => s.statut_traitement === 'En attente' ? '#D85A30' : s.statut_traitement === 'Traite' ? '#BA7517' : '#1D9E75'

  return (
    <div className="flex flex-col gap-2">
      {loading ? <div className="text-center py-8 text-sm text-[#888780]">Chargement...</div> :
       signalements.length === 0 ? <div className="text-center py-8 text-sm text-[#888780]">Aucun signalement</div> :
       signalements.map(s => (
         <div key={s.id_signalement} className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
           <div className="flex items-start justify-between mb-2">
             <div>
               <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${col(s)}18`, color: col(s) }}>{s.statut_traitement}</span>
               <span className="text-xs ml-2" style={{ color: '#888780' }}>{s.type_cible_cible}</span>
             </div>
             <span className="text-[10px]" style={{ color: '#888780' }}>{new Date(s.date_heure).toLocaleDateString()}</span>
           </div>
           <p className="text-sm font-semibold mb-2" style={{ color: '#2C2C2A' }}>{s.motif}</p>
           <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#888780' }}>
             <span>De: {s.auteur?.prenom} {s.auteur?.nom}</span>
             <span>Vers: {s.cible?.prenom} {s.cible?.nom}</span>
           </div>
           <div className="flex gap-2">
             {['En attente', 'Traite', 'Classe'].map(st => (
               <button key={st} onClick={() => updateStatus(s.id_signalement, st)}
                 className="text-[10px] font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all"
                 style={{ background: s.statut_traitement === st ? col(s) : 'transparent', borderColor: col(s), color: s.statut_traitement === st ? '#fff' : col(s) }}>
                 {st}
               </button>
             ))}
           </div>
         </div>
       ))}
    </div>
  )
}

function LitigesTab() {
  const [litiges, setLitiges] = useState([])
  const [resolving, setResolving] = useState(null)
  const [loading, setLoading] = useState(true)

  function fetchLitiges() {
    setLoading(true)
    api.get('/admin/litiges').then(d => { setLitiges(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchLitiges() }, []) // eslint-disable-line react-hooks/set-state-in-effect

  async function handleResolve(id, decision, montant) {
    try {
      await api.put(`/admin/litiges/${id}/resolve`, { decision_admin: decision, montant_rembourse: parseFloat(montant) || 0 })
      setResolving(null)
      fetchLitiges()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? <div className="text-center py-8 text-sm text-[#888780]">Chargement...</div> :
       litiges.length === 0 ? <div className="text-center py-8 text-sm text-[#888780]">Aucun litige</div> :
       litiges.map(l => (
         <div key={l.id_litige} className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#E8E6DF' }}>
           <div className="flex items-start justify-between mb-2">
             <div>
               <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                 style={{ background: l.statut === 'Ouvert' ? '#D85A3018' : '#1D9E7518', color: l.statut === 'Ouvert' ? '#D85A30' : '#1D9E75' }}>
                 {l.statut}
               </span>
               {l.decision_admin && <span className="text-xs ml-2 font-semibold" style={{ color: '#BA7517' }}>{l.decision_admin}</span>}
             </div>
             <span className="text-[10px]" style={{ color: '#888780' }}>{new Date(l.date_ouverture).toLocaleDateString()}</span>
           </div>

           <p className="text-sm font-semibold mb-2" style={{ color: '#2C2C2A' }}>{l.description}</p>

           {l.livraison && (
             <div className="text-xs mb-2" style={{ color: '#888780' }}>
               Commande #{l.livraison.id_commande} · Livreur: {l.livraison.livreur?.utilisateur?.prenom} {l.livraison.livreur?.utilisateur?.nom} ·
               Client: {l.livraison.commande?.client?.utilisateur?.prenom} {l.livraison.commande?.client?.utilisateur?.nom}
             </div>
           )}

           {l.detailsCommande && l.detailsCommande.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mb-3">
               {l.detailsCommande.map(d => (
                 <span key={`${d.id_commande}-${d.id_produit}`} className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>
                   {d.produit?.nom} ×{d.quantite_commandee}
                 </span>
               ))}
             </div>
           )}

          {l.montant_rembourse > 0 && (
             <div className="text-xs font-bold mb-2" style={{ color: '#D85A30' }}>Remboursement: {l.montant_rembourse.toLocaleString()} F</div>
           )}

           {l.statut === 'Ouvert' && (
             resolving === l.id_litige ? (
               <ResolveForm litige={l} onResolve={handleResolve} onCancel={() => setResolving(null)} />
             ) : (
               <button onClick={() => setResolving(l.id_litige)} className="text-xs font-bold px-4 py-2 rounded-full cursor-pointer border"
                 style={{ borderColor: '#1D9E75', color: '#1D9E75', background: 'transparent' }}>
                 Résoudre le litige
               </button>
             )
           )}
         </div>
       ))}
    </div>
  )
}

function ResolveForm({ litige, onResolve, onCancel }) {
  const [decision, setDecision] = useState('')
  const [montant, setMontant] = useState('0')

  return (
    <div className="rounded-xl p-4 mt-2" style={{ background: '#F7F8F3' }}>
      <select value={decision} onChange={e => setDecision(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none border mb-2" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }}>
        <option value="">Sélectionner une décision</option>
        <option value="Remboursement total">Remboursement total</option>
        <option value="Remboursement partiel">Remboursement partiel</option>
        <option value="Rejet du litige">Rejet du litige</option>
        <option value="Annulation commande">Annulation commande</option>
      </select>
      <input type="number" placeholder="Montant remboursé (F)" value={montant} onChange={e => setMontant(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none border mb-2" style={{ background: '#fff', borderColor: '#E8E6DF', color: '#2C2C2A' }} />
      <div className="flex gap-2">
        <button onClick={() => onResolve(litige.id_litige, decision, montant)} disabled={!decision}
          className="flex-1 text-xs font-bold py-2.5 rounded-xl cursor-pointer border-none" style={{ background: !decision ? '#ccc' : '#1D9E75', color: '#fff' }}>
          Confirmer
        </button>
        <button onClick={onCancel} className="text-xs font-bold py-2.5 rounded-xl cursor-pointer" style={{ background: 'transparent', border: '1px solid #E8E6DF', color: '#888780' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}
