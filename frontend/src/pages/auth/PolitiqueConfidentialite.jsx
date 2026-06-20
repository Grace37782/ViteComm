import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, Database, Share2, UserCheck, Mail, Shield, FileText, AlertTriangle, Clock } from 'lucide-react'

export default function PolitiqueConfidentialite() {
  const navigate = useNavigate()

  const sections = [
    {
      icon: <Eye size={16} />,
      title: '1. Données collectées',
      content: `ViteComm collecte les données personnelles suivantes lors de l'inscription et de l'utilisation de la plateforme : nom, prénom, adresse email, numéro de téléphone, adresse de livraison, photo de profil (optionnelle), et données de transaction (historique des commandes, paiements). Ces données sont collectées uniquement dans le cadre du fonctionnement de la plateforme.`
    },
    {
      icon: <Database size={16} />,
      title: '2. Utilisation des données',
      content: `Vos données personnelles sont utilisées pour : la création et la gestion de votre compte utilisateur, le traitement et le suivi de vos commandes, la livraison des marchandises (partage de l'adresse avec le livreur et le vendeur concerné), l'envoi de codes de vérification et de notifications par email, le calcul du score de réputation des vendeurs et livreurs, l'amélioration de nos services et l'expérience utilisateur, et le respect de nos obligations légales.`
    },
    {
      icon: <Lock size={16} />,
      title: '3. Stockage et sécurité',
      content: `Vos données sont stockées sur des serveurs sécurisés et chiffrées. ViteComm met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation. Votre mot de passe est hashé et ne jamais stocké en clair. En cas de violation de données vous affectant, vous serez notifié dans les meilleurs délais.`
    },
    {
      icon: <Share2 size={16} />,
      title: '4. Partage des données avec les tiers',
      content: `Vos données peuvent être partagées avec les parties suivantes dans le cadre strict du fonctionnement de ViteComm : les vendeurs (nom, adresse de livraison, numéro de commande), les livreurs (nom, adresse de livraison, numéro de commande), FedaPay (données de transaction pour le traitement des paiements Mobile Money), et les autorités compétentes en cas d'obligation légale. Vos données ne sont jamais vendues à des tiers à des fins commerciales.`
    },
    {
      icon: <FileText size={16} />,
      title: '5. Cookies',
      content: `ViteComm utilise des cookies strictement nécessaires au fonctionnement de la plateforme (session utilisateur, préférences). Nous n'utilisons pas de cookies publicitaires ni de cookies de suivi tiers. Vous pouvez gérer les paramètres de cookies dans votre navigateur, mais certaines fonctionnalités de la plateforme pourraient ne pas fonctionner correctement si les cookies sont désactivés.`
    },
    {
      icon: <UserCheck size={16} />,
      title: '6. Droits des utilisateurs',
      content: `Conformément à la législation béninoise sur la protection des données personnelles, vous disposez des droits suivants : droit d'accès (consulter les données que nous détenons sur vous), droit de rectification (corriger des données inexactes ou incomplètes), droit de suppression (demander la suppression de votre compte et de vos données), droit d'opposition (vous opposer au traitement de vos données à des fins spécifiques). Pour exercer ces droits, contactez-nous à l'adresse indiquée ci-dessous.`
    },
    {
      icon: <Clock size={16} />,
      title: '7. Conservation des données',
      content: `Vos données personnelles sont conservées pendant toute la durée d'existence de votre compte sur ViteComm. Après la suppression de votre compte, vos données personnelles seront supprimées dans un délai de 30 jours, à l'exception des données de transaction que nous sommes tenus de conserver pour des obligations légales (conservation pendant 5 ans conformément à la réglementation en vigueur).`
    },
    {
      icon: <AlertTriangle size={16} />,
      title: '8. Modifications de la politique',
      content: `ViteComm se réserve le droit de modifier la présente politique de confidentialité à tout moment. En cas de modification substantielle, vous serez notifié par email ou par une notification sur la plateforme. La continuation de l'utilisation de ViteComm après notification vaut acceptation de la politique modifiée.`
    },
    {
      icon: <Mail size={16} />,
      title: '9. Contact',
      content: `Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits, vous pouvez nous contacter à l'adresse suivante : sissolionel@gmail.com. Nous nous engageons à répondre à votre demande dans un délai de 30 jours.`
    }
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div>
              <h1 className="text-white font-black text-lg">Politique de Confidentialité</h1>
              <p className="text-white/60 text-xs">ViteComm — Dernière mise à jour : Juin 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="rounded-2xl p-6 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1D9E7518', color: '#1D9E75' }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>ViteComm — Protection de vos données</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Votre vie privée est importante pour nous</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            La présente politique de confidentialité décrit comment ViteComm collecte, utilise et protège vos données personnelles lors de l'utilisation de sa plateforme de commerce en ligne.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <div key={i} className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1D9E7518', color: '#1D9E75' }}>
                  {section.icon}
                </div>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate(-1)}
            className="rounded-2xl px-8 py-3 text-sm font-black cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: '#1D9E75', color: '#fff', border: 'none' }}>
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
