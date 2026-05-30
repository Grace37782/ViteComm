import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function AdminProfilePanel({ adminUser, onClose, token, addAlert, loadUsers }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', photo_url: '' });

  useEffect(() => {
    if (adminUser) {
      setForm({
        nom: adminUser.nom || '',
        prenom: adminUser.prenom || '',
        telephone: adminUser.telephone || '',
        email: adminUser.email || '',
        photo_url: adminUser.photo_url || ''
      });
    }
  }, [adminUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        addAlert('success', 'Profil mis à jour avec succès.');
        setEditing(false);
        loadUsers();
      } else {
        const data = await res.json();
        addAlert('danger', data.error || 'Erreur de mise à jour.');
      }
    } catch (e) {
      addAlert('danger', 'Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  if (!adminUser) return null;

  return (
    <div className="tab-pane">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px' }}>
          <i className="fa-solid fa-user-shield"></i> Mon Profil Administrateur
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!editing ? (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
              <i className="fa-solid fa-pen-to-square"></i> Modifier
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
              <i className="fa-solid fa-xmark"></i> Annuler
            </button>
          )}
          <button className="btn-close" onClick={onClose} title="Fermer le profil">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
        <div>
          {adminUser.photo_url ? (
            <img src={adminUser.photo_url} alt="photo" style={{ width: '72px', height: '72px', borderRadius: '50px', objectFit: 'cover', border: '3px solid var(--primary)' }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff' }}>
              <i className="fa-solid fa-user-shield"></i>
            </div>
          )}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px' }}>{adminUser.prenom} {adminUser.nom}</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span><i className="fa-solid fa-envelope"></i> {adminUser.email}</span>
            <span><i className="fa-solid fa-phone"></i> {adminUser.telephone}</span>
            <span className="role-tag role-admin">Admin</span>
            <span className={`status-pill status-${adminUser.statut_compte?.toLowerCase() || 'actif'}`}>{adminUser.statut_compte || 'Actif'}</span>
          </div>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-input" required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input className="form-input" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input className="form-input" required value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Photo URL</label>
              <input className="form-input" placeholder="https://..." value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Enregistrement...</> : <><i className="fa-solid fa-floppy-disk"></i> Enregistrer</>}
          </button>
        </form>
      ) : (
        <div className="panel-helper">
          <i className="fa-solid fa-shield-halved"></i>
          <span>Compte administrateur système avec droits de modération, d'arbitrage et d'audit sur l'ensemble de la plateforme.</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ token, addAlert }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'reports', 'disputes'
  const [searchQuery, setSearchQuery] = useState('');

  // States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [disputes, setDisputes] = useState([]);

  // Selected sub-items for modal details
  const [selectedCatalogue, setSelectedCatalogue] = useState(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState(null);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [disputeForm, setDisputeForm] = useState({ decision_admin: '', montant_rembourse: '' });

  // User detail panel
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState(null);

  // Admin own profile
  const [adminUser, setAdminUser] = useState(null);
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  // All products for Products tab
  const [allProducts, setAllProducts] = useState([]);

  // On mount or token change
  useEffect(() => {
    loadAnalytics();
    loadUsers(); // load users initially to compute global counts
  }, [token]);

  // Load admin own profile from API (fixes duplicate admin issue)
  useEffect(() => {
    const loadAdminMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data);
        }
      } catch (e) { /* silent */ }
    };
    loadAdminMe();
  }, [token]);

  // Loaders
  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (e) {
      addAlert('danger', 'Erreur de chargement des statistiques globales.');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) {
      addAlert('danger', 'Erreur de chargement de la liste des utilisateurs.');
    }
  };

  const loadReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/signalements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (e) {
      addAlert('danger', 'Erreur de chargement des signalements.');
    }
  };

  const loadDisputes = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/litiges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDisputes(data);
    } catch (e) {
      addAlert('danger', 'Erreur de chargement des litiges en cours.');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllProducts(data);
    } catch (e) {
      addAlert('danger', 'Erreur de chargement des produits.');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowAdminProfile(false); // close profile when switching tabs
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'users') loadUsers();
    if (tab === 'reports') loadReports();
    if (tab === 'disputes') loadDisputes();
    if (tab === 'products') loadProducts();
  };

  // User Actions
  const handleUserStatusUpdate = async (id_user, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id_user}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ statut_compte: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        addAlert('success', `Statut utilisateur mis à jour avec succès : ${newStatus}`);
        loadUsers();
        // Reload reports since user status might have changed
        if (activeTab === 'reports') loadReports();
      } else {
        addAlert('danger', data.error || 'Erreur lors de la modération.');
      }
    } catch (e) {
      addAlert('danger', 'Impossible de mettre à jour le statut.');
    }
  };

  const handleUserDelete = async (id_user) => {
    if (!window.confirm('Voulez-vous vraiment supprimer définitivement ce compte ? Cette action est irréversible (RG13).')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id_user}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addAlert('success', 'Utilisateur supprimé conformément à la règle RG13.');
        loadUsers();
      } else {
        addAlert('danger', data.error || 'Erreur de suppression.');
      }
    } catch (e) {
      addAlert('danger', 'Erreur serveur lors de la suppression.');
    }
  };

  const viewVendorCatalogue = async (vendeur) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${vendeur.id_user}/catalogue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedCatalogue({ vendeur, products: data });
      } else {
        addAlert('danger', 'Impossible de charger le catalogue de ce vendeur.');
      }
    } catch (e) {
      addAlert('danger', 'Erreur de connexion.');
    }
  };

  const viewProductPriceHistory = async (id_produit, nom_produit) => {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id_produit}/price-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProductHistory({ nom_produit, history: data });
      } else {
        addAlert('danger', 'Impossible de charger l\'historique des prix de cet article.');
      }
    } catch (e) {
      addAlert('danger', 'Erreur réseau.');
    }
  };

  // View user details (info, reputation, role data)
  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setLoadingUserDetail(true);
    setUserDetail(null);
    setUserDetailError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id_user}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserDetail(data);
      } else {
        setUserDetailError(data.error || 'Impossible de charger les détails.');
      }
    } catch (e) {
      setUserDetailError('Erreur réseau. Vérifiez que le serveur backend est en cours d\'exécution.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  // Admin own profile — toggle inline panel in body (no duplicate modal)
  const openAdminProfile = () => {
    setShowAdminProfile(prev => !prev);
    if (!adminUser) {
      addAlert('danger', 'Profil administrateur non trouvé.');
    }
  };

  // Signalement Actions
  const handleReportAction = async (id_signalement, newStatus, targetUserId, sanctionStatus) => {
    try {
      // 1. Update report status
      await fetch(`${API_BASE}/admin/signalements/${id_signalement}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ statut_traitement: newStatus })
      });

      // 2. If sanctioning, apply status block to Target User
      if (sanctionStatus) {
        await handleUserStatusUpdate(targetUserId, sanctionStatus);
      } else {
        addAlert('success', `Signalement classé : ${newStatus}`);
        loadReports();
      }
    } catch (e) {
      addAlert('danger', 'Erreur lors du traitement du signalement.');
    }
  };

  // Dispute Actions
  const handleResolveDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeForm.decision_admin) {
      addAlert('danger', 'La décision officielle de l\'administrateur est requise.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/litiges/${resolvingDispute.id_litige}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision_admin: disputeForm.decision_admin,
          montant_rembourse: parseFloat(disputeForm.montant_rembourse) || 0.0
        })
      });
      const data = await res.json();

      if (res.ok) {
        addAlert('success', 'Arbitrage validé. Les réputations ont été actualisées en temps réel !');
        setResolvingDispute(null);
        setDisputeForm({ decision_admin: '', montant_rembourse: '' });
        loadDisputes();
        loadAnalytics(); // Reload metrics too
      } else {
        addAlert('danger', data.error || 'Erreur lors de la résolution.');
      }
    } catch (e) {
      addAlert('danger', 'Impossible de résoudre le litige.');
    }
  };

  // --- CLIENT-SIDE FILTERS ---
  const q = searchQuery.toLowerCase();

  const totalVendors = users.filter(u => u.vendeur).length;
  const totalClients = users.filter(u => u.client).length;
  const totalDrivers = users.filter(u => u.livreur).length;

  const filteredPopularProducts = stats?.produits_populaires?.filter(p => 
    p.nom.toLowerCase().includes(q) || (p.vendeur?.nom_etablissement || '').toLowerCase().includes(q)
  ) || [];

  const filteredAvoidedProducts = stats?.produits_refuses?.filter(p => 
    p.nom.toLowerCase().includes(q) || (p.vendeur?.nom_etablissement || '').toLowerCase().includes(q)
  ) || [];

  const filteredVendorsLeaderboard = stats?.classements?.vendeurs?.filter(v => 
    v.nom_etablissement.toLowerCase().includes(q) || v.nom.toLowerCase().includes(q) || v.prenom.toLowerCase().includes(q)
  ) || [];

  const filteredDriversLeaderboard = stats?.classements?.livreurs?.filter(d => 
    d.nom.toLowerCase().includes(q) || d.prenom.toLowerCase().includes(q)
  ) || [];

  const filteredClientsLeaderboard = stats?.classements?.clients?.filter(c => 
    c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q)
  ) || [];

  const filteredUsers = users.filter(u => {
    if (u.est_admin) return false; // Hide admin from user list
    const roleString = u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin';
    return u.nom.toLowerCase().includes(q) || 
           u.prenom.toLowerCase().includes(q) || 
           u.email.toLowerCase().includes(q) || 
           u.telephone.toLowerCase().includes(q) ||
           u.statut_compte.toLowerCase().includes(q) ||
           roleString.includes(q) ||
           (u.vendeur?.nom_etablissement || '').toLowerCase().includes(q);
  });

  const filteredReports = reports.filter(r => 
    r.motif.toLowerCase().includes(q) || 
    r.auteur.nom.toLowerCase().includes(q) || 
    r.auteur.prenom.toLowerCase().includes(q) || 
    r.cible.nom.toLowerCase().includes(q) || 
    r.cible.prenom.toLowerCase().includes(q)
  );

  const filteredDisputes = disputes.filter(d => 
    d.description.toLowerCase().includes(q) || 
    d.livraison.commande.client.utilisateur.nom.toLowerCase().includes(q) || 
    d.livraison.commande.client.utilisateur.prenom.toLowerCase().includes(q) || 
    d.livraison.livreur.utilisateur.nom.toLowerCase().includes(q) || 
    d.livraison.livreur.utilisateur.prenom.toLowerCase().includes(q)
  );

  const filteredAllProducts = allProducts.filter(p =>
    p.nom.toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q) ||
    (p.vendeur?.nom_etablissement || '').toLowerCase().includes(q) ||
    (p.vendeur?.localisation_marche || '').toLowerCase().includes(q)
  );

  return (
    <div className="admin-container">
      {/* Admin Panel Header */}
      <div className="admin-header fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2><i className="fa-solid fa-screwdriver-wrench"></i> Console de Supervision Globale</h2>
          <p className="subtitle">Auditez les transactions, arbitrez les litiges et gérez les utilisateurs.</p>
        </div>
        <button className={`btn-admin-profile ${showAdminProfile ? 'profile-open' : ''}`} onClick={openAdminProfile} title={showAdminProfile ? 'Fermer mon profil' : 'Voir mon profil'}>
          {adminUser?.photo_url ? (
            <img src={adminUser.photo_url} alt="admin" className="admin-profile-avatar" />
          ) : (
            <div className="admin-profile-avatar admin-profile-avatar-placeholder">
              <i className="fa-solid fa-circle-user"></i>
            </div>
          )}
          <span className="admin-profile-name">{adminUser ? `${adminUser.prenom} ${adminUser.nom}` : 'Admin'}</span>
        </button>
      </div>

      {/* Global Dynamic Filter Search Bar */}
      <div className="search-bar-container fade-in">
        <div className="search-wrapper">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Rechercher dynamiquement par nom, produit, marché, sachet, établissement..."
            className="form-input search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => setSearchQuery('')} title="Effacer la recherche">
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Admin sidebar layout */}
      <div className="admin-layout">
        <nav className="admin-sidebar">
          <button
            className={`sidebar-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span className="sidebar-label">Analytics & Finance</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <i className="fa-solid fa-users-gear"></i>
            <span className="sidebar-label">Utilisateurs (RG11)</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <i className="fa-solid fa-bullhorn"></i>
            <span className="sidebar-label">Signalements</span>
            {stats?.alertes?.signalements_en_attente > 0 && (
              <span className="badge-alert-dot sidebar-badge">{stats.alertes.signalements_en_attente}</span>
            )}
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'disputes' ? 'active' : ''}`}
            onClick={() => handleTabChange('disputes')}
          >
            <i className="fa-solid fa-scale-balanced"></i>
            <span className="sidebar-label">Centre des Litiges</span>
            {stats?.alertes?.litiges_ouverts > 0 && (
              <span className="badge-alert-dot sidebar-badge">{stats.alertes.litiges_ouverts}</span>
            )}
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleTabChange('products')}
          >
            <i className="fa-solid fa-box"></i>
            <span className="sidebar-label">Produits</span>
          </button>
        </nav>

      <div className="admin-tab-body glassmorphism-inset fade-in">

        {/* ADMIN PROFILE PANEL (inline, not modal) */}
        {showAdminProfile && adminUser && (
          <AdminProfilePanel
            adminUser={adminUser}
            onClose={() => setShowAdminProfile(false)}
            token={token}
            addAlert={addAlert}
            loadUsers={loadUsers}
          />
        )}

        {/* TAB 1: ANALYTICS & FINANCE */}
        {!showAdminProfile && activeTab === 'analytics' && stats && (
          <div className="tab-pane">
            
            {/* Top Counters Row (Vendors, Clients, Livreurs) */}
            <div className="metrics-grid" style={{ marginBottom: '30px' }}>
              <div className="metric-box" style={{ background: 'linear-gradient(135deg, rgba(255, 46, 115, 0.08) 0%, rgba(255, 46, 115, 0.01) 100%)', borderLeft: '4px solid var(--accent)' }}>
                <span className="metric-label">Marchands Actifs</span>
                <span className="metric-value">{totalVendors} Vendeurs</span>
                <span className="metric-tip">Suivi et réputation en lecture seule</span>
              </div>
              <div className="metric-box" style={{ background: 'linear-gradient(135deg, rgba(110, 68, 255, 0.08) 0%, rgba(110, 68, 255, 0.01) 100%)', borderLeft: '4px solid var(--primary)' }}>
                <span className="metric-label">Clients Enregistrés</span>
                <span className="metric-value">{totalClients} Clients</span>
                <span className="metric-tip">Sécurisés sous conformité RGPD</span>
              </div>
              <div className="metric-box" style={{ background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(0, 180, 216, 0.01) 100%)', borderLeft: '4px solid var(--info)' }}>
                <span className="metric-label">Transporteurs Certifiés</span>
                <span className="metric-value">{totalDrivers} Livreurs</span>
                <span className="metric-tip">Avec suivi des plaques d'immatriculation</span>
              </div>
            </div>

            {/* Financial Metrics aligned exactly with instructions */}
            <div className="metrics-grid" style={{ marginBottom: '35px' }}>
              <div className="metric-box box-sales">
                <span className="metric-label">Volume total des ventes (brut)</span>
                <span className="metric-value">{stats.financier.total_ventes.toLocaleString()} FCFA</span>
                <span className="metric-tip">Uniquement sur les articles livrés et acceptés</span>
              </div>
              <div className="metric-box box-commission">
                <span className="metric-label">Commission plateforme cumulée (0.6%)</span>
                <span className="metric-value">{stats.financier.total_commissions_plateforme.toFixed(1)} FCFA</span>
                <span className="metric-tip">Règle RG08 prélevée sur la valeur des marchandises</span>
              </div>
            </div>

            {/* LEADERBOARDS & CLASSEMENTS GRID */}
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-ranking-star" style={{ color: 'var(--accent)' }}></i> Classements Chiffre d'Affaires & Volumes
            </h3>
            
            <div className="metrics-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              
              {/* 1. Vendors CA Leaderboard */}
              <div className="audit-list-card">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: 'var(--accent)', fontSize: '15px' }}>
                  <i className="fa-solid fa-shop"></i> Vendeurs par Volume (CA)
                </h4>
                {filteredVendorsLeaderboard.length === 0 ? (
                  <p className="no-data">Aucun vendeur trouvé.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredVendorsLeaderboard.map((v, idx) => (
                      <div key={idx} onClick={() => viewUserDetails({ id_user: v.id_user })} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                        {v.photo_url ? (
                          <img src={v.photo_url} alt="vendeur" style={{ width: '36px', height: '36px', borderRadius: '50px', objectFit: 'cover', border: '1.5px solid var(--accent)' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px', fontWeight: 'bold' }}>{v.nom[0]}</div>
                        )}
                        <div style={{ flexGrow: 1 }}>
                          <span style={{ fontWeight: 'bold', display: 'block', fontSize: '13px' }}>{v.nom_etablissement}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.prenom} {v.nom}</span>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--success)' }}>{v.chiffre_affaires.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Drivers Volume Leaderboard */}
              <div className="audit-list-card">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: 'var(--info)', fontSize: '15px' }}>
                  <i className="fa-solid fa-motorcycle"></i> Livreurs par Volume (Livre)
                </h4>
                {filteredDriversLeaderboard.length === 0 ? (
                  <p className="no-data">Aucun livreur trouvé.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredDriversLeaderboard.map((d, idx) => (
                      <div key={idx} onClick={() => viewUserDetails({ id_user: d.id_user })} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                        {d.photo_url ? (
                          <img src={d.photo_url} alt="livreur" style={{ width: '36px', height: '36px', borderRadius: '50px', objectFit: 'cover', border: '1.5px solid var(--info)' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50px', background: 'var(--info)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px', fontWeight: 'bold' }}>{d.nom[0]}</div>
                        )}
                        <div style={{ flexGrow: 1 }}>
                          <span style={{ fontWeight: 'bold', display: 'block', fontSize: '13px' }}>{d.prenom} {d.nom}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.courses_count} livraisons effectuées</span>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--info)' }}>{d.volume_livre.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Clients Order Volume Leaderboard */}
              <div className="audit-list-card">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: 'var(--primary)', fontSize: '15px' }}>
                  <i className="fa-solid fa-basket-shopping"></i> Clients par Achats Cumulés
                </h4>
                {filteredClientsLeaderboard.length === 0 ? (
                  <p className="no-data">Aucun client trouvé.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredClientsLeaderboard.map((c, idx) => (
                      <div key={idx} onClick={() => viewUserDetails({ id_user: c.id_user })} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                        {c.photo_url ? (
                          <img src={c.photo_url} alt="client" style={{ width: '36px', height: '36px', borderRadius: '50px', objectFit: 'cover', border: '1.5px solid var(--primary)' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '14px', fontWeight: 'bold' }}>{c.nom[0]}</div>
                        )}
                        <div style={{ flexGrow: 1 }}>
                          <span style={{ fontWeight: 'bold', display: 'block', fontSize: '13px' }}>{c.prenom} {c.nom}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.commandes_count} commandes payées</span>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primary)' }}>{c.volume_achat.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* PRODUCT ANALYTICS GRID (RG12 - With photos and Vendor Establishment details) */}
            <div className="audit-sections-grid">
              
              {/* Popular Products Table */}
              <div className="audit-list-card">
                <h3><i className="fa-solid fa-thumbs-up" style={{ color: 'var(--success)' }}></i> Produits Populaires (Ventes)</h3>
                {filteredPopularProducts.length === 0 ? (
                  <p className="no-data">Aucune donnée correspondante.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Produit</th>
                        <th>Vendeur</th>
                        <th>Marché</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Vendus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPopularProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="produit" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><i className="fa-solid fa-carrot"></i></div>
                            )}
                          </td>
                          <td><strong>{p.nom}</strong>{p.description && <span className="p-desc-sub">{p.description}</span>}</td>
                          <td><i className="fa-solid fa-shop"></i> {p.vendeur?.nom_etablissement || 'Boutique local'}</td>
                          <td style={{ fontSize: '12px' }}>{p.vendeur?.localisation_marche || '-'}</td>
                          <td>{p.prix_reference?.toLocaleString()} FCFA</td>
                          <td>{p.stock_disponible}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{p.quantite} vendus</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Rejected Products Table */}
              <div className="audit-list-card">
                <h3><i className="fa-solid fa-circle-xmark" style={{ color: 'var(--danger)' }}></i> Produits Refusés (Rejets Qualité)</h3>
                {filteredAvoidedProducts.length === 0 ? (
                  <p className="no-data">Aucun rejet physique enregistré.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Produit</th>
                        <th>Vendeur</th>
                        <th>Marché</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Rejets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvoidedProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="produit" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><i className="fa-solid fa-carrot"></i></div>
                            )}
                          </td>
                          <td><strong>{p.nom}</strong>{p.description && <span className="p-desc-sub">{p.description}</span>}</td>
                          <td><i className="fa-solid fa-shop"></i> {p.vendeur?.nom_etablissement || 'Boutique local'}</td>
                          <td style={{ fontSize: '12px' }}>{p.vendeur?.localisation_marche || '-'}</td>
                          <td>{p.prix_reference?.toLocaleString()} FCFA</td>
                          <td>{p.stock_disponible}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{p.quantite} rejets</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: UTILISATEURS (RG11/15) */}
        {!showAdminProfile && activeTab === 'users' && (
          <div className="tab-pane">
            <div className="panel-helper">
              <i className="fa-solid fa-shield-halved"></i>
              <span><strong>Conformité RGPD stricte (RG11 & RG15) :</strong> Aucun historique d'achat ou de navigation privé n'est exposé. Les scores de réputation sont verrouillés en lecture seule pour préserver la confiance du réseau. Les photos de profil sont affichées à titre d'identité.</span>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="no-data">Aucun utilisateur correspondant à votre recherche.</p>
            ) : (
              <table className="admin-table user-table">
                <thead>
                  <tr>
                    <th>Portrait</th>
                    <th>Nom complet</th>
                    <th>Contact</th>
                    <th>Rôle</th>
                    <th>Réputation</th>
                    <th>Statut</th>
                    <th>Actions de Modération</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id_user} className={`status-row-${u.statut_compte.toLowerCase()}`} onClick={() => viewUserDetails(u)} style={{ cursor: 'pointer' }}>
                      <td>
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="profil" style={{ width: '42px', height: '42px', borderRadius: '50px', objectFit: 'cover', border: '2px solid var(--glass-border)' }} />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '50px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '18px' }}>
                            <i className="fa-solid fa-circle-user"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="user-name-cell" style={{ gap: '6px' }}>
                          <div>
                            <strong>{u.prenom} {u.nom}</strong>
                            {u.est_admin && <span className="admin-tag-pill">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span><i className="fa-solid fa-envelope"></i> {u.email}</span>
                          <span><i className="fa-solid fa-phone"></i> {u.telephone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-tag role-${u.client ? 'client' : u.vendeur ? 'vendeur' : u.livreur ? 'livreur' : 'admin'}`}>
                          {u.client ? 'Client' : u.vendeur ? 'Vendeur' : u.livreur ? 'Livreur' : 'Admin'}
                        </span>
                      </td>
                      <td>
                        {u.vendeur && (
                          <span className="badge-reputation" title="Vendeur">
                            <i className="fa-solid fa-star"></i> {u.vendeur.score_reputation.toFixed(1)}
                          </span>
                        )}
                        {u.livreur && (
                          <span className="badge-reputation active-liv" title="Livreur">
                            <i className="fa-solid fa-truck"></i> {u.livreur.score_reputation.toFixed(1)}
                          </span>
                        )}
                        {u.client && <span className="rep-na">N/A</span>}
                      </td>
                      <td>
                        <span className={`status-pill status-${u.statut_compte.toLowerCase()}`}>
                          {u.statut_compte}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          {u.vendeur && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => viewVendorCatalogue(u.vendeur)}
                              title="Consulter le Catalogue & Prix (RG12/RG24)"
                            >
                              <i className="fa-solid fa-store"></i> Étal
                            </button>
                          )}
                          
                          {u.statut_compte === 'Actif' ? (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleUserStatusUpdate(u.id_user, 'Suspendu')}
                              title="Suspendre temporairement"
                            >
                              <i className="fa-solid fa-user-slash"></i> Suspendre
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUserStatusUpdate(u.id_user, 'Actif')}
                              title="Réactiver le compte"
                            >
                              <i className="fa-solid fa-user-check"></i> Activer
                            </button>
                          )}

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleUserDelete(u.id_user)}
                            title="Supprimer définitivement (RG13)"
                          >
                            <i className="fa-solid fa-trash-can"></i> Suppr
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: SIGNALEMENTS (RG14) */}
        {!showAdminProfile && activeTab === 'reports' && (
          <div className="tab-pane">
            <div className="panel-helper warning-helper">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span><strong>Droit de Sanction Universel (RG14) :</strong> Même si la vie privée des clients est confidentielle, vous pouvez les suspendre ou les bannir directement s'ils font l'objet d'abus avérés signalés.</span>
            </div>

            {filteredReports.length === 0 ? (
              <p className="no-data">Aucun signalement en attente de modération.</p>
            ) : (
              <div className="reports-grid">
                {filteredReports.map(r => (
                  <div key={r.id_signalement} className={`report-item-card report-status-${r.statut_traitement.toLowerCase()}`}>
                    <div className="report-card-header">
                      <span className="report-date"><i className="fa-solid fa-clock"></i> {new Date(r.date_heure).toLocaleString()}</span>
                      <span className={`status-pill status-${r.statut_traitement.toLowerCase()}`}>{r.statut_traitement}</span>
                    </div>

                    <div className="report-actors">
                      <div className="actor-box">
                        <span className="actor-label">Auteur du signalement :</span>
                        <strong>{r.auteur.prenom} {r.auteur.nom}</strong>
                        <span className="actor-email">{r.auteur.email}</span>
                      </div>
                      <i className="fa-solid fa-right-long actor-arrow"></i>
                      <div className="actor-box target-box">
                        <span className="actor-label">Cible signalée :</span>
                        <strong>{r.cible.prenom} {r.cible.nom}</strong>
                        <span className="actor-email">{r.cible.email}</span>
                        <span className="actor-status">Statut cible : <strong>{r.cible.statut_compte}</strong></span>
                      </div>
                    </div>

                    <div className="report-motif">
                      <strong>Motif du signalement :</strong>
                      <p>"{r.motif}"</p>
                    </div>

                    {r.statut_traitement === 'En attente' && (
                      <div className="report-actions-row">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReportAction(r.id_signalement, 'Traite', r.id_cible, 'Suspendu')}
                        >
                          <i className="fa-solid fa-gavel"></i> Sanctionner (Suspendre cible)
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReportAction(r.id_signalement, 'Classe', null, null)}
                        >
                          <i className="fa-solid fa-folder-closed"></i> Classer sans suite
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LITIGES & ARBITRAGE (RG09/RG16/RG21) */}
        {!showAdminProfile && activeTab === 'disputes' && (
          <div className="tab-pane">
            {filteredDisputes.length === 0 ? (
              <p className="no-data">Aucun litige correspondant.</p>
            ) : (
              <div className="disputes-stack">
                {filteredDisputes.map(d => (
                  <div key={d.id_litige} className={`dispute-box dispute-state-${d.statut.toLowerCase()}`}>
                    <div className="dispute-box-header">
                      <div>
                        <h3>Litige #{d.id_litige}</h3>
                        <span className="dispute-date">Ouvert le {new Date(d.date_ouverture).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-pill status-${d.statut === 'Ouvert' ? 'danger' : 'success'}`}>
                        {d.statut === 'Ouvert' ? 'En arbitrage' : 'Résolu'}
                      </span>
                    </div>

                    {/* Actors involved in delivery */}
                    <div className="dispute-delivery-info">
                      <div className="d-info-col">
                        <strong>Client payeur :</strong>
                        <span>{d.livraison.commande.client.utilisateur.prenom} {d.livraison.commande.client.utilisateur.nom}</span>
                      </div>
                      <div className="d-info-col">
                        <strong>Livreur concerné :</strong>
                        <span>{d.livraison.livreur.utilisateur.prenom} {d.livraison.livreur.utilisateur.nom}</span>
                      </div>
                      <div className="d-info-col">
                        <strong>Frais de retour appliqués :</strong>
                        <span style={{ color: 'var(--warning)' }}>{d.livraison.frais_retour_calcules} FCFA</span>
                      </div>
                    </div>

                    <div className="dispute-content">
                      <div className="dispute-desc">
                        <strong>Description de l'incident :</strong>
                        <p>"{d.description}"</p>
                      </div>

                      {/* Rejected Items linked precisely (RG21) */}
                      <div className="dispute-items">
                        <strong>Articles Rejetés rattachés (RG18 / RG21) :</strong>
                        <ul>
                          {d.detailsCommande.map((line, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {line.produit.photo_url ? (
                                <img src={line.produit.photo_url} alt="produit" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><i className="fa-solid fa-carrot" style={{ fontSize: '12px' }}></i></div>
                              )}
                              <div>
                                <strong>{line.produit.nom}</strong> x{line.quantite_commandee} (Prix appliqué: {line.prix_vente_applique} FCFA)
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* DOUBLE PHOTO PROOF GALLERY (RG07) */}
                    {d.preuve && d.preuve.photos && d.preuve.photos.length > 0 && (
                      <div className="dispute-proof-gallery">
                        <strong><i className="fa-solid fa-images"></i> Galerie de Preuves Photographiques (Double Preuve Photo RG07) :</strong>
                        <div className="proof-photos-row">
                          {d.preuve.photos.map(p => (
                            <div key={p.id_photo} className="proof-image-wrapper">
                              <div className="mock-photo-visualizer">
                                <i className="fa-solid fa-file-image"></i>
                                <span>{p.url_photo.split('/').pop()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution decision outcomes */}
                    {d.statut === 'Ouvert' ? (
                      <div className="dispute-resolution-action-box">
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            setResolvingDispute(d);
                            setDisputeForm({ decision_admin: '', montant_rembourse: '' });
                          }}
                        >
                          <i className="fa-solid fa-scale-balanced"></i> Rédiger la décision d'arbitrage
                        </button>
                      </div>
                    ) : (
                      <div className="dispute-resolution-resolved-box">
                        <h4>Décision d'arbitrage clôturée :</h4>
                        <p className="decision-text">"{d.decision_admin}"</p>
                        <div className="refund-pill">
                          Montant total remboursé au client : <strong>{d.montant_rembourse} FCFA</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PRODUITS (searchable full product list) */}
        {!showAdminProfile && activeTab === 'products' && (
          <div className="tab-pane">
            <div className="panel-helper">
              <i className="fa-solid fa-box"></i>
              <span><strong>Inventaire complet de la plateforme :</strong> {filteredAllProducts.length} produit(s) trouvé(s). Les produits sont cliquables pour voir l'historique des prix (RG24).</span>
            </div>

            {filteredAllProducts.length === 0 ? (
              <p className="no-data">Aucun produit trouvé.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Désignation</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Vendeur</th>
                    <th>Marché</th>
                    <th>Réputation</th>
                    <th>Dernier Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllProducts.map((p, idx) => (
                    <tr key={p.id_produit} onClick={() => viewProductPriceHistory(p.id_produit, p.nom)} style={{ cursor: 'pointer' }}>
                      <td>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.nom} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-box"></i></div>
                        )}
                      </td>
                      <td><strong>{p.nom}</strong>{p.description && <span className="p-desc-sub">{p.description}</span>}</td>
                      <td>{p.prix_reference?.toLocaleString()} FCFA</td>
                      <td>{p.stock_disponible}</td>
                      <td><i className="fa-solid fa-shop"></i> {p.vendeur?.nom_etablissement || 'N/A'}</td>
                      <td style={{ fontSize: '12px' }}>{p.vendeur?.localisation_marche || '-'}</td>
                      <td>{p.vendeur ? <span className="badge-reputation"><i className="fa-solid fa-star"></i> {p.vendeur.score_reputation?.toFixed(1)}</span> : '-'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.historiques?.length > 0 ? `${p.historiques[0].prix?.toLocaleString()} FCFA` : 'Initial'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      </div>{/* end admin-layout */}

      {/* POPUP MODAL 1: VENDOR CATALOGUE & HISTORIQUE DES PRIX (RG12 & RG24) */}
      {selectedCatalogue && (
        <div className="modal-overlay">
          <div className="modal-content glassmorphism">
            <div className="modal-header">
              <h3>Étal de {selectedCatalogue.vendeur.nom_etablissement}</h3>
              <button className="btn-close" onClick={() => setSelectedCatalogue(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>Marché d'activité : <strong>{selectedCatalogue.vendeur.localisation_marche}</strong></p>
              <div className="modal-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Aperçu</th>
                      <th>Produit</th>
                      <th>Stock Dispo</th>
                      <th>Prix Actuel</th>
                      <th>Historique d'Évolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCatalogue.products.map(p => (
                      <tr key={p.id_produit}>
                        <td>
                          {p.photo_url ? (
                            <img src={p.photo_url} alt="produit" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><i className="fa-solid fa-carrot"></i></div>
                          )}
                        </td>
                        <td>
                          <strong>{p.nom}</strong>
                          <span className="p-desc-sub">{p.description}</span>
                        </td>
                        <td>{p.stock_disponible} en stock</td>
                        <td>{p.prix_reference} FCFA</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => viewProductPriceHistory(p.id_produit, p.nom)}
                          >
                            <i className="fa-solid fa-timeline"></i> Voir l'Historique (RG24)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: PRICE HISTORY EVOLUTION AUDIT TRAIL (RG24) */}
      {selectedProductHistory && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glassmorphism" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Historique Audit de : {selectedProductHistory.nom_produit}</h3>
              <button className="btn-close" onClick={() => setSelectedProductHistory(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="panel-helper">
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span><strong>RG24 - Traçabilité Obligatoire des Prix :</strong> Toutes les fluctuations de prix sont archivées afin de garantir la transparence et de prévenir les spéculations.</span>
              </div>
              
              {selectedProductHistory.history.length === 0 ? (
                <p className="no-data">Aucun changement de prix n'a été enregistré pour ce produit. Son prix initial est fige.</p>
              ) : (
                <div className="history-timeline">
                  {selectedProductHistory.history.map((h, idx) => (
                    <div key={idx} className="timeline-node">
                      <div className="timeline-node-time">
                        {new Date(h.date_modification).toLocaleString()}
                      </div>
                      <div className="timeline-node-desc">
                        Prix fixé à <strong>{h.prix} FCFA</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: ARBITRAGE DECISION FORM (RG09/RG16) */}
      {resolvingDispute && (
        <div className="modal-overlay">
          <div className="modal-content glassmorphism" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Arbitrer le Litige #{resolvingDispute.id_litige}</h3>
              <button className="btn-close" onClick={() => setResolvingDispute(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleResolveDisputeSubmit}>
              <div className="modal-body">
                <div className="panel-helper warning-helper" style={{ marginBottom: '15px' }}>
                  <i className="fa-solid fa-scale-balanced"></i>
                  <span><strong>Règles RG09 & RG16 :</strong> La décision d'arbitrage recalculera le montant exact dû aux marchands, ajustera le score de réputation du vendeur et effectuera le remboursement spécifié.</span>
                </div>

                <div className="form-group">
                  <label>Décision Officielle de l'Administrateur</label>
                  <textarea
                    required
                    placeholder="Rédigez la raison de votre arbitrage et les mesures prises..."
                    rows="4"
                    className="form-input"
                    value={disputeForm.decision_admin}
                    onChange={e => setDisputeForm(prev => ({ ...prev, decision_admin: e.target.value }))}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Montant du Remboursement Accordé au Client (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="form-input"
                    required
                    value={disputeForm.montant_rembourse}
                    onChange={e => setDisputeForm(prev => ({ ...prev, montant_rembourse: e.target.value }))}
                  />
                  <small className="form-tip">Ce montant sera déduit du total versé aux vendeurs incriminés.</small>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolvingDispute(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-success">
                  <i className="fa-solid fa-circle-check"></i> Enregistrer l'Arbitrage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 4: USER DETAIL PANEL (Info, Reputation, Role Data) */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeUserDetails}>
          <div className="modal-content glassmorphism user-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-user"></i> Détails Utilisateur
              </h3>
              <button className="btn-close" onClick={closeUserDetails}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              {loadingUserDetail ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px' }}></i>
                  <p style={{ marginTop: '15px' }}>Chargement des détails...</p>
                </div>
              ) : userDetailError ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '40px', color: 'var(--danger)', marginBottom: '15px' }}></i>
                  <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Échec du chargement</p>
                  <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '13px' }}>{userDetailError}</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => viewUserDetails(selectedUser)} style={{ marginTop: '15px' }}>
                    <i className="fa-solid fa-rotate"></i> Réessayer
                  </button>
                </div>
              ) : userDetail ? (
                <>
                  {/* User Info Header */}
                  <div className="user-detail-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      {userDetail.user.photo_url ? (
                        <img src={userDetail.user.photo_url} alt="photo" style={{ width: '72px', height: '72px', borderRadius: '50px', objectFit: 'cover', border: '3px solid var(--primary)' }} />
                      ) : (
                        <div style={{ width: '72px', height: '72px', borderRadius: '50px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                          <i className="fa-solid fa-circle-user"></i>
                        </div>
                      )}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h2 style={{ margin: 0, fontSize: '22px' }}>{userDetail.user.prenom} {userDetail.user.nom}</h2>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <span><i className="fa-solid fa-envelope"></i> {userDetail.user.email}</span>
                        <span><i className="fa-solid fa-phone"></i> {userDetail.user.telephone}</span>
                        <span className={`role-tag role-${userDetail.roleData.type || 'admin'}`}>
                          {userDetail.roleData.type === 'vendeur' ? 'Vendeur' : userDetail.roleData.type === 'livreur' ? 'Livreur' : userDetail.roleData.type === 'client' ? 'Client' : 'Admin'}
                        </span>
                        <span className={`status-pill status-${userDetail.user.statut_compte.toLowerCase()}`}>
                          {userDetail.user.statut_compte}
                        </span>
                      </div>
                    </div>
                    {userDetail.roleData.score_reputation !== undefined && (
                      <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: userDetail.roleData.type === 'vendeur' ? 'var(--accent)' : 'var(--info)' }}>
                          {userDetail.roleData.score_reputation.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Réputation</div>
                      </div>
                    )}
                  </div>

                  {/* Reputation & Feedback History */}
                  <h4 style={{ marginBottom: '12px' }}><i className="fa-solid fa-star"></i> Historique des Évaluations (Feedbacks)</h4>
                  {userDetail.feedbacks.length === 0 ? (
                    <p className="no-data">Aucun feedback reçu.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                      {userDetail.feedbacks.map((f, idx) => (
                        <div key={idx} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>
                              {'★'.repeat(f.note)}{'☆'.repeat(5 - f.note)} {f.note}/5
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(f.date_publication).toLocaleDateString()}</span>
                          </div>
                          {f.commentaire && <p style={{ margin: '4px 0', fontStyle: 'italic' }}>"{f.commentaire}"</p>}
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {f.type_feedback === 'VENDEUR' ? 'Évaluation vendeur' : 'Évaluation livreur'}
                            {f.livraison?.commande?.client?.utilisateur && ` — par ${f.livraison.commande.client.utilisateur.prenom} ${f.livraison.commande.client.utilisateur.nom}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Role-specific Data */}
                  {userDetail.roleData.type === 'vendeur' && (
                    <>
                      <h4 style={{ marginBottom: '12px' }}><i className="fa-solid fa-shop"></i> Catalogue Produits & Prix ({userDetail.roleData.nom_etablissement})</h4>
                      <div className="panel-helper" style={{ marginBottom: '12px' }}>
                        <i className="fa-solid fa-chart-simple"></i>
                        <span><strong>RG24 - Traçabilité :</strong> {userDetail.roleData.total_ventes} ventes réalisées, {userDetail.roleData.total_revenu.toLocaleString()} FCFA de revenu total.</span>
                      </div>
                      {userDetail.roleData.products.length === 0 ? (
                        <p className="no-data">Aucun produit dans le catalogue.</p>
                      ) : (
                        <table className="admin-table" style={{ marginBottom: '25px' }}>
                          <thead>
                            <tr>
                              <th>Photo</th>
                              <th>Produit</th>
                              <th>Prix</th>
                              <th>Stock</th>
                              <th>Évolution Prix</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.roleData.products.map(p => (
                              <tr key={p.id_produit}>
                                <td>
                                  {p.photo_url ? (
                                    <img src={p.photo_url} alt={p.nom} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-carrot"></i></div>
                                  )}
                                </td>
                                <td><strong>{p.nom}</strong></td>
                                <td>{p.prix_reference} FCFA</td>
                                <td>{p.stock_disponible}</td>
                                <td>
                                  {p.historiques && p.historiques.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      {p.historiques.map((h, hidx) => (
                                        <span key={hidx} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                          {new Date(h.date_modification).toLocaleDateString()} → <strong>{h.prix} FCFA</strong>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Prix initial inchangé</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}

                  {userDetail.roleData.type === 'livreur' && (
                    <>
                      <h4 style={{ marginBottom: '12px' }}><i className="fa-solid fa-motorcycle"></i> Activité Livraisons</h4>
                      <div className="panel-helper" style={{ marginBottom: '12px' }}>
                        <i className="fa-solid fa-truck-fast"></i>
                        <span><strong>{userDetail.roleData.total_livraisons} livraisons</strong> effectuées, volume total de <strong>{userDetail.roleData.volume_total.toLocaleString()} FCFA</strong>. Véhicule : {userDetail.roleData.type_vehicule} ({userDetail.roleData.immatriculation}). {userDetail.roleData.est_disponible ? '✅ Disponible' : '❌ Indisponible'}</span>
                      </div>
                      {userDetail.roleData.deliveries.length === 0 ? (
                        <p className="no-data">Aucune livraison enregistrée.</p>
                      ) : (
                        <table className="admin-table" style={{ marginBottom: '25px' }}>
                          <thead>
                            <tr>
                              <th>Commande</th>
                              <th>Client</th>
                              <th>Montant</th>
                              <th>Statut</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.roleData.deliveries.map((d, idx) => (
                              <tr key={idx}>
                                <td>#{d.id_commande}</td>
                                <td>{d.commande?.client?.utilisateur?.prenom} {d.commande?.client?.utilisateur?.nom}</td>
                                <td>{d.commande.total_marchandises.toLocaleString()} FCFA</td>
                                <td><span className={`status-pill status-${d.statut_livraison.toLowerCase()}`}>{d.statut_livraison}</span></td>
                                <td style={{ fontSize: '12px' }}>{d.date_prise_en_charge ? new Date(d.date_prise_en_charge).toLocaleDateString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}

                  {userDetail.roleData.type === 'client' && (
                    <>
                      <h4 style={{ marginBottom: '12px' }}><i className="fa-solid fa-basket-shopping"></i> Historique Commandes</h4>
                      <div className="panel-helper" style={{ marginBottom: '12px' }}>
                        <i className="fa-solid fa-receipt"></i>
                        <span><strong>{userDetail.roleData.total_commandes} commandes</strong> passées, dépense totale de <strong>{userDetail.roleData.total_depense.toLocaleString()} FCFA</strong>. Adresse : {userDetail.roleData.adresse_livraison}</span>
                      </div>
                      {userDetail.roleData.orders.length === 0 ? (
                        <p className="no-data">Aucune commande passée.</p>
                      ) : (
                        <table className="admin-table" style={{ marginBottom: '25px' }}>
                          <thead>
                            <tr>
                              <th>Commande</th>
                              <th>Montant</th>
                              <th>Frais Liv.</th>
                              <th>Statut</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.roleData.orders.map((o, idx) => (
                              <tr key={idx}>
                                <td>#{o.id_commande}</td>
                                <td>{o.total_marchandises.toLocaleString()} FCFA</td>
                                <td>{o.frais_livraison} FCFA</td>
                                <td><span className={`status-pill status-${o.statut.toLowerCase()}`}>{o.statut}</span></td>
                                <td style={{ fontSize: '12px' }}>{o.date_validation ? new Date(o.date_validation).toLocaleDateString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}

                  {!userDetail.roleData.type && (
                    <div className="panel-helper">
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Compte administrateur système. Aucune donnée métier associée.</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
