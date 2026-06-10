import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import MobileDrawer from '../../components/MobileDrawer'
import { LayoutDashboard, Users, Package, MapPin, Flag, Scale, User, DollarSign, TrendingUp, Store, Motorbike, ShoppingCart, Shield, Mail, Smartphone, Lock, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Building, ChevronDown, LogOut, Star, ArrowRight } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={14} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={14} /> },
  { id: 'products', label: 'Produits', icon: <Package size={14} /> },
  { id: 'marchés', label: 'Marchés', icon: <MapPin size={14} /> },
  { id: 'signalements', label: 'Signalements', icon: <Flag size={14} /> },
  { id: 'litiges', label: 'Litiges', icon: <Scale size={14} /> },
  { id: 'profil', label: 'Mon Profil', icon: <User size={14} /> },
]

const ADMIN_NAV_TABS = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '__dashboard' },
  { icon: Users, label: 'Utilisateurs', path: '__users' },
  { icon: Package, label: 'Produits', path: '__products' },
  { icon: MapPin, label: 'Marchés', path: '__marchés' },
  { icon: Flag, label: 'Signalements', path: '__signalements' },
  { icon: Scale, label: 'Litiges', path: '__litiges' },
  { icon: User, label: 'Mon Profil', path: '__profil' },
]

const STATUS_COLORS = { Actif: '#1D9E75', Suspendu: '#BA7517', Banni: '#D85A30' }

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [tabFilter, setTabFilter] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [productRankings, setProductRankings] = useState(null)
  const [admin] = useState(() => {
    const stored = localStorage.getItem('vc_user')
    const user = stored ? JSON.parse(stored) : null
    return user?.est_admin ? user : null
  })

  useEffect(() => {
    if (!admin) navigate('/accueil')
  }, [admin, navigate])

  if (!admin) return null

  function navigateTo(tabId, filter = null) {
    setTabFilter(filter)
    setTab(tabId)
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      <Header admin={admin} onLogout={() => { localStorage.clear(); navigate('/accueil') }} tab={tab} onTabChange={(t) => { setTabFilter(null); setTab(t) }} />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {tab === 'dashboard' && <DashboardTab onNavigate={navigateTo} onLeaderboardReady={setLeaderboardData} onProductRankingsReady={setProductRankings} />}
        {tab === 'users' && <UsersTab initialFilter={tabFilter} leaderboardData={leaderboardData} />}
        {tab === 'products' && <ProductsTab initialFilter={tabFilter} productRankings={productRankings} />}
        {tab === 'marchés' && <MarketsTab />}
        {tab === 'signalements' && <SignalementsTab initialFilter={tabFilter} />}
        {tab === 'litiges' && <LitigesTab initialFilter={tabFilter} />}
        {tab === 'profil' && <ProfilTab admin={admin} onLogout={() => { localStorage.clear(); navigate('/accueil') }} />}
      </main>
    </div>
  )
}

function Header({ admin, onLogout, tab, onTabChange }) {
  const initials = (admin.prenom?.[0] || '') + (admin.nom?.[0] || '')
  const accentColor = '#1D9E75'

  const adminTabsWithHandlers = ADMIN_NAV_TABS.map(t => ({
    ...t,
    path: t.path,
  }))

  return (
    <div className="sticky top-0 z-50" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #0F6E56 100%)` }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <MobileDrawer
              navTabs={adminTabsWithHandlers}
              accentColor={accentColor}
              brandLabel="Admin ViteComm"
              onLogout={onLogout}
              currentTab={`__${tab}`}
              onTabSelect={(path) => {
                const tabId = path.replace('__', '')
                onTabChange(tabId)
              }}
            />
            <button onClick={() => onTabChange('profil')} className="cursor-pointer">
              {admin.photo_url ? (
                <img src={admin.photo_url} alt="" className="w-9 h-9 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-sm font-black text-[#1D9E75]">
                  {initials}
                </div>
              )}
            </button>
            <div>
              <div className="text-white font-black text-sm">Console de Supervision Globale</div>
              <div className="text-white/60 text-xs">
                {admin.prenom} {admin.nom} · Administrateur
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="hidden sm:block text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Déconnexion
          </button>
        </div>
        {/* Desktop tab bar — hidden on mobile */}
        <div className="hidden md:flex gap-1 overflow-x-auto pb-1 scrollbar-none">
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

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-5 border transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function DashboardTab({ onNavigate, onLeaderboardReady, onProductRankingsReady }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard').then(d => {
      setData(d)
      onLeaderboardReady?.(d.classements)
      onProductRankingsReady?.({ populaires: d.produits_populaires, refuses: d.produits_refuses })
    }).catch(e => setErr(e.message))
  }, [])

  if (err) return <div className="text-center py-12 text-sm font-semibold" style={{ color: '#D85A30' }}><AlertTriangle size={14} className="inline align-middle mr-1" />{err}</div>
  if (!data) return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div>

  const { financier, compteur, alertes, produits_populaires, produits_refuses, classements } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ventes totales" value={`${(financier.total_ventes || 0).toLocaleString()} F`} icon={<DollarSign size={20} />} color="#1D9E75" onClick={() => onNavigate('users', { role: 'vendeur', sortBy: 'ca_desc' })} />
        <StatCard label="Commissions" value={`${(financier.total_commissions_plateforme || 0).toLocaleString()} F`} icon={<TrendingUp size={20} />} color="#0F6E56" onClick={() => onNavigate('users', { role: 'vendeur', sortBy: 'ca_desc' })} />
        <StatCard label="Litiges ouverts" value={alertes.litiges_ouverts} icon={<Scale size={20} />} color="#D85A30" onClick={() => onNavigate('litiges', { status: 'Ouvert' })} />
        <StatCard label="Signalements en attente" value={alertes.signalements_en_attente} icon={<Flag size={20} />} color="#BA7517" onClick={() => onNavigate('signalements', { status: 'En attente' })} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Utilisateurs" value={compteur?.total_utilisateurs || 0} icon={<Users size={20} />} color="#1D9E75" onClick={() => onNavigate('users')} />
        <StatCard label="Vendeurs" value={compteur?.total_vendeurs || 0} icon={<Store size={20} />} color="#BA7517" onClick={() => onNavigate('users', { role: 'vendeur', sortBy: 'ca_desc' })} />
        <StatCard label="Livreurs" value={compteur?.total_livreurs || 0} icon={<Motorbike size={20} />} color="#D85A30" onClick={() => onNavigate('users', { role: 'livreur', sortBy: 'volume_desc' })} />
        <StatCard label="Commandes actives" value={compteur?.commandes_actives || 0} icon={<ShoppingCart size={20} />} color="#0F6E56" onClick={() => onNavigate('users', { sortBy: 'orders_desc' })} />
      </div>

      <LeaderboardSection data={classements} onNavigate={onNavigate} />
      <ProductRanking title="Produits les plus populaires" items={produits_populaires} color="#1D9E75" onClick={() => onNavigate('products', { sortBy: 'popularite' })} />
      <ProductRanking title="Produits les plus refusés" items={produits_refuses} color="#D85A30" onClick={() => onNavigate('products', { sortBy: 'refus' })} />
    </div>
  )
}

