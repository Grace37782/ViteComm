import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Accueil from './pages/Accueil/Accueil'
import Connexion from './pages/auth/Connexion'
import AccueilClient from './pages/client/AccueilClient'
import Catalogue from './pages/client/Catalogue'
import Panier from './pages/client/Panier'
import SelectionLivreur from './pages/client/SelectionLivreur'
import Vendeur from './pages/vendeur/Vendeur'
import Livreur from './pages/livreur/Livreur'
import Admin from './pages/admin/Admin'
import Inscription from './pages/auth/Inscription'
import Profil from './pages/client/Profil'
import SuiviCommande from './pages/client/SuiviCommande'
import MarcheDetail from './pages/client/MarcheDetail'
import MesCommandes from './pages/client/MesCommandes'
export default function App() {
  return (
    <AuthProvider>
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
        <Route path="/client/accueil" element={<AccueilClient />} />
        <Route path="/client/market/:marketId" element={<MarcheDetail />} />
        <Route path="/client/catalogue/:vendeurId" element={<Catalogue />} />
        <Route path="/client/panier" element={<Panier />} />
        <Route path="/client/selection-livreur" element={<SelectionLivreur />} />
        <Route path="/client/mes-commandes" element={<MesCommandes />} />
        <Route path="/client/profil" element={<Profil />} />
        <Route path="/client/suivi" element={<SuiviCommande />} />
        <Route path="/vendeur/dashboard" element={<Vendeur />} />
        <Route path="/livreur/dashboard" element={<Livreur />} />
        <Route path="/admin/dashboard" element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/accueil" />} />

      </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}