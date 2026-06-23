import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LangProvider } from './context/LangContext'
import InstallPrompt from './components/InstallPrompt'
import Footer from './components/Footer'
import Accueil from './pages/Accueil/Accueil'
import Connexion from './pages/auth/Connexion'
import AccueilClient from './pages/client/AccueilClient'
import Catalogue from './pages/client/Catalogue'
import Panier from './pages/client/Panier'
import SelectionLivreur from './pages/client/SelectionLivreur'
import DashboardVendeur from './pages/vendeur/Dashboard'
import CatalogueVendeur from './pages/vendeur/Catalogues'
import CommandesVendeur from './pages/vendeur/Commandes'
import RetourVendeur from './pages/vendeur/Retour'
import StatistiquesVendeur from './pages/vendeur/Statistiques'
import FacturesVendeur from './pages/vendeur/Factures'
import SignalementVendeur from './pages/vendeur/Signalement'
import VendeurProfil from './pages/vendeur/VendeurProfil'
import Livreur from './pages/livreur/Livreur'
import CommandesLivreur from './pages/livreur/Commandes'
import RetourLivreur from './pages/livreur/Retours'
import GainsLivreur from './pages/livreur/Gains'
import HistoriqueLivreur from './pages/livreur/Historique'
import LivreurProfil from './pages/livreur/LivreurProfil'
import Admin from './pages/admin/Admin'
import Inscription from './pages/auth/Inscription'
import ForgotPassword from './pages/auth/ForgotPassword'
import CGU from './pages/auth/CGU'
import PolitiqueConfidentialite from './pages/auth/PolitiqueConfidentialite'
import Profil from './pages/client/Profil'
import SuiviCommande from './pages/client/SuiviCommande'
import MarcheDetail from './pages/client/MarcheDetail'
import MesCommandes from './pages/client/MesCommandes'
import MesFactures from './pages/client/MesFactures'
import ClientLayout from './components/client/ClientLayout'
import VendeurLayout from './components/vendeur/VendeurLayout'
import LivreurLayout from './components/livreur/LivreurLayout'
import Evaluation from './pages/client/Evaluation'
import Inspection from './pages/client/Inspection'
import PaiementClient from './pages/client/PaiementClient'
import UserDetail from './pages/client/UserDetail'
import Notifications from './pages/Notifications'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function AppProviders({ children }) {
  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
  }
  return children
}

export default function App() {
  return (
    <AppProviders>
    <ThemeProvider>
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <InstallPrompt />
        <Routes>

        {/* Accueil */}
        <Route path="/" element={<Navigate to="/accueil" />} />
        <Route path="/accueil" element={<Accueil />} />

        {/* Connexions */}
        <Route path="/connect" element={<Connexion />} />
        <Route path="/register" element={<Inscription />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        {/* Connexion admin cachée */}
        <Route path="/admin-connect" element={<Connexion />} />

        {/* Pages client */}
        <Route path="/client" element={<ClientLayout />}>
          <Route path="accueil" element={<AccueilClient />} />
          <Route path="market/:marketId" element={<MarcheDetail />} />
          <Route path="catalogue/:vendeurId" element={<Catalogue />} />
          <Route path="panier" element={<Panier />} />
          <Route path="selection-livreur" element={<SelectionLivreur />} />
          <Route path="suivi-commande" element={<SuiviCommande />} />
          <Route path="profil" element={<Profil />} />
          <Route path="mes-commandes" element={<MesCommandes />} />
          <Route path="mes-factures" element={<MesFactures />} />
          <Route path="evaluation" element={<Evaluation />} />
          <Route path="inspection" element={<Inspection />} />
          <Route path="paiement" element={<PaiementClient />} />
          <Route path="notifications" element={<Notifications basePath="/client/notifications" />} />
          <Route path="user/:userId" element={<UserDetail />} />
        </Route>

        <Route path="/vendeur" element={<VendeurLayout />}>
          <Route path="dashboard" element={<DashboardVendeur />} />
          <Route path="catalogue" element={<CatalogueVendeur />} />
          <Route path="commandes" element={<CommandesVendeur />} />
          <Route path="retours" element={<RetourVendeur />} />
          <Route path="statistiques" element={<StatistiquesVendeur />} />
          <Route path="factures" element={<FacturesVendeur />} />
          <Route path="signalement" element={<SignalementVendeur />} />
          <Route path="notifications" element={<Notifications basePath="/vendeur/notifications" />} />
          <Route path="profil" element={<VendeurProfil />} />
        </Route>
        <Route path="/livreur" element={<LivreurLayout />}>
          <Route path="dashboard" element={<Livreur />} />
          <Route path="commandes" element={<CommandesLivreur />} />
          <Route path="gains" element={<GainsLivreur />} />
          <Route path="historique" element={<HistoriqueLivreur />} />
          <Route path="retours" element={<RetourLivreur />} />
          <Route path="notifications" element={<Notifications basePath="/livreur/notifications" />} />
          <Route path="profil" element={<LivreurProfil />} />
        </Route>
        <Route path="/admin/dashboard" element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/accueil" />} />

      </Routes>
      <Footer />
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
    </ThemeProvider>
    </AppProviders>
  )
}