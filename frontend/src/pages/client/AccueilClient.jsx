import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/client/BottomNav'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix icône Leaflet cassée avec Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ── Données statiques ( à remplacer par API) ───────────────── */
const MARCHES = [
  {
    id: 1,
    nom: 'Marché Dantokpa',
    distance: '1.2 km',
    etals: 42,
    note: 4.8,
    ouvert: true,
    emoji: '🏪',
    categories: ['🥬 Légumes', '🐟 Poisson', '🍌 Fruits', '🌶️ Épices'],
    coords: { lat: 6.3654, lng: 2.4183 },
  },
  {
    id: 2,
    nom: 'Marché Missèbo',
    distance: '2.1 km',
    etals: 28,
    note: 4.6,
    ouvert: true,
    emoji: '🛍️',
    categories: ['🥬 Légumes', '🍳 Condiments', '🥚 Œufs'],
    coords: { lat: 6.3701, lng: 2.4220 },
  },
  {
    id: 3,
    nom: 'Marché Ganhi',
    distance: '3.4 km',
    etals: 35,
    note: 4.5,
    ouvert: false,
    emoji: '🏬',
    categories: ['🍌 Fruits', '🐟 Poisson', '🌾 Céréales'],
    coords: { lat: 6.3600, lng: 2.4100 },
  },
]

const CATEGORIES = ['Tout', '🥬 Légumes', '🐟 Poisson', '🍌 Fruits', '🌶️ Épices', '🥚 Œufs']

const PRODUITS_VEDETTE = [
  { emoji: '🍅', nom: 'Tomates',  prix: '250 F/kg',   marche: 'Dantokpa' },
  { emoji: '🐟', nom: 'Poisson',  prix: '1 800 F/kg', marche: 'Dantokpa' },
  { emoji: '🧅', nom: 'Oignons',  prix: '180 F/kg',   marche: 'Missèbo'  },
  { emoji: '🥬', nom: 'Gombo',    prix: '300 F/tas',  marche: 'Dantokpa' },
  { emoji: '🌶️', nom: 'Piments',  prix: '150 F/tas',  marche: 'Ganhi'    },
  { emoji: '🍌', nom: 'Bananes',  prix: '500 F/régime', marche: 'Missèbo' },
]

