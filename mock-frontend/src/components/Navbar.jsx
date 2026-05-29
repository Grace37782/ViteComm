import React from 'react';

export default function Navbar({ user, screen, setScreen, handleLogout }) {
  return (
    <header className="navbar fade-in">
      <div className="logo" onClick={() => setScreen('landing')}>
        <i className="fa-solid fa-bolt logo-icon"></i>
        <span>Vite<span className="logo-accent">Comm</span></span>
      </div>

      {!user ? (
        <div className="nav-links">
          <button className="btn btn-secondary nav-btn" onClick={() => setScreen('landing')}>Accueil</button>
          <button className="btn btn-secondary nav-btn" onClick={() => setScreen('login')}>Connexion</button>
          <button className="btn btn-primary nav-btn" onClick={() => setScreen('register')}>S'inscrire</button>
        </div>
      ) : (
        <div className="nav-links">
          {/* Quick jump to Admin Dashboard if admin */}
          {user.est_admin && (
            <button 
              className={`btn btn-secondary nav-btn ${screen === 'admin' ? 'active' : ''}`}
              onClick={() => setScreen('admin')}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <i className="fa-solid fa-toolbox"></i> Panel Admin
            </button>
          )}
          
          <div className="user-pill" style={{ cursor: 'pointer' }} onClick={() => setScreen('profile')}>
            <i className="fa-solid fa-circle-user"></i>
            <span>{user.prenom} {user.nom}</span>
            <span className="role-badge">{user.role}</span>
          </div>

          <button className="btn btn-danger nav-btn" onClick={handleLogout} title="Déconnexion">
            <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      )}
    </header>
  );
}
