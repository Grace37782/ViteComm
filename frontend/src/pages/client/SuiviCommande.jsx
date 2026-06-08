import { useNavigate, useLocation } from 'react-router-dom'

export default function SuiviCommande() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id_commande, code_verification, livreur } = location.state || {}

  const livreurNom = livreur
    ? `${livreur.utilisateur?.prenom} ${livreur.utilisateur?.nom}`
    : 'votre livreur'

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
        padding: '24px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#fff' }}>Commande confirmée !</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            {livreurNom} va collecter vos articles
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Code verification */}
        {code_verification && (
          <div style={{
            background: '#fff', border: '2px solid #1D9E75', borderRadius: 24,
            padding: 24, textAlign: 'center',
            boxShadow: '0 4px 20px rgba(29,158,117,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              🔐 Code de vérification
            </div>
            <div style={{
              fontSize: 36, fontWeight: 900, letterSpacing: 8, color: '#1D9E75',
              fontFamily: 'monospace', padding: '12px 0',
            }}>
              {code_verification}
            </div>
            <div style={{ fontSize: 12, color: '#888780', marginTop: 4 }}>
              Communiquez ce code au livreur lors de la remise de vos articles.
            </div>
          </div>
        )}

        {/* Numéro commande */}
        {id_commande && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: 16,
            border: '1.5px solid #E8E6DF',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>📋</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888780' }}>Numéro de commande</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#2C2C2A' }}>
                #{String(id_commande).padStart(5, '0')}
              </div>
            </div>
          </div>
        )}

        {/* Étapes */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #E8E6DF' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#888780', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Prochaines étapes
          </div>
          {[
            { icon: '🏍️', titre: 'Collecte en cours', desc: `${livreurNom} se dirige vers les marchés` },
            { icon: '📦', titre: 'Vérification', desc: 'Inspectez vos articles avant de payer' },
            { icon: '💵', titre: 'Paiement COD', desc: `Payez en espèces et donnez le code "${code_verification}"` },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 16 : 0, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#F7F8F3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{step.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#2C2C2A' }}>{step.titre}</div>
                <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/client/accueil')}
          style={{
            background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 18,
            padding: '16px', fontSize: 15, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
          }}
        >
          🏠 Retour à l'accueil
        </button>

      </div>


    </div>
  )
}