function LeaderboardSection({ data, onNavigate }) {
  if (!data) return null
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LeaderboardCard title={<span className="flex items-center gap-1.5"><Store size={14} /> Vendeurs (CA)</span>} items={data.vendeurs} valueKey="chiffre_affaires" unit="F" color="#BA7517" onClick={() => onNavigate('users', { role: 'vendeur', sortBy: 'ca_desc' })} />
        <LeaderboardCard title={<span className="flex items-center gap-1.5"><Motorbike size={14} /> Livreurs (Volume)</span>} items={data.livreurs} valueKey="volume_livre" unit="F" color="#D85A30" onClick={() => onNavigate('users', { role: 'livreur', sortBy: 'volume_desc' })} />
        <LeaderboardCard title={<span className="flex items-center gap-1.5"><ShoppingCart size={14} /> Clients (Achats)</span>} items={data.clients} valueKey="volume_achat" unit="F" color="#1D9E75" onClick={() => onNavigate('users', { role: 'client', sortBy: 'depense_desc' })} />
      </div>
      {data.vendeurs_reputation && data.vendeurs_reputation.length > 0 && (
        <LeaderboardCard title={<span className="flex items-center gap-1.5"><Star size={14} /> Vendeurs (Réputation)</span>} items={data.vendeurs_reputation} valueKey="score_reputation" unit="/100" color="#BA7517" onClick={() => onNavigate('users', { role: 'vendeur', sortBy: 'reputation_desc' })} />
      )}
    </div>
  )
}

