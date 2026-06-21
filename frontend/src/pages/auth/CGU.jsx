import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, Users, ShoppingCart, Truck, CreditCard, AlertTriangle, Scale, Lock } from 'lucide-react'

export default function CGU() {
  const navigate = useNavigate()

  const sections = [
    {
      icon: <FileText size={16} />,
      title: '1. Objet et acceptation',
      content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme ViteComm, un marketplace en ligne connectant clients, vendeurs et livreurs au Bénin. En créant un compte ou en utilisant ViteComm, vous acceptez sans réserve les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.`
    },
    {
      icon: <Users size={16} />,
      title: '2. Inscription et compte utilisateur',
      content: `L'inscription est ouverte à toute personne physique résidant au Bénin. Trois types de comptes sont disponibles : Client (achat de marchandises), Vendeur (vente de marchandises) et Livreur (livraison de commandes). Chaque utilisateur doit fournir des informations exactes et à jour. Un seul compte par personne est autorisé. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.`
    },
    {
      icon: <Shield size={16} />,
      title: '3. Vérification et sécurité du compte',
      content: `L'inscription nécessite une vérification par code envoyé par email. ViteComm se réserve le droit de suspendre ou bannir tout compte en cas d'activité suspecte, de non-respect des présentes conditions, ou de tentatives de fraude. En cas de perte de mot de passe, une procédure de réinitialisation par email est disponible.`
    },
    {
      icon: <ShoppingCart size={16} />,
      title: '4. Obligations des clients',
      content: `Le client s'engage à passer des commandes sérieuses et à effectuer le paiement conformément aux modalités proposées (Mobile Money via FedaPay). Le client dispose d'un droit de rétractation et peut signaler tout problème de qualité ou de conformité via le système de litiges. Le client évalue les livraisons et les vendeurs après chaque transaction.`
    },
    {
      icon: <Truck size={16} />,
      title: '5. Obligations des vendeurs',
      content: `Le vendeur s'engage à fournir des produits conformes à leurs descriptions, à maintenir un stock à jour et à valider les commandes dans les délais impartis. Le vendeur dispose d'un score de réputation (sur 100) calculé en fonction de la qualité de ses produits et des évaluations clients. Un vendeur avec un score inférieur à 30/100 fait l'objet d'un signalement automatique. Le vendeur est responsable de la disponibilité de ses articles.`
    },
    {
      icon: <Truck size={16} />,
      title: '6. Obligations des livreurs',
      content: `Le livreur s'engage à effectuer les livraisons dans les meilleurs délais et en toute sécurité. Le livreur doit collecter les marchandises uniquement après validation du vendeur, et ne peut finaliser une livraison qu'après confirmation du client via un code de vérification. Le livreur dispose d'un score de réputation et d'un statut de disponibilité modifiable.`
    },
    {
      icon: <CreditCard size={16} />,
      title: '7. Paiements et tarification',
      content: `Les paiements s'effectuent exclusivement par Mobile Money (MTN, Moov, Celtis) via la plateforme sécurisée FedaPay. Le paiement est déclenché après la livraison et l'inspection par le client. ViteComm prélève une commission sur chaque transaction entre 2% et 7% selon la distance de livraison. Les frais de livraison sont calculés automatiquement selon la distance entre le marché et l'adresse de livraison.`
    },
    {
      icon: <Scale size={16} />,
      title: '8. Litiges et résolution des conflits',
      content: `En cas de problème (produit défectueux, non-conformité, livraison incomplète), le client ou le vendeur peut ouvrir un litige. L'administration dispose de 48h pour trancher. Les décisions possibles sont : remboursement total, remboursement partiel, rejet du litige, ou annulation de la commande. Le vendeur concerné est notifié et son score de réputation peut être impacté.`
    },
    {
      icon: <AlertTriangle size={16} />,
      title: '9. Signalements',
      content: `Tout utilisateur peut signaler un comportement inapproprié (contenu offensant, tentative de fraude, harcèlement). Les signalements sont examinés par l'administration. Selon la gravité, des sanctions vont de l'avertissement à la suspension définitive du compte. Les signalements non fondés peuvent être classés sans suite.`
    },
    {
      icon: <Lock size={16} />,
      title: '10. Protection des données personnelles',
      content: `ViteComm collecte les données personnelles nécessaires au fonctionnement de la plateforme (nom, prénom, email, adresse de livraison). Ces données ne sont jamais vendues à des tiers. Elles sont utilisées uniquement pour : la gestion des comptes, le traitement des commandes, l'envoi de codes de vérification, et l'amélioration du service. Conformément à la législation béninoise, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.`
    },
    {
      icon: <FileText size={16} />,
      title: '11. Propriété intellectuelle',
      content: `L'ensemble du contenu de la plateforme (logo, design, code source, bases de données) est la propriété exclusive de ViteComm ou de ses partenaires. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.`
    },
    {
      icon: <Scale size={16} />,
      title: '12. Limitation de responsabilité',
      content: `ViteComm agit en qualité d'intermédiaire entre clients, vendeurs et livreurs. La plateforme n'est pas partie aux transactions commerciales entre les utilisateurs. ViteComm ne peut être tenu responsable des défauts de produits, des retards de livraison, ou des litiges entre utilisateurs, sauf en cas de manquement avéré à ses obligations de contrôle.`
    },
    {
      icon: <Shield size={16} />,
      title: '13. Modification des CGU',
      content: `ViteComm se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés de toute modification substantielle. La continuation de l'utilisation de la plateforme après notification vaut acceptation des nouvelles conditions.`
    },
    {
      icon: <Scale size={16} />,
      title: '14. Droit applicable et juridiction',
      content: `Les présentes CGU sont soumises au droit bénin. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, le litige sera soumis aux tribunaux compétents de Porto-Novo, République du Bénin.`
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
              <h1 className="text-white font-black text-lg">Conditions Générales d'Utilisation</h1>
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
              <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>ViteComm — Marketplace Bénin</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Plateforme de commerce en ligne connectant clients, vendeurs et livreurs</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            En utilisant ViteComm, vous confirmez avoir lu, compris et accepté l'intégralité des conditions générales d'utilisation ci-dessous.
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
