import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Accueil from './pages/Accueil/Accueil'
import Connexion from './pages/auth/Connexion'
import Client from './pages/client/Client'
import Vendeur from './pages/vendeur/Vendeur'
import Livreur from './pages/livreur/Livreur'
import Admin from './pages/admin/Admin'
import Inscription from './pages/auth/Inscription'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Accueil */}
        <Route path="/" element={<Navigate to="/accueil" />} />
        <Route path="/accueil" element={<Accueil />} />

        {/* Connexions */}
        <Route path="/connect" element={<Connexion />} />
        <Route path="/register" element={<Inscription />} />
        {/* Connexion admin cachée */}
        <Route path="/admin-connect" element={<Connexion />} />

        {/* Pages temporaires */}
        <Route path="/client/dashboard" element={<h1>Client</h1>} />
        <Route path="/vendeur/dashboard" element={<h1>Vendeur</h1>} />
        <Route path="/livreur/dashboard" element={<h1>Livreur</h1>} />
        <Route path="/admin/dashboard" element={<h1>Admin</h1>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/accueil" />} />

      </Routes>
    </BrowserRouter>
  )
}