function LeaderboardCard({ title, items, valueKey, unit, color, onClick }) {
  if (!items || items.length === 0) return null
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-5 border transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {onClick && <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <div className="flex flex-col gap-2.5">
        {items.slice(0, 5).map((item, i) => (
          <div key={item.id_user} className="flex items-center gap-3">
            <span className="w-5 text-xs font-black" style={{ color: i < 3 ? color : 'var(--text-muted)' }}>#{i + 1}</span>
             <div className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: item.photo_url ? `url(${item.photo_url})` : 'none', background: item.photo_url ? undefined : 'var(--border)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {item.nom_etablissement || `${item.prenom} ${item.nom}`}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.prenom} {item.nom}</div>
            </div>
            <span className="text-xs font-black flex-shrink-0" style={{ color }}>{(item[valueKey] || 0).toLocaleString()} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductRanking({ title, items, color, onClick }) {
  if (!items || items.length === 0) return null
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-5 border transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]' : ''}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {onClick && <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left" style={{ color: 'var(--text-muted)' }}>
            <th className="pb-2 pr-3 font-semibold">Produit</th>
            <th className="pb-2 pr-3 font-semibold">Vendeur</th>
            <th className="pb-2 pr-3 font-semibold">Marché</th>
            <th className="pb-2 pr-3 font-semibold text-right">Qté</th>
            <th className="pb-2 font-semibold text-right">Prix</th>
          </tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id_produit} className="border-t" style={{ borderColor: 'var(--border-light)' }}>
                <td className="py-2.5 pr-3 font-bold" style={{ color: 'var(--text-primary)' }}>{p.nom}</td>
                <td className="py-2.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{p.vendeur?.nom_etablissement || '-'}</td>
                <td className="py-2.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{p.vendeur?.localisation_marche || '-'}</td>
                <td className="py-2.5 pr-3 text-right font-bold" style={{ color }}>{p.quantite}</td>
                <td className="py-2.5 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{p.prix_reference?.toLocaleString()} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

function UsersTab({ initialFilter, leaderboardData }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('tous')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [sortBy, setSortBy] = useState('name')
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (initialFilter?.role) setRoleFilter(initialFilter.role)
    if (initialFilter?.status) setStatusFilter(initialFilter.status)
    if (initialFilter?.sortBy) setSortBy(initialFilter.sortBy)
  }, [initialFilter])

  function fetchUsers() {
    setLoading(true)
    api.get('/admin/users').then(d => { setUsers(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, []) // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [search, roleFilter, statusFilter, sortBy])

  const roles = ['tous', 'client', 'vendeur', 'livreur', 'admin']
  const statuses = ['tous', 'Actif', 'Suspendu', 'Banni']

  const sortOptions = [
    { value: 'name', label: 'Nom (A-Z)' },
    { value: 'ca_desc', label: 'CA décroissant' },
    { value: 'ca_asc', label: 'CA croissant' },
    { value: 'reputation_desc', label: 'Réputation ↓' },
    { value: 'volume_desc', label: 'Volume livré ↓' },
    { value: 'depense_desc', label: 'Dépenses ↓' },
    { value: 'orders_desc', label: 'Commandes ↓' },
  ]

  const filtered = users.filter(u => {
    const name = `${u.nom} ${u.prenom} ${u.email}`.toLowerCase()
    const role = u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin'
    return name.includes(search.toLowerCase()) &&
      (roleFilter === 'tous' || role === roleFilter) &&
      (statusFilter === 'tous' || u.statut_compte === statusFilter)
  })

  const leaderboardMap = {
    vendeur: leaderboardData?.vendeurs || [],
    livreur: leaderboardData?.livreurs || [],
    client: leaderboardData?.clients || [],
  }
  const reputationMap = leaderboardData?.vendeurs_reputation || []
  const lbIndex = (id, list) => { const i = list.findIndex(x => x.id_user === id); return i >= 0 ? i : 9999 }

  const sorted = [...filtered].sort((a, b) => {
    const role = u => u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin'
    const aRole = role(a), bRole = role(b)
    switch (sortBy) {
      case 'ca_desc': return lbIndex(a.id_user, leaderboardMap[aRole]) - lbIndex(b.id_user, leaderboardMap[bRole])
      case 'ca_asc': return lbIndex(b.id_user, leaderboardMap[aRole]) - lbIndex(a.id_user, leaderboardMap[bRole])
      case 'reputation_desc': return lbIndex(a.id_user, reputationMap) - lbIndex(b.id_user, reputationMap)
      case 'volume_desc': return lbIndex(a.id_user, leaderboardMap.livreur) - lbIndex(b.id_user, leaderboardMap.livreur)
      case 'depense_desc': return lbIndex(a.id_user, leaderboardMap.client) - lbIndex(b.id_user, leaderboardMap.client)
      case 'orders_desc': {
        const aOrders = leaderboardMap.client.find(x => x.id_user === a.id_user)?.commandes_count || 0
        const bOrders = leaderboardMap.client.find(x => x.id_user === b.id_user)?.commandes_count || 0
        return bOrders - aOrders
      }
      default: return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    }
  })

  const visibleItems = sorted.slice(0, visibleCount)
  const hasMore = sorted.length > visibleCount

  function getRole(u) { return u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin' }
  function getRoleIcon(u) { const r = getRole(u); return r === 'client' ? <ShoppingCart size={16} /> : r === 'vendeur' ? <Store size={16} /> : r === 'livreur' ? <Motorbike size={16} /> : <Shield size={16} /> }

  async function loadDetails(id) {
    if (id == null) { setSelected(null); setDetails(null); return }
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
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {roles.map(r => <option key={r} value={r}>{r === 'tous' ? 'Tous les rôles' : r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {statuses.map(s => <option key={s} value={s}>{s === 'tous' ? 'Tous les statuts' : s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div> :
         filtered.length === 0 ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun utilisateur trouvé</div> :
         visibleItems.map(u => {
           const isSelected = selected === u.id_user
           const role = getRole(u)
           const photoUrl = u.photo_url
           return (
             <div key={u.id_user}>
               <button onClick={() => loadDetails(isSelected ? null : u.id_user)}
                 className="w-full text-left rounded-2xl p-4 border transition-all cursor-pointer"
                   style={{ background: isSelected ? '#E1F5EE' : 'var(--surface)', borderColor: isSelected ? '#9FE1CB' : 'var(--border)' }}>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-cover bg-center flex-shrink-0 flex items-center justify-center text-lg"
                     style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : { background: 'var(--border-light)' }}>
                     {!photoUrl && getRoleIcon(u)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{u.prenom} {u.nom}</span>
                       <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[u.statut_compte]}18`, color: STATUS_COLORS[u.statut_compte] }}>{u.statut_compte}</span>
                     </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.email} · {u.telephone} · Rôle: {role}</div>
                  </div>
                </div>
                </button>

                {isSelected && details && details.user && details.user.id_user === u.id_user && (
                  <UserDetailModal details={details} onClose={() => { setSelected(null); setDetails(null) }} onUpdateStatus={updateStatus} onDelete={deleteUser} />
                )}
           </div>
            )
          })}
          {hasMore && (
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <ChevronDown size={16} /> Charger plus ({sorted.length - visibleCount} restant(s))
            </button>
          )}
       </div>
     </div>
   )
}

function UserDetailModal({ details, onClose, onUpdateStatus, onDelete }) {
  if (!details || !details.user) return null
  const { user, roleData, feedbacks } = details
  const role = user.client ? 'client' : user.vendeur ? 'vendeur' : user.livreur ? 'livreur' : 'admin'
  const initials = (user.prenom?.[0] || '') + (user.nom?.[0] || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <div className="rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Profil Utilisateur</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ border: 'none', background: 'var(--surface-alt)', color: 'var(--text-muted)' }}>
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center mb-5">
            {user.photo_url ? (
              <img src={user.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 shadow-md"
                style={{ borderColor: 'var(--surface)' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)' }}>
                {initials}
              </div>
            )}
            <h2 className="text-lg font-black mt-3" style={{ color: 'var(--text-primary)' }}>{user.prenom} {user.nom}</h2>
            <span className="text-xs px-3 py-1 rounded-full font-semibold mt-1"
              style={{ background: `${STATUS_COLORS[user.statut_compte]}18`, color: STATUS_COLORS[user.statut_compte] }}>
              {user.statut_compte} · {role}
            </span>
          </div>

          {/* Info rows */}
          <div className="flex flex-col gap-2 mb-5">
            <InfoRow label="Email" value={user.email} icon={<Mail size={14} />} />
            <InfoRow label="Telephone" value={user.telephone || '—'} icon={<Smartphone size={14} />} />
            {user.date_inscription && (
              <InfoRow label="Inscrit le" value={new Date(user.date_inscription).toLocaleDateString()} icon={<Flag size={14} />} />
            )}
          </div>

          {/* Role-specific stats */}
          {roleData && role !== 'admin' && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {roleData.score_reputation !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{roleData.score_reputation.toFixed(1)}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Reputation</div>
                </div>
              )}
              {roleData.total_commandes !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{roleData.total_commandes}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Commandes</div>
                </div>
              )}
              {roleData.total_depense !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#1D9E75' }}>{(roleData.total_depense || 0).toLocaleString()} F</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Depenses</div>
                </div>
              )}
              {roleData.total_ventes !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#BA7517' }}>{roleData.total_ventes}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Ventes</div>
                </div>
              )}
              {roleData.total_revenu !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#BA7517' }}>{(roleData.total_revenu || 0).toLocaleString()} F</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Revenu</div>
                </div>
              )}
              {roleData.total_livraisons !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#D85A30' }}>{roleData.total_livraisons}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Livraisons</div>
                </div>
              )}
              {roleData.volume_total !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: '#D85A30' }}>{(roleData.volume_total || 0).toLocaleString()} F</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Volume</div>
                </div>
              )}
              {roleData.est_disponible !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-lg font-black" style={{ color: roleData.est_disponible ? '#1D9E75' : '#D85A30' }}>{roleData.est_disponible ? 'Disponible' : 'Indisponible'}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Statut livreur</div>
                </div>
              )}
            </div>
          )}

          {/* Vendor catalogue */}
          {roleData && roleData.type === 'vendeur' && roleData.products && roleData.products.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#BA7517' }}>
                <Package size={14} /> Catalogue ({roleData.products.length} produits)
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {roleData.products.map(p => (
                  <div key={p.id_produit} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'var(--surface-alt)' }}>
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.nom}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{p.prix_reference?.toLocaleString()} F</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Driver deliveries */}
          {roleData && roleData.deliveries && roleData.deliveries.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#D85A30' }}>
                <Motorbike size={14} /> Livraisons recentes ({roleData.deliveries.length})
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {roleData.deliveries.map(d => (
                  <div key={d.id_livraison} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'var(--surface-alt)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Commande #{d.id_commande}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.statut_livraison}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client orders */}
          {roleData && roleData.orders && roleData.orders.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#1D9E75' }}>
                <ShoppingCart size={14} /> Commandes recentes ({roleData.orders.length})
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {roleData.orders.map(o => (
                  <div key={o.id_commande} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'var(--surface-alt)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>#{o.id_commande} — {o.total_marchandises?.toLocaleString()} F</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{o.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedbacks */}
          {feedbacks && feedbacks.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Flag size={14} /> Avis recents ({feedbacks.length})
              </div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {feedbacks.map(f => (
                  <div key={f.id_feedback} className="rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: '#BA7517' }}>{'★'.repeat(f.note)}{'☆'.repeat(5 - f.note)}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.type_feedback}</span>
                    </div>
                    {f.commentaire && <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{f.commentaire}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {['Actif', 'Suspendu', 'Banni'].map(s => (
              <button key={s} onClick={() => onUpdateStatus(user.id_user, s)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all"
                style={{ background: user.statut_compte === s ? STATUS_COLORS[s] : 'transparent', borderColor: STATUS_COLORS[s], color: user.statut_compte === s ? '#fff' : STATUS_COLORS[s] }}>
                {s}
              </button>
            ))}
            <button onClick={() => { onDelete(user.id_user, `${user.prenom} ${user.nom}`); onClose() }}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ml-auto"
              style={{ borderColor: '#D85A30', color: '#D85A30', background: 'transparent' }}>
              <Trash2 size={10} className="inline align-middle mr-1" /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductsTab({ initialFilter, productRankings }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceHistory, setPriceHistory] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (initialFilter?.sortBy) setSortBy(initialFilter.sortBy)
  }, [initialFilter])

  useEffect(() => {
    api.get('/admin/products').then(d => { setProducts(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [search, sortBy])

  const filtered = products.filter(p => p.nom?.toLowerCase().includes(search.toLowerCase()))

  const popularityMap = {}
  const refusalMap = {}
  if (productRankings?.populaires) productRankings.populaires.forEach((p, i) => { popularityMap[p.id_produit] = i })
  if (productRankings?.refuses) productRankings.refuses.forEach((p, i) => { refusalMap[p.id_produit] = i })

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'popularite': return (popularityMap[a.id_produit] ?? 9999) - (popularityMap[b.id_produit] ?? 9999)
      case 'refus': return (refusalMap[a.id_produit] ?? 9999) - (refusalMap[b.id_produit] ?? 9999)
      case 'prix_desc': return (b.prix_reference || 0) - (a.prix_reference || 0)
      case 'prix_asc': return (a.prix_reference || 0) - (b.prix_reference || 0)
      case 'stock_desc': return (b.stock_disponible || 0) - (a.stock_disponible || 0)
      case 'stock_asc': return (a.stock_disponible || 0) - (b.stock_disponible || 0)
      default: return (a.nom || '').localeCompare(b.nom || '')
    }
  })

  const visibleItems = sorted.slice(0, visibleCount)
  const hasMore = sorted.length > visibleCount

  async function showPriceHistory(id) {
    try {
      const h = await api.get(`/admin/products/${id}/price-history`)
      setPriceHistory(h)
    } catch { setPriceHistory([]) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="name">Nom (A-Z)</option>
          <option value="popularite">Popularité décroissante</option>
          <option value="refus">Refus décroissant</option>
          <option value="prix_desc">Prix décroissant</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="stock_desc">Stock décroissant</option>
          <option value="stock_asc">Stock croissant</option>
        </select>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div> :
       sorted.length === 0 ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun produit trouvé</div> :
       <div className="flex flex-col gap-3">
         {visibleItems.map(p => (
           <div key={p.id_produit} className="rounded-2xl p-4 border flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm"
             style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
             onClick={() => setDetailProduct(p)}>
             {/* Product image */}
             <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
               style={{ background: 'var(--surface-alt)' }}>
               {p.photo_url ? (
                 <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" />
               ) : (
                 <Package size={20} style={{ color: 'var(--text-muted)' }} />
               )}
             </div>
             {/* Info */}
             <div className="flex-1 min-w-0">
               <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
               <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.vendeur?.nom_etablissement || '—'} · {p.vendeur?.localisation_marche || '—'}</div>
             </div>
             {/* Price + stock */}
             <div className="text-right flex-shrink-0">
               <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{p.prix_reference?.toLocaleString()} F</div>
               <div className="text-[10px] font-semibold" style={{ color: p.stock_disponible > 0 ? '#1D9E75' : '#D85A30' }}>Stock: {p.stock_disponible}</div>
             </div>
             <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
           </div>
         ))}
       </div>
      }

      {hasMore && (
        <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <ChevronDown size={16} /> Charger plus ({filtered.length - visibleCount} restant(s))
        </button>
      )}

      {/* Product detail modal */}
      {detailProduct && (
        <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} onShowHistory={showPriceHistory} />
      )}

      {priceHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPriceHistory(null)}>
          <div className="rounded-2xl p-6 border max-w-lg w-full max-h-[70vh] overflow-y-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Historique des prix</h3>
              <button onClick={() => setPriceHistory(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }} className="hover:opacity-80 text-lg cursor-pointer">✕</button>
            </div>
            {priceHistory.length === 0 ? <div className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Aucun historique</div> :
             <div className="flex flex-col gap-2">
               {priceHistory.map(h => (
                 <div key={h.id_historique} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-alt)' }}>
                   <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{h.prix.toLocaleString()} F</span>
                   <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(h.date_modification).toLocaleDateString()}</span>
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

function ProductDetailModal({ product, onClose, onShowHistory }) {
  const p = product
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <div className="rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Details du Produit</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ border: 'none', background: 'var(--surface-alt)', color: 'var(--text-muted)' }}>
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Product image */}
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 flex items-center justify-center"
            style={{ background: 'var(--surface-alt)' }}>
            {p.photo_url ? (
              <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" />
            ) : (
              <Package size={48} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>

          {/* Product name */}
          <h2 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>{p.nom}</h2>
          {p.description && <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
              <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{p.prix_reference?.toLocaleString()} F</div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Prix</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
              <div className="text-lg font-black" style={{ color: p.stock_disponible > 0 ? '#1D9E75' : '#D85A30' }}>{p.stock_disponible}</div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Stock</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
              <div className="text-lg font-black" style={{ color: 'var(--text-muted)' }}>{p.categorie?.nom || '—'}</div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Categorie</div>
            </div>
          </div>

          {/* Info rows */}
          <div className="flex flex-col gap-2 mb-5">
            <InfoRow label="Vendeur" value={p.vendeur?.nom_etablissement || '—'} icon={<Store size={14} />} />
            <InfoRow label="Marche" value={p.vendeur?.localisation_marche || '—'} icon={<MapPin size={14} />} />
            {p.historiques && p.historiques.length > 0 && (
              <InfoRow label="Dernier prix enregistre" value={`${p.historiques[0]?.prix?.toLocaleString() || '—'} F`} icon={<DollarSign size={14} />} />
            )}
          </div>

          {/* Action button */}
          <button onClick={() => { onClose(); onShowHistory(p.id_produit) }}
            className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: '#1D9E75' }}>
            <TrendingUp size={14} /> Voir l'historique des prix
          </button>
        </div>
      </div>
    </div>
  )
}

function SignalementsTab({ initialFilter }) {
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState('tous')

  useEffect(() => {
    if (initialFilter?.status) setStatusFilter(initialFilter.status)
  }, [initialFilter])

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

  const filtered = signalements.filter(s => statusFilter === 'tous' || s.statut_traitement === statusFilter)
  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [statusFilter])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {['tous', 'En attente', 'Traite', 'Classe'].map(s => <option key={s} value={s}>{s === 'tous' ? 'Tous les statuts' : s}</option>)}
        </select>
      </div>
      {loading ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div> :
       filtered.length === 0 ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun signalement</div> :
       visibleItems.map(s => (
         <div key={s.id_signalement} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
           <div className="flex items-start justify-between mb-2">
             <div>
               <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${col(s)}18`, color: col(s) }}>{s.statut_traitement}</span>
               <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{s.type_cible_cible}</span>
             </div>
             <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(s.date_heure).toLocaleDateString()}</span>
           </div>
           <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{s.motif}</p>
           <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
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
           {hasMore && (
             <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
               className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
               style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
               <ChevronDown size={16} /> Charger plus ({sorted.length - visibleCount} restant(s))
             </button>
           )}
    </div>
  )
}

/* ─── PROFIL TAB ─── */
function ProfilTab({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', confirm: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/admin/me').then(d => {
      setProfile(d)
      setForm({ nom: d.nom, prenom: d.prenom, email: d.email, telephone: d.telephone || '', mot_de_passe: '', confirm: '' })
    }).catch(e => setErr(e.message))
  }, [])

  function show(msg, isErr) {
    const fn = isErr ? setErr : setMsg
    fn(msg); setTimeout(() => fn(''), 4000)
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.email) return show('Nom, prénom et email requis.', true)
    if (form.mot_de_passe && form.mot_de_passe !== form.confirm) return show('Les mots de passe ne correspondent pas.', true)
    if (form.mot_de_passe && form.mot_de_passe.length < 8) return show('Le mot de passe doit faire au moins 8 caractères.', true)
    setSaving(true); setErr('')
    try {
      const body = new FormData()
      body.set('nom', form.nom)
      body.set('prenom', form.prenom)
      body.set('email', form.email)
      body.set('telephone', form.telephone)
      if (photoFile) body.set('photo', photoFile)
      if (form.mot_de_passe) body.set('mot_de_passe', form.mot_de_passe)

      const res = await api.put('/admin/profile', body)
      setProfile(res)
      localStorage.setItem('vc_user', JSON.stringify(res))
      setEdit(false)
      setPhotoFile(null)
      setPhotoPreview('')
      show('Profil mis à jour.')
    } catch (e) { show(e.message, true) }
    finally { setSaving(false) }
  }

  if (err) return <div className="text-center py-12 text-sm font-semibold" style={{ color: '#D85A30' }}><AlertTriangle size={14} className="inline align-middle mr-1" />{err}</div>
  if (!profile) return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div>

  const initials = (profile.prenom?.[0] || '') + (profile.nom?.[0] || '')

  return (
    <div className="max-w-lg mx-auto">
      {msg && (
        <div className="mb-4 rounded-2xl px-4 py-3 text-sm font-bold text-white text-center" style={{ background: '#1D9E75' }}>
          <CheckCircle size={14} className="inline align-middle mr-1" />{msg}
        </div>
      )}

      <div className="rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {!edit ? (
          <>
            {/* Avatar */}
            <div className="flex justify-center mb-5">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 shadow-md" style={{ borderColor: 'var(--surface)' }} />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)' }}>
                  {initials}
                </div>
              )}
            </div>

            <div className="text-center mb-5">
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{profile.prenom} {profile.nom}</h2>
              <p className="text-sm font-semibold mt-1" style={{ color: '#1D9E75' }}>Administrateur</p>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <InfoRow label="Email" value={profile.email} icon={<Mail size={14} />} />
              <InfoRow label="Téléphone" value={profile.telephone || '—'} icon={<Smartphone size={14} />} />
              <InfoRow label="Statut" value={profile.statut_compte} icon={<Lock size={14} />} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEdit(true)}
                className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
                <Edit size={14} className="inline align-middle mr-1" /> Modifier
              </button>
              <button onClick={onLogout}
                className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#FDE8E2', color: '#D85A30', border: 'none' }}>
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Photo upload */}
            <div className="flex justify-center">
              <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                style={{
                   background: photoPreview ? 'transparent' : 'var(--surface-alt)',
                   borderColor: photoPreview ? '#1D9E75' : 'var(--border)',
                }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : profile.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl" style={{ color: 'var(--text-muted)' }}>📷</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {(photoPreview || profile.photo_url) && (
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">✕</button>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom" value={form.nom} onChange={v => setForm(p => ({ ...p, nom: v }))} />
              <Field label="Prénom" value={form.prenom} onChange={v => setForm(p => ({ ...p, prenom: v }))} />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Field label="Téléphone" value={form.telephone} onChange={v => setForm(p => ({ ...p, telephone: v }))} />

            <hr className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Changer le mot de passe (optionnel)</p>
            <Field label="Nouveau mot de passe" type="password" value={form.mot_de_passe} onChange={v => setForm(p => ({ ...p, mot_de_passe: v }))} />
            <Field label="Confirmer le mot de passe" type="password" value={form.confirm} onChange={v => setForm(p => ({ ...p, confirm: v }))} />

            <div className="flex gap-3 mt-2">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-2xl py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#1D9E75', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => {
                setEdit(false); setPhotoFile(null); setPhotoPreview('')
                setForm({ nom: profile.nom, prenom: profile.prenom, email: profile.email, telephone: profile.telephone || '', mot_de_passe: '', confirm: '' })
              }}
                className="rounded-2xl py-3 px-5 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: '#F0EFEA', color: 'var(--text-muted)', border: 'none' }}>
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-alt)' }}>
      <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>{icon} {label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="rounded-xl px-4 py-3 text-sm font-semibold outline-none border"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
    </div>
  )
}

function LitigesTab({ initialFilter }) {
  const [litiges, setLitiges] = useState([])
  const [resolving, setResolving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState('tous')

  useEffect(() => {
    if (initialFilter?.status) setStatusFilter(initialFilter.status)
  }, [initialFilter])

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

  const visibleItems = litiges.filter(l => statusFilter === 'tous' || l.statut === statusFilter).slice(0, visibleCount)
  const hasMore = litiges.filter(l => statusFilter === 'tous' || l.statut === statusFilter).length > visibleCount

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [statusFilter])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          {['tous', 'Ouvert', 'Resolu', 'Rejete'].map(s => <option key={s} value={s}>{s === 'tous' ? 'Tous les statuts' : s}</option>)}
        </select>
      </div>
      {loading ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</div> :
       litiges.filter(l => statusFilter === 'tous' || l.statut === statusFilter).length === 0 ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun litige</div> :
       visibleItems.map(l => (
         <div key={l.id_litige} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
           <div className="flex items-start justify-between mb-2">
             <div>
               <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                 style={{ background: l.statut === 'Ouvert' ? '#D85A3018' : '#1D9E7518', color: l.statut === 'Ouvert' ? '#D85A30' : '#1D9E75' }}>
                 {l.statut}
               </span>
               {l.decision_admin && <span className="text-xs ml-2 font-semibold" style={{ color: '#BA7517' }}>{l.decision_admin}</span>}
             </div>
             <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(l.date_ouverture).toLocaleDateString()}</span>
           </div>

           <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{l.description}</p>

           {l.livraison && (
             <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
               Commande #{l.livraison.id_commande} · Livreur: {l.livraison.livreur?.utilisateur?.prenom} {l.livraison.livreur?.utilisateur?.nom} ·
               Client: {l.livraison.commande?.client?.utilisateur?.prenom} {l.livraison.commande?.client?.utilisateur?.nom}
             </div>
           )}

           {l.detailsCommande && l.detailsCommande.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mb-3">
               {l.detailsCommande.map(d => (
                 <span key={`${d.id_commande}-${d.id_produit}`} className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
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
        {hasMore && (
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <ChevronDown size={16} /> Charger plus ({litiges.filter(l => statusFilter === 'tous' || l.statut === statusFilter).length - visibleCount} restant(s))
          </button>
        )}
    </div>
  )
}

function ResolveForm({ litige, onResolve, onCancel }) {
  const [decision, setDecision] = useState('')
  const [montant, setMontant] = useState('0')

  return (
    <div className="rounded-xl p-4 mt-2" style={{ background: 'var(--surface-alt)' }}>
      <select value={decision} onChange={e => setDecision(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none border mb-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
        <option value="">Sélectionner une décision</option>
        <option value="Remboursement total">Remboursement total</option>
        <option value="Remboursement partiel">Remboursement partiel</option>
        <option value="Rejet du litige">Rejet du litige</option>
        <option value="Annulation commande">Annulation commande</option>
      </select>
      <input type="number" placeholder="Montant remboursé (F)" value={montant} onChange={e => setMontant(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none border mb-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
      <div className="flex gap-2">
        <button onClick={() => onResolve(litige.id_litige, decision, montant)} disabled={!decision}
          className="flex-1 text-xs font-bold py-2.5 rounded-xl cursor-pointer border-none" style={{ background: !decision ? '#ccc' : '#1D9E75', color: '#fff' }}>
          Confirmer
        </button>
        <button onClick={onCancel} className="text-xs font-bold py-2.5 rounded-xl cursor-pointer" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ============================================================
// MARKETS TAB — Admin creates / edits / deletes Marchés
// ============================================================
const EMPTY_FORM = { nom: '', latitude: '', longitude: '', image_url: '', description: '' }

function MarketsTab() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('success')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  function flash(msg, type = 'success') {
    setToastType(type)
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function fetchMarkets() {
    setLoading(true)
    api.get('/admin/markets').then(d => { setMarkets(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchMarkets() }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setImageFile(null)
    setImagePreview('')
    setShowForm(true)
  }

  function openEdit(m) {
    setForm({
      nom: m.nom,
      latitude: String(m.latitude),
      longitude: String(m.longitude),
      image_url: m.image_url || '',
      description: m.description || ''
    })
    setEditId(m.id_marche)
    setImageFile(null)
    setImagePreview('')
    setShowForm(true)
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    // Clear URL when file is selected
    setForm(f => ({ ...f, image_url: '' }))
  }

  async function handleSave() {
    if (!form.nom || !form.latitude || !form.longitude) {
      flash('Nom, latitude et longitude sont requis.', 'error')
      return
    }
    setSaving(true)
    try {
      if (imageFile) {
        const body = new FormData()
        body.set('nom', form.nom)
        body.set('latitude', form.latitude)
        body.set('longitude', form.longitude)
        body.set('description', form.description || '')
        body.set('image', imageFile)
        if (editId) {
          await api.put(`/admin/markets/${editId}`, body)
        } else {
          await api.post('/admin/markets', body)
        }
      } else {
        if (editId) {
          await api.put(`/admin/markets/${editId}`, form)
        } else {
          await api.post('/admin/markets', form)
        }
      }
      flash(`Marché ${editId ? 'mis à jour' : 'créé avec succès'}.`, 'success')
      setShowForm(false)
      fetchMarkets()
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(m) {
    if (!confirm(`Supprimer "${m.nom}" ? Les vendeurs de ce marché seront déliés.`)) return
    try {
      await api.delete(`/admin/markets/${m.id_marche}`)
      flash('Marché supprimé.', 'success')
      fetchMarkets()
    } catch (e) {
      flash(e.message, 'error')
    }
  }

  // Lightweight map preview via OpenStreetMap static tile
  function mapPreviewUrl(lat, lng) {
    const z = 14
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, z))
    const latRad = lat * Math.PI / 180
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, z))
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl"
          style={{ background: toastType === 'error' ? '#D85A30' : '#1D9E75' }}>
          {toast}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Gestion des Marchés</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {markets.length} localmart{markets.length !== 1 ? 's' : ''} enregistré{markets.length !== 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-black cursor-pointer transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)' }}
        >
          + Nouveau Marché
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowForm(false)}>
          <div className="rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                {editId ? <span className="flex items-center gap-1.5"><Edit size={14} /> Modifier le Marché</span> : <span className="flex items-center gap-1.5"><Building size={14} /> Nouveau Marché</span>}
              </h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer text-sm"
                style={{ border: 'none', background: 'transparent' }}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nom du Marché *</label>
                <input
                  type="text"
                  placeholder="ex: Marché Dantokpa"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="6.3764"
                    value={form.latitude}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="2.4430"
                    value={form.longitude}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Map coordinate hint */}
              {form.latitude && form.longitude && (
                <div className="rounded-xl overflow-hidden border text-center" style={{ borderColor: 'var(--border)', height: 120 }}>
                  <img
                    src={mapPreviewUrl(parseFloat(form.latitude), parseFloat(form.longitude))}
                    alt="Aperçu carte"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              {form.latitude && form.longitude && (
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                   <MapPin size={10} className="inline align-middle" /> Aperçu: ({parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}) ·
                  <a href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=15/${form.latitude}/${form.longitude}`}
                    target="_blank" rel="noreferrer" className="ml-1 underline" style={{ color: '#1D9E75' }}>Vérifier sur OSM</a>
                </p>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Image du marché</label>
                <div className="flex flex-col gap-2 mt-1">
                  {/* File upload */}
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50"
                    style={{ borderColor: imagePreview ? '#1D9E75' : 'var(--border)', background: imagePreview ? '#F0FDF6' : 'transparent' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : form.image_url ? (
                      <img src={form.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-lg"><Package size={18} style={{ color: 'var(--text-muted)' }} /></span>
                    )}
                    <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text-muted)' }}>
                      {imagePreview ? 'Image sélectionnée' : form.image_url ? 'URL définie' : 'Choisir une image depuis l\'appareil'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      {imagePreview ? '1 fichier' : 'Parcourir'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {(imagePreview || form.image_url) && (
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }}
                        className="text-xs text-red-500 font-bold cursor-pointer">✕</button>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>OU</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>

                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageFile ? '' : form.image_url}
                    onChange={e => { setImageFile(null); setImagePreview(''); setForm(f => ({ ...f, image_url: e.target.value })) }}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Description du marché visible par les clients..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Quick coordinate helper for common Benin cities */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Coordonnées rapides (Bénin)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { label: 'Cotonou Centre', lat: 6.3654, lng: 2.4183 },
                    { label: 'Dantokpa', lat: 6.3764, lng: 2.4430 },
                    { label: 'Porto-Novo', lat: 6.4969, lng: 2.6289 },
                    { label: 'Parakou', lat: 9.3376, lng: 2.6278 },
                    { label: 'Abomey-Calavi', lat: 6.4491, lng: 2.3553 },
                  ].map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, latitude: String(c.lat), longitude: String(c.lng) }))}
                      className="text-[9px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer transition-all"
                      style={{ background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}
                    >
                      <MapPin size={8} className="inline align-middle" /> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer transition-all mt-2"
                style={{ background: saving ? '#ccc' : 'linear-gradient(135deg, #1D9E75, #0F6E56)', border: 'none' }}
              >
                {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer le Marché'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Market Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement des marchés...</div>
      ) : markets.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-3 flex justify-center"><MapPin size={48} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-bold text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Aucun marché enregistré</p>
          <button onClick={openCreate}
            className="text-sm font-black px-5 py-2.5 rounded-2xl text-white cursor-pointer"
            style={{ background: '#1D9E75', border: 'none' }}>+ Créer le premier marché</button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.slice(0, visibleCount).map(m => (
            <div key={m.id_marche} className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

              {/* Market Image */}
              <div className="relative h-36 overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Building size={32} style={{ color: 'var(--text-muted)' }} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-black text-sm text-white leading-tight">{m.nom}</h3>
                </div>
                {/* Vendor count badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: 'rgba(255,255,255,0.92)', color: '#0F6E56' }}>
                  <Store size={10} className="inline align-middle" /> {m._count?.vendeurs || 0} étals
                </div>
              </div>

              <div className="p-4">
                {/* Coordinates */}
                <div className="flex items-center gap-2 text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span><MapPin size={10} className="inline align-middle" /> {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}</span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${m.latitude}&mlon=${m.longitude}#map=15/${m.latitude}/${m.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="underline font-semibold"
                    style={{ color: '#1D9E75' }}
                    onClick={e => e.stopPropagation()}
                  >
                    OSM ↗
                  </a>
                </div>

                {m.description && (
                  <p className="text-[10px] mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                    style={{ background: '#E1F5EE', color: '#0F6E56', border: 'none' }}
                  >
                    <Edit size={12} /> Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                    style={{ background: '#FDE8E2', color: '#D85A30', border: 'none' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {markets.length > visibleCount && (
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl text-sm font-bold border cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <ChevronDown size={16} /> Charger plus ({markets.length - visibleCount} restant(s))
          </button>
        )}
        </>
      )}
    </div>
  )
}
