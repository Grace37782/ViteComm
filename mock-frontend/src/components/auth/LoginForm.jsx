import React, { useState } from 'react';

export default function LoginForm({ loginIdentifier, setLoginIdentifier, loginPassword, setLoginPassword, handleLoginSubmit, setScreen }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
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
          <div class="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="form-input"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
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

        <button type="submit" className="btn btn-primary btn-block">
          Se connecter <i className="fa-solid fa-circle-chevron-right"></i>
        </button>
        
        <p className="form-footer">
          Vous n'avez pas encore de compte ?{' '}
          <button type="button" onClick={() => setScreen('register')}>Créez-en un ici</button>
        </p>
      </form>
    </section>
  );
}
