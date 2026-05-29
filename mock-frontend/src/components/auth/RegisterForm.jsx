import React, { useState } from 'react';

export default function RegisterForm({ regRole, setRegRole, regForm, handleRegFieldChange, handleRegisterSubmit, setScreen }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <section className="screen-section">
      <div className="form-header">
        <h2>Rejoignez l'aventure ViteComm</h2>
        <p>Choisissez votre profil pour continuer l'inscription</p>
      </div>

      {/* Role Switcher Pills */}
      <div className="role-selector-pills">
        <button
          type="button"
          className={`pill-btn ${regRole === 'client' ? 'active' : ''}`}
          onClick={() => setRegRole('client')}
        >
          <i className="fa-solid fa-basket-shopping"></i> Client
        </button>
        <button
          type="button"
          className={`pill-btn ${regRole === 'vendeur' ? 'active' : ''}`}
          onClick={() => setRegRole('vendeur')}
        >
          <i className="fa-solid fa-shop"></i> Vendeur
        </button>
        <button
          type="button"
          className={`pill-btn ${regRole === 'livreur' ? 'active' : ''}`}
          onClick={() => setRegRole('livreur')}
        >
          <i className="fa-solid fa-motorcycle"></i> Livreur
        </button>
      </div>

      <form className="auth-form" onSubmit={handleRegisterSubmit}>
        {/* Common Tronc Commun */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Nom de famille</label>
            <input
              type="text"
              name="nom"
              required
              placeholder="Dupont"
              className="form-input"
              value={regForm.nom}
              onChange={handleRegFieldChange}
            />
          </div>
          <div className="form-group">
            <label>Prénom</label>
            <input
              type="text"
              name="prenom"
              required
              placeholder="Jean"
              className="form-input"
              value={regForm.prenom}
              onChange={handleRegFieldChange}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>Adresse Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="jean.dupont@exemple.com"
              className="form-input"
              value={regForm.email}
              onChange={handleRegFieldChange}
            />
          </div>
          <div className="form-group">
            <label>Numéro de Téléphone</label>
            <input
              type="tel"
              name="telephone"
              required
              placeholder="+237699999999"
              className="form-input"
              value={regForm.telephone}
              onChange={handleRegFieldChange}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>Mot de passe</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="mot_de_passe"
                required
                placeholder="••••••••"
                className="form-input"
                value={regForm.mot_de_passe}
                onChange={handleRegFieldChange}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirmation du mot de passe</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="mot_de_passe_confirmation"
                required
                placeholder="••••••••"
                className="form-input"
                value={regForm.mot_de_passe_confirmation}
                onChange={handleRegFieldChange}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                <i className={showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Client Fields */}
        {regRole === 'client' && (
          <div className="dynamic-role-fields">
            <div className="form-group">
              <label><i className="fa-solid fa-map-location-dot"></i> Adresse de livraison complète</label>
              <input
                type="text"
                name="adresse_livraison"
                required
                placeholder="Rue de la Liberté, Douala, Cameroun"
                className="form-input"
                value={regForm.adresse_livraison}
                onChange={handleRegFieldChange}
              />
            </div>
          </div>
        )}

        {/* Dynamic Vendeur Fields */}
        {regRole === 'vendeur' && (
          <div className="dynamic-role-fields">
            <div className="form-row-2">
              <div className="form-group">
                <label><i className="fa-solid fa-store"></i> Nom de l'établissement</label>
                <input
                  type="text"
                  name="nom_etablissement"
                  required
                  placeholder="Stand de Mboppi"
                  className="form-input"
                  value={regForm.nom_etablissement}
                  onChange={handleRegFieldChange}
                />
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-map-pin"></i> Localisation Marché</label>
                <select
                  name="localisation_marche"
                  className="form-input"
                  value={regForm.localisation_marche}
                  onChange={handleRegFieldChange}
                >
                  <option value="Marché Central">Marché Central</option>
                  <option value="Marché Sandaga">Marché Sandaga</option>
                  <option value="Marché Mokolo">Marché Mokolo</option>
                  <option value="Marché Mboppi">Marché Mboppi</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Livreur Fields */}
        {regRole === 'livreur' && (
          <div className="dynamic-role-fields">
            <div className="form-row-2">
              <div className="form-group">
                <label><i className="fa-solid fa-truck-pickup"></i> Type de véhicule</label>
                <select
                  name="type_vehicule"
                  className="form-input"
                  value={regForm.type_vehicule}
                  onChange={handleRegFieldChange}
                >
                  <option value="Moto">Moto / Scooter</option>
                  <option value="Tricycle">Tricycle Cargo</option>
                  <option value="Voiture">Voiture Compacte</option>
                  <option value="Velo">Vélo / À pied</option>
                </select>
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-rectangle-ad"></i> Plaque d'immatriculation</label>
                <input
                  type="text"
                  name="immatriculation"
                  required
                  placeholder="LT-123-AB"
                  className="form-input"
                  value={regForm.immatriculation}
                  onChange={handleRegFieldChange}
                />
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          S'enregistrer et s'authentifier <i className="fa-solid fa-circle-check"></i>
        </button>
        
        <p className="form-footer">
          Vous avez déjà un compte ?{' '}
          <button type="button" onClick={() => setScreen('login')}>Connectez-vous</button>
        </p>
      </form>
    </section>
  );
}
