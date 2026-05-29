import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Navigation & Authentication states
  const [screen, setScreen] = useState('landing'); // 'landing', 'login', 'register', 'profile'
  const [token, setToken] = useState(localStorage.getItem('vitecomm_token') || '');
  const [user, setUser] = useState(null);

  // Form password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Banners / Alerts state
  const [alerts, setAlerts] = useState([]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState('client');
  const [regForm, setRegForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    mot_de_passe_confirmation: '',
    adresse_livraison: '',
    nom_etablissement: '',
    localisation_marche: 'Marché Central',
    type_vehicule: 'Moto',
    immatriculation: ''
  });

  // Profile form state (editing)
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse_livraison: '',
    nom_etablissement: '',
    localisation_marche: '',
    type_vehicule: '',
    immatriculation: '',
    mot_de_passe: '',
    mot_de_passe_confirmation: ''
  });

  // Driver Availability form state (RG19)
  const [availability, setAvailability] = useState({
    est_disponible: true,
    distance_marche: 5.0,
    heure_debut_dispo: '08:00',
    heure_fin_dispo: '18:00'
  });

  // Add toast notifications
  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  // Check login state on load or token update
  useEffect(() => {
    if (token) {
      localStorage.setItem('vitecomm_token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('vitecomm_token');
      setUser(null);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        // Pre-fill profile editing fields
        setProfileForm({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          adresse_livraison: data.profil?.adresse_livraison || '',
          nom_etablissement: data.profil?.nom_etablissement || '',
          localisation_marche: data.profil?.localisation_marche || '',
          type_vehicule: data.profil?.type_vehicule || '',
          immatriculation: data.profil?.immatriculation || '',
          mot_de_passe: '',
          mot_de_passe_confirmation: ''
        });

        // Pre-fill availability if driver
        if (data.role === 'livreur') {
          setAvailability({
            est_disponible: data.profil.est_disponible ?? true,
            distance_marche: data.profil.distance_marche ?? 5.0,
            heure_debut_dispo: data.profil.heure_debut_dispo || '08:00',
            heure_fin_dispo: data.profil.heure_fin_dispo || '18:00'
          });
        }
        setScreen('profile');
      } else {
        addAlert('danger', data.error || 'Session expirée.');
        setToken('');
        setScreen('login');
      }
    } catch (err) {
      addAlert('danger', "Impossible de contacter le serveur backend.");
    }
  };

  // Dynamic Dynamic Role Registrations
  const handleRegFieldChange = (e) => {
    const { name, value } = e.target;
    setRegForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      addAlert('danger', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      // Determine if email or telephone
      const isEmail = loginIdentifier.includes('@');
      const body = {
        [isEmail ? 'email' : 'telephone']: loginIdentifier,
        mot_de_passe: loginPassword
      };

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        addAlert('success', `Ravi de vous revoir, ${data.user.prenom} !`);
        setToken(data.token);
        setUser(data.user);
        setScreen('profile');
      } else {
        addAlert('danger', data.error || 'Identifiants incorrects.');
      }
    } catch (err) {
      addAlert('danger', 'Impossible de se connecter au serveur backend.');
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!regForm.nom || !regForm.prenom || !regForm.email || !regForm.telephone || !regForm.mot_de_passe) {
      addAlert('danger', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (regForm.mot_de_passe !== regForm.mot_de_passe_confirmation) {
      addAlert('danger', 'Les deux mots de passe ne correspondent pas.');
      return;
    }

    const payload = {
      nom: regForm.nom,
      prenom: regForm.prenom,
      email: regForm.email,
      telephone: regForm.telephone,
      mot_de_passe: regForm.mot_de_passe,
      mot_de_passe_confirmation: regForm.mot_de_passe_confirmation,
      role: regRole
    };

    if (regRole === 'client') {
      payload.adresse_livraison = regForm.adresse_livraison;
    } else if (regRole === 'vendeur') {
      payload.nom_etablissement = regForm.nom_etablissement;
      payload.localisation_marche = regForm.localisation_marche;
    } else if (regRole === 'livreur') {
      payload.type_vehicule = regForm.type_vehicule;
      payload.immatriculation = regForm.immatriculation;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        addAlert('success', 'Votre compte a été créé avec succès ! Connecté automatiquement.');
        setToken(data.token);
        setUser(data.user);
        setScreen('profile');
      } else {
        addAlert('danger', data.error || 'Erreur lors de la création du compte.');
      }
    } catch (err) {
      addAlert('danger', 'Impossible de joindre le serveur.');
    }
  };

  // Profile Update handler
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Check password confirm if filled
    if (profileForm.mot_de_passe && profileForm.mot_de_passe !== profileForm.mot_de_passe_confirmation) {
      addAlert('danger', 'Les mots de passe ne correspondent pas.');
      return;
    }

    const payload = {
      nom: profileForm.nom,
      prenom: profileForm.prenom,
      email: profileForm.email,
      telephone: profileForm.telephone
    };

    if (profileForm.mot_de_passe) {
      payload.mot_de_passe = profileForm.mot_de_passe;
      payload.mot_de_passe_confirmation = profileForm.mot_de_passe_confirmation;
    }

    if (user.role === 'client') {
      payload.adresse_livraison = profileForm.adresse_livraison;
    } else if (user.role === 'vendeur') {
      payload.nom_etablissement = profileForm.nom_etablissement;
      payload.localisation_marche = profileForm.localisation_marche;
    } else if (user.role === 'livreur') {
      payload.type_vehicule = profileForm.type_vehicule;
      payload.immatriculation = profileForm.immatriculation;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        addAlert('success', 'Profil mis à jour avec succès.');
        setUser(data.user);
        setIsEditMode(false);
      } else {
        addAlert('danger', data.error || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      addAlert('danger', 'Impossible de sauvegarder le profil.');
    }
  };

  // Driver Availability handler (RG19)
  const handleDriverAvailabilityUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/driver/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(availability)
      });
      const data = await res.json();

      if (res.ok) {
        addAlert('success', 'Paramètres de disponibilité actualisés en temps réel !');
        // Fetch fresh profile state
        fetchProfile();
      } else {
        addAlert('danger', data.error || 'Erreur lors de l\'actualisation.');
      }
    } catch (err) {
      addAlert('danger', 'Erreur de communication avec le serveur.');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Ignore network errors on logout since we clear client-side token anyway
    }
    setToken('');
    setUser(null);
    setScreen('landing');
    addAlert('success', 'Déconnexion réussie. À bientôt !');
  };

  const selectRegisterRole = (role) => {
    setRegRole(role);
  };

  const handleRoleLandingClick = (role) => {
    setRegRole(role);
    setScreen('register');
  };

  return (
    <div className="app-container">
      {/* Background Animated Blobs */}
      <div className="glass-bg">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      {/* Header / Navbar */}
      <header className="navbar fade-in">
        <div className="logo" onClick={() => setScreen('landing')}>
          <i className="fa-solid fa-bolt logo-icon"></i>
          <span>Vite<span class="logo-accent">Comm</span></span>
        </div>

        {!user ? (
          <div className="nav-links">
            <button className="btn btn-secondary nav-btn" onClick={() => setScreen('landing')}>Accueil</button>
            <button className="btn btn-secondary nav-btn" onClick={() => setScreen('login')}>Connexion</button>
            <button className="btn btn-primary nav-btn" onClick={() => setScreen('register')}>S'inscrire</button>
          </div>
        ) : (
          <div className="nav-links">
            <div className="user-pill">
              <i className="fa-solid fa-circle-user"></i>
              <span>{user.prenom} {user.nom}</span>
              <span className="role-badge">{user.role}</span>
            </div>
            <button className="btn btn-danger nav-btn" onClick={handleLogout}>
              <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        )}
      </header>

      {/* Alert banner toasts */}
      <div className="alert-container">
        {alerts.map(a => (
          <div key={a.id} className={`alert alert-${a.type}`}>
            <i className={a.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
            <span>{a.message}</span>
          </div>
        ))}
      </div>

      {/* Core card wrapper */}
      <main className="main-card glassmorphism fade-in">
        
        {/* SCREEN 1: LANDING PAGE */}
        {screen === 'landing' && (
          <section className="screen-section">
            <div className="hero-section">
              <span className="badge-premium">PROTOTYPE ACADÉMIQUE DE SOUTENANCE React</span>
              <h1>L'excellence de la livraison de proximité</h1>
              <p className="hero-desc">
                ViteComm connecte dynamiquement les acheteurs locaux, les commerçants de marchés traditionnels et les livreurs indépendants dans un écosystème ultra-sécurisé, rapide et audité en temps réel.
              </p>
            </div>

            <div className="roles-grid">
              <div className="role-card card-client" onClick={() => handleRoleLandingClick('client')}>
                <div className="card-icon"><i className="fa-solid fa-basket-shopping"></i></div>
                <h3>Espace Client</h3>
                <p>Recherchez des articles frais du marché local, gérez votre panier d'achats unique (RG22), et suivez vos colis en toute tranquillité.</p>
                <button className="btn btn-role">Devenir Client <i className="fa-solid fa-arrow-right"></i></button>
              </div>

              <div className="role-card card-vendeur" onClick={() => handleRoleLandingClick('vendeur')}>
                <div className="card-icon"><i className="fa-solid fa-shop"></i></div>
                <h3>Espace Vendeur</h3>
                <p>Digitalisez votre étal de marché, suivez vos gains nets déduits de la commission de 0.6%, et gérez l'historique des prix (RG24).</p>
                <button className="btn btn-role">Ouvrir ma boutique <i className="fa-solid fa-arrow-right"></i></button>
              </div>

              <div className="role-card card-livreur" onClick={() => handleRoleLandingClick('livreur')}>
                <div className="card-icon"><i className="fa-solid fa-motorcycle"></i></div>
                <h3>Espace Livreur</h3>
                <p>Prenez des courses, organisez votre disponibilité géographique, certifiez vos collectes avec double preuve photo.</p>
                <button className="btn btn-role">Commencer à livrer <i className="fa-solid fa-arrow-right"></i></button>
              </div>
            </div>
          </section>
        )}

        {/* SCREEN 2: LOGIN */}
        {screen === 'login' && (
          <section className="screen-section">
            <div className="form-header">
              <h2>Ravi de vous revoir !</h2>
              <p>Connectez-vous pour accéder à votre tableau de bord sur-mesure</p>
            </div>

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label><i className="fa-solid fa-envelope-open"></i> Email ou Téléphone</label>
                <input
                  type="text"
                  required
                  placeholder="nom@exemple.com ou +237..."
                  className="form-input"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label><i className="fa-solid fa-lock"></i> Mot de passe</label>
                <div className="password-wrapper">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    <i className={showLoginPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Se connecter <i className="fa-solid fa-circle-chevron-right"></i>
              </button>
              
              <p className="form-footer">
                Vous n'avez pas encore de compte ?{' '}
                <button type="button" onClick={() => setScreen('register')}>Créez-en un ici</button>
              </p>
            </form>
          </section>
        )}

        {/* SCREEN 3: REGISTER */}
        {screen === 'register' && (
          <section className="screen-section">
            <div className="form-header">
              <h2>Rejoignez l'aventure ViteComm</h2>
              <p>Choisissez votre profil pour continuer l'inscription</p>
            </div>

            {/* Role Select switch pills */}
            <div className="role-selector-pills">
              <button
                type="button"
                className={`pill-btn ${regRole === 'client' ? 'active' : ''}`}
                onClick={() => selectRegisterRole('client')}
              >
                <i className="fa-solid fa-basket-shopping"></i> Client
              </button>
              <button
                type="button"
                className={`pill-btn ${regRole === 'vendeur' ? 'active' : ''}`}
                onClick={() => selectRegisterRole('vendeur')}
              >
                <i className="fa-solid fa-shop"></i> Vendeur
              </button>
              <button
                type="button"
                className={`pill-btn ${regRole === 'livreur' ? 'active' : ''}`}
                onClick={() => selectRegisterRole('livreur')}
              >
                <i className="fa-solid fa-motorcycle"></i> Livreur
              </button>
            </div>

            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              {/* Common Fields */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Nom</label>
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
                  <label>Email</label>
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
                  <label>Téléphone</label>
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
                      type={showRegPassword ? 'text' : 'password'}
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
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      <i className={showRegPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirmation</label>
                  <div className="password-wrapper">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
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
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    >
                      <i className={showRegConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
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
                        placeholder="Frais de l'Ouest"
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
              
              <p class="form-footer">
                Vous avez déjà un compte ?{' '}
                <button type="button" onClick={() => setScreen('login')}>Connectez-vous</button>
              </p>
            </form>
          </section>
        )}

        {/* SCREEN 4: USER PROFILE & DASHBOARD */}
        {screen === 'profile' && user && (
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
              {/* Profile details form card */}
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

                  {/* Client Specific Fields */}
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

                  {/* Vendeur Specific Fields */}
                  {user.role === 'vendeur' && (
                    <div className="role-specific-details">
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>Établissement</label>
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
                          <label>Marché</label>
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

                  {/* Livreur Specific Fields */}
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

                  {/* Optional Password Update section shown only in Edit Mode */}
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
                            fetchProfile(); // Reset fields to loaded profile data
                          }}
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Status and dynamic panels display (RG15 compliance badge & RG19 availability) */}
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
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer fade-in">
        <p>&copy; 2026 ViteComm Application. Développé pour la soutenance de fin d'études.</p>
      </footer>
    </div>
  );
}