export default function AccueilClient() {
  const navigate = useNavigate()

  const [recherche,   setRecherche]   = useState('')
  const [categorie,   setCategorie]   = useState('Tout')
  const [geoLoading,  setGeoLoading]  = useState(false)
  const [geoPosition, setGeoPosition] = useState(null)
  const [geoErreur,   setGeoErreur]   = useState('')
  const [panierCount] = useState(3) // TODO: depuis le contexte panier

  /* ── Géolocalisation ─────────────────────────────────── */
  function demanderPosition() {
    if (!navigator.geolocation) {
      setGeoErreur('Géolocalisation non disponible sur cet appareil.')
      return
    }
    setGeoLoading(true)
    setGeoErreur('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => {
        setGeoErreur('Impossible d\'obtenir votre position.')
        setGeoLoading(false)
      }
    )
  }

  /* ── Filtrage marchés ────────────────────────────────── */
  const marchesFiltres = MARCHES.filter((m) => {
    const matchRecherche = m.nom.toLowerCase().includes(recherche.toLowerCase())
    const matchCat = categorie === 'Tout' || m.categories.some((c) => c.includes(categorie.split(' ')[1] || categorie))
    return matchRecherche && matchCat
  })

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 72 }}>

      {/* ══ HEADER VERT ══ */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-5"
        style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-black text-lg leading-tight">
              Bonjour Félicia 👋
            </div>
            {geoPosition ? (
              <div className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                📍 Position détectée
              </div>
            ) : (
              <div className="text-white/70 text-xs mt-0.5">Akpakpa, Cotonou</div>
            )}
          </div>
          <button
            onClick={() => navigate('/client/panier')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-xl">🛒</span>
            {panierCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white font-black flex items-center justify-center"
                style={{ background: '#E24B4A', fontSize: 9 }}
              >
                {panierCount}
              </div>
            )}
          </button>
        </div>

        {/* Barre de recherche */}
        <div
          className="relative z-10 flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="text-base">🔍</span>
          <input
            type="text"
            placeholder="Chercher un marché ou produit…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: '#fff' }}
          />
          <span className="text-base cursor-pointer">🎤</span>
        </div>

        {/* Bouton géoloc */}
        <div className="relative z-10 mt-3">
          <button
            onClick={demanderPosition}
            disabled={geoLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-xs font-semibold"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              opacity: geoLoading ? 0.7 : 1,
            }}
          >
            <span>{geoLoading ? '⏳' : '📍'}</span>
            {geoLoading ? 'Localisation en cours…' : geoPosition ? 'Position détectée ✓' : 'Utiliser ma position'}
          </button>
          {geoErreur && (
            <p className="text-xs mt-1.5" style={{ color: '#FFD6D6' }}>⚠️ {geoErreur}</p>
          )}
        </div>
      </div>

      {/* ══ CARTE LEAFLET ══ */}
      <div className="px-4 -mt-3 relative z-10 mb-4">
        <div
          className="w-full rounded-2xl overflow-hidden flex items-center justify-center flex-col gap-2"
          style={{
            height: 140,
            background: '#E1F5EE',
            border: '1.5px solid #9FE1CB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {/* Placeholder carte */}
      <div
  className="w-full rounded-2xl overflow-hidden"
  style={{
    height: 140,
    border: '1.5px solid #9FE1CB',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  }}
>
  <MapContainer
    center={geoPosition
      ? [geoPosition.lat, geoPosition.lng]
      : [6.3654, 2.4183]}
    zoom={14}
    style={{ height: '100%', width: '100%' }}
    zoomControl={false}
    scrollWheelZoom={false}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="© OpenStreetMap"
    />
    {MARCHES.map((m) => (
      <Marker key={m.id} position={[m.coords.lat, m.coords.lng]}>
        <Popup>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{m.nom}</div>
          <div style={{ fontSize: 12, color: '#1D9E75' }}>📍 {m.distance} · ⭐ {m.note}</div>
        </Popup>
      </Marker>
    ))}
  </MapContainer>
</div>
</div>


      {/* ══ FILTRES CATÉGORIES ══ */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className="px-4 py-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all"
              style={{
                background: categorie === cat ? '#1D9E75' : '#fff',
                color:      categorie === cat ? '#fff'    : '#5F5E5A',
                border:     `1.5px solid ${categorie === cat ? '#1D9E75' : '#E8E6DF'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ══ MARCHÉS PROCHES ══ */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Marchés proches de vous
          </h2>
          <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
            {marchesFiltres.length} trouvés
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {marchesFiltres.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm font-semibold" style={{ color: '#888780' }}>
                Aucun marché trouvé pour "{recherche}"
              </p>
            </div>
          ) : (
            marchesFiltres.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/client/catalogue/${m.id}`)}
                className="w-full text-left rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-98"
                style={{
                  background: '#fff',
                  border: '1.5px solid #E8E6DF',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icône marché */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: '#E1F5EE' }}
                  >
                    {m.emoji}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-black text-sm truncate" style={{ color: '#2C2C2A' }}>
                        {m.nom}
                      </h3>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: m.ouvert ? '#E1F5EE' : '#F1EFE8',
                          color:      m.ouvert ? '#0F6E56' : '#888780',
                        }}
                      >
                        {m.ouvert ? '🟢 Ouvert' : '🔴 Fermé'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
                        📍 {m.distance}
                      </span>
                      <span className="text-xs" style={{ color: '#888780' }}>
                        🏪 {m.etals} étals
                      </span>
                      <span className="text-xs" style={{ color: '#888780' }}>
                        ⭐ {m.note}
                      </span>
                    </div>

                    {/* Catégories */}
                    <div className="flex gap-1.5 flex-wrap">
                      {m.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2 py-0.5 rounded-lg font-medium"
                          style={{ background: '#F7F8F3', color: '#5F5E5A' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ══ PRODUITS VEDETTE ══ */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: '#2C2C2A' }}>
            Produits populaires
          </h2>
          <button
            onClick={() => navigate('/client/catalogue')}
            className="text-xs font-semibold cursor-pointer"
            style={{ color: '#1D9E75', background: 'none', border: 'none' }}
          >
            Voir tout →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PRODUITS_VEDETTE.map((p) => (
            <button
              key={p.nom}
              onClick={() => navigate('/client/catalogue')}
              className="rounded-2xl p-3 text-center cursor-pointer transition-all hover:shadow-md active:scale-95"
              style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <div className="font-black text-xs mb-0.5" style={{ color: '#2C2C2A' }}>{p.nom}</div>
              <div className="text-xs font-medium" style={{ color: '#1D9E75' }}>{p.prix}</div>
              <div className="text-xs mt-0.5" style={{ color: '#888780' }}>{p.marche}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <BottomNav panierCount={panierCount} />
   

</div>
  
</div>
  )
}