import React from 'react';

export default function ProfileDetails({
  user,
  isEditMode,
  setIsEditMode,
  profileForm,
  handleProfileFieldChange,
  handleProfileUpdate,
  availability,
  setAvailability,
  handleDriverAvailabilityUpdate,
  fetchProfile
}) {
  return (
    <section className="screen-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <i className="fa-solid fa-user-tie"></i>
        </div>
        <div className="profile-meta">
          <h2>{user.prenom} {user.nom}</h2>
          <span className="role-badge-premium">{user.role}</span>
        </div>
      </div>

      <div className="profile-layout">
        {/* Core Editable Form */}
        <div className="profile-edit-card">
          <h3>Informations Personnelles</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  required
                  className="form-input"
                  disabled={!isEditMode}
                  value={profileForm.nom}
                  onChange={handleProfileFieldChange}
                />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  required
                  className="form-input"
                  disabled={!isEditMode}
                  value={profileForm.prenom}
                  onChange={handleProfileFieldChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="form-input"
                  disabled={!isEditMode}
                  value={profileForm.email}
                  onChange={handleProfileFieldChange}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  required
                  className="form-input"
                  disabled={!isEditMode}
                  value={profileForm.telephone}
                  onChange={handleProfileFieldChange}
                />
              </div>
            </div>

            {/* Client specific field */}
            {user.role === 'client' && (
              <div className="role-specific-details">
                <div className="form-group">
                  <label>Adresse de livraison</label>
                  <input
                    type="text"
                    name="adresse_livraison"
                    className="form-input"
                    disabled={!isEditMode}
                    value={profileForm.adresse_livraison}
                    onChange={handleProfileFieldChange}
                  />
                </div>
              </div>
            )}

            {/* Vendeur specific fields */}
            {user.role === 'vendeur' && (
              <div className="role-specific-details">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nom de l'établissement</label>
                    <input
                      type="text"
                      name="nom_etablissement"
                      className="form-input"
                      disabled={!isEditMode}
                      value={profileForm.nom_etablissement}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marché local</label>
                    <input
                      type="text"
                      name="localisation_marche"
                      className="form-input"
                      disabled={!isEditMode}
                      value={profileForm.localisation_marche}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Livreur specific fields */}
            {user.role === 'livreur' && (
              <div className="role-specific-details">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Type de véhicule</label>
                    <input
                      type="text"
                      name="type_vehicule"
                      className="form-input"
                      disabled={!isEditMode}
                      value={profileForm.type_vehicule}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Plaque d'immatriculation</label>
                    <input
                      type="text"
                      name="immatriculation"
                      className="form-input"
                      disabled={!isEditMode}
                      value={profileForm.immatriculation}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="password-change-section">
                <h4 className="section-divider">Modifier le mot de passe (optionnel)</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="mot_de_passe"
                      placeholder="Laisser vide pour conserver"
                      className="form-input"
                      value={profileForm.mot_de_passe}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input
                      type="password"
                      name="mot_de_passe_confirmation"
                      placeholder="Laisser vide"
                      className="form-input"
                      value={profileForm.mot_de_passe_confirmation}
                      onChange={handleProfileFieldChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {!isEditMode ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditMode(true)}
                >
                  <i className="fa-solid fa-pen-to-square"></i> Modifier le profil
                </button>
              ) : (
                <>
                  <button type="submit" className="btn btn-success">
                    <i className="fa-solid fa-save"></i> Enregistrer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditMode(false);
                      fetchProfile();
                    }}
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Side Panel showing Badges & Availability (RG15 / RG19) */}
        <div className="profile-stats-card">
          {user.role === 'client' && (
            <div className="reputation-badge-card empty-rep">
              <div className="rep-icon"><i className="fa-solid fa-shield-halved"></i></div>
              <h4>Compte Client Sécurisé</h4>
              <p>Vos achats et vos données personnelles sont strictement encadrés par la confidentialité RGPD (règle <strong>RG15</strong>).</p>
            </div>
          )}

          {user.role === 'vendeur' && (
            <div className="reputation-badge-card highlight-rep">
              <div className="rep-score-value">{user.profil?.score_reputation?.toFixed(1) || '0.0'}</div>
              <h4>Score de Réputation Vendeur</h4>
              <span className="badge-ro"><i className="fa-solid fa-lock"></i> LECTURE SEULE (RG15)</span>
              <p>Ce score dynamique reflète la moyenne pondérée de toutes les évaluations clients récoltées.</p>
            </div>
          )}

          {user.role === 'livreur' && (
            <>
              <div className="reputation-badge-card highlight-rep">
                <div className="rep-score-value">{user.profil?.score_reputation?.toFixed(1) || '0.0'}</div>
                <h4>Score de Réputation Livreur</h4>
                <span className="badge-ro"><i className="fa-solid fa-lock"></i> LECTURE SEULE (RG15)</span>
                <p>Votre note dépend exclusivement des retours de livraison validés par les clients.</p>
              </div>

              {/* Driver Availability Widget (RG19) */}
              <div className="availability-card glassmorphism-inset">
                <h3><i className="fa-solid fa-clock"></i> Plages de Disponibilité (RG19)</h3>
                <form onSubmit={handleDriverAvailabilityUpdate}>
                  <div className="form-group flex-row">
                    <label>Statut opérationnel :</label>
                    <div className="switch-wrapper">
                      <input
                        type="checkbox"
                        id="driver-dispo-switch"
                        className="switch-checkbox"
                        checked={availability.est_disponible}
                        onChange={e => setAvailability(prev => ({ ...prev, est_disponible: e.target.checked }))}
                      />
                      <label htmlFor="driver-dispo-switch" className="switch-label"></label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Distance max d'activité (km) :</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-input"
                      required
                      value={availability.distance_marche}
                      onChange={e => setAvailability(prev => ({ ...prev, distance_marche: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Début horaire :</label>
                      <input
                        type="time"
                        className="form-input"
                        required
                        value={availability.heure_debut_dispo}
                        onChange={e => setAvailability(prev => ({ ...prev, heure_debut_dispo: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fin horaire :</label>
                      <input
                        type="time"
                        className="form-input"
                        required
                        value={availability.heure_fin_dispo}
                        onChange={e => setAvailability(prev => ({ ...prev, heure_fin_dispo: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block btn-sm">
                    <i className="fa-solid fa-check"></i> Actualiser ma dispo
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
