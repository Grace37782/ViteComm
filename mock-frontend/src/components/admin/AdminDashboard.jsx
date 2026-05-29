import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboard({ token, addAlert }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'reports', 'disputes'

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

  // On mount or token change
  useEffect(() => {
    loadAnalytics();
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'users') loadUsers();
    if (tab === 'reports') loadReports();
    if (tab === 'disputes') loadDisputes();
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
      } else {
        addAlert('danger', data.error || 'Erreur lors de la résolution.');
      }
    } catch (e) {
      addAlert('danger', 'Impossible de résoudre le litige.');
    }
  };

  return (
    <div className="admin-container">
      {/* Admin Panel Header */}
      <div className="admin-header fade-in">
        <h2><i className="fa-solid fa-screwdriver-wrench"></i> Console de Supervision Globale</h2>
        <p className="subtitle">Auditez les transactions, arbitrez les litiges et gérez les utilisateurs.</p>
      </div>

      {/* Admin navigation tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          <i className="fa-solid fa-chart-line"></i> Analytics & Finance
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <i className="fa-solid fa-users-gear"></i> Utilisateurs (RG11)
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          <i className="fa-solid fa-bullhorn"></i> Signalements{' '}
          {stats?.alertes?.signalements_en_attente > 0 && (
            <span className="badge-alert-dot">{stats.alertes.signalements_en_attente}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => handleTabChange('disputes')}
        >
          <i className="fa-solid fa-scale-balanced"></i> Centre des Litiges{' '}
          {stats?.alertes?.litiges_ouverts > 0 && (
            <span className="badge-alert-dot">{stats.alertes.litiges_ouverts}</span>
          )}
        </button>
      </div>

      <div className="admin-tab-body glassmorphism-inset fade-in">

        {/* TAB 1: ANALYTICS & FINANCE */}
        {activeTab === 'analytics' && stats && (
          <div className="tab-pane">
            <div className="metrics-grid">
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

            <div className="audit-sections-grid">
              <div className="audit-list-card">
                <h3><i className="fa-solid fa-thumbs-up" style={{ color: 'var(--success)' }}></i> Produits Populaires</h3>
                {stats.produits_populaires.length === 0 ? (
                  <p className="no-data">Aucune donnée de vente pour le moment.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom du produit</th>
                        <th>Quantité Vendue</th>
                        <th>Prix Réf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.produits_populaires.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.nom}</strong></td>
                          <td style={{ color: 'var(--success)' }}>{p.quantite} achetés</td>
                          <td>{p.prix_reference} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="audit-list-card">
                <h3><i className="fa-solid fa-circle-xmark" style={{ color: 'var(--danger)' }}></i> Produits Refusés (Rejets Qualité)</h3>
                {stats.produits_refuses.length === 0 ? (
                  <p className="no-data">Aucun rejet physique de produit signalé lors des livraisons.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom du produit</th>
                        <th>Quantité Refusée</th>
                        <th>Prix Réf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.produits_refuses.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.nom}</strong></td>
                          <td style={{ color: 'var(--danger)' }}>{p.quantite} rejets</td>
                          <td>{p.prix_reference} FCFA</td>
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
        {activeTab === 'users' && (
          <div className="tab-pane">
            <div className="panel-helper">
              <i className="fa-solid fa-shield-halved"></i>
              <span><strong>Conformité RGPD stricte (RG11 & RG15) :</strong> Aucun historique d'achat ou de navigation privé n'est exposé. Les scores de réputation sont verrouillés en lecture seule pour préserver la confiance du réseau.</span>
            </div>

            <table className="admin-table user-table">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Contact</th>
                  <th>Rôle</th>
                  <th>Réputation</th>
                  <th>Statut</th>
                  <th>Actions de Modération</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id_user} className={`status-row-${u.statut_compte.toLowerCase()}`}>
                    <td>
                      <div className="user-name-cell">
                        <i className="fa-solid fa-circle-user"></i>
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
          </div>
        )}

        {/* TAB 3: SIGNALEMENTS (RG14) */}
        {activeTab === 'reports' && (
          <div className="tab-pane">
            <div className="panel-helper warning-helper">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span><strong>Droit de Sanction Universel (RG14) :</strong> Même si la vie privée des clients est confidentielle, vous pouvez les suspendre ou les bannir directement s'ils font l'objet d'abus avérés signalés.</span>
            </div>

            {reports.length === 0 ? (
              <p className="no-data">Aucun signalement en attente de modération.</p>
            ) : (
              <div className="reports-grid">
                {reports.map(r => (
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
        {activeTab === 'disputes' && (
          <div className="tab-pane">
            {disputes.length === 0 ? (
              <p className="no-data">Aucun litige de livraison n'est actuellement ouvert.</p>
            ) : (
              <div className="disputes-stack">
                {disputes.map(d => (
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
                            <li key={idx}>
                              <strong>{line.produit.nom}</strong> x{line.quantite_commandee} (Prix appliqué: {line.prix_vente_applique} FCFA)
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
                              {/* Using generic placeholders or beautiful designs for demonstration */}
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

      </div>

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

    </div>
  );
}
