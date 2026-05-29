import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Alerts from './components/Alerts';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProfileDetails from './components/profile/ProfileDetails';
import AdminDashboard from './components/admin/AdminDashboard';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Navigation & Authentication states
  const [screen, setScreen] = useState('landing'); // 'landing', 'login', 'register', 'profile', 'admin'
  const [token, setToken] = useState(localStorage.getItem('vitecomm_token') || '');
  const [user, setUser] = useState(null);

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

        // Pre-fill availability if driver (RG19)
        if (data.role === 'livreur') {
          setAvailability({
            est_disponible: data.profil.est_disponible ?? true,
            distance_marche: data.profil.distance_marche ?? 5.0,
            heure_debut_dispo: data.profil.heure_debut_dispo || '08:00',
            heure_fin_dispo: data.profil.heure_fin_dispo || '18:00'
          });
        }

        // If user is admin and was heading to admin dashboard, preserve that screen, else go to profile
        if (data.est_admin && screen === 'admin') {
          setScreen('admin');
        } else if (screen === 'login' || screen === 'register' || screen === 'landing') {
          setScreen(data.est_admin ? 'admin' : 'profile');
        }
      } else {
        addAlert('danger', data.error || 'Session expirée.');
        setToken('');
        setScreen('login');
      }
    } catch (err) {
      addAlert('danger', "Impossible de contacter le serveur backend.");
    }
  };

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
      // Determine if email or telephone login
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
        setScreen(data.user.est_admin ? 'admin' : 'profile');
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
      // Clear token client-side regardless of network response
    }
    setToken('');
    setUser(null);
    setScreen('landing');
    addAlert('success', 'Déconnexion réussie. À bientôt !');
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

      {/* Header/Navbar */}
      <Navbar 
        user={user} 
        screen={screen} 
        setScreen={setScreen} 
        handleLogout={handleLogout} 
      />

      {/* Toast Alert messages */}
      <Alerts alerts={alerts} />

      {/* Core card wrapper */}
      <main className="main-card glassmorphism fade-in">
        
        {/* SCREEN 1: LANDING */}
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
          <LoginForm
            loginIdentifier={loginIdentifier}
            setLoginIdentifier={setLoginIdentifier}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            handleLoginSubmit={handleLoginSubmit}
            setScreen={setScreen}
          />
        )}

        {/* SCREEN 3: REGISTER */}
        {screen === 'register' && (
          <RegisterForm
            regRole={regRole}
            setRegRole={setRegRole}
            regForm={regForm}
            handleRegFieldChange={handleRegFieldChange}
            handleRegisterSubmit={handleRegisterSubmit}
            setScreen={setScreen}
          />
        )}

        {/* SCREEN 4: USER PROFILE & DASHBOARD */}
        {screen === 'profile' && user && (
          <ProfileDetails
            user={user}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            profileForm={profileForm}
            handleProfileFieldChange={handleProfileFieldChange}
            handleProfileUpdate={handleProfileUpdate}
            availability={availability}
            setAvailability={setAvailability}
            handleDriverAvailabilityUpdate={handleDriverAvailabilityUpdate}
            fetchProfile={fetchProfile}
          />
        )}

        {/* SCREEN 5: ADMIN CONSOLE dashboard */}
        {screen === 'admin' && user && user.est_admin && (
          <AdminDashboard
            token={token}
            addAlert={addAlert}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer fade-in">
        <p>&copy; 2026 ViteComm Application. Développé pour la soutenance de fin d'études.</p>
      </footer>
    </div>
  );
}
