import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ─── Profile helpers (moved from Profil.jsx for reuse) ─── */
function initials(u) {
  if (!u) return '?'
  return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase() || '?'
}

function AvatarCircle({ user, size = 48 }) {
  if (user?.photo_url) {
    return (
      <img
        src={user.photo_url}
        alt="Photo profil"
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 900, color: '#fff',
        border: '2px solid rgba(255,255,255,0.3)',
        flexShrink: 0,
      }}
    >
      {initials(user)}
    </div>
  )
}

// Custom Leaflet marker icons using divIcon (bypasses URL image path issues in Vite)
const createMarketIcon = (isActive) => L.divIcon({
  html: `<div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg text-white font-bold text-lg hover:scale-115 transition-transform ${
    isActive ? 'bg-amber-500 scale-110 ring-4 ring-amber-300' : 'bg-emerald-650'
  }">🏪</div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

const createUserIcon = () => L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white text-sm animate-bounce">📍</div>`,
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}

function fuzzyMatch(kw, target) {
  if (target.includes(kw)) return true;
  if (kw.length < 4) return false;
  
  const maxDistance = kw.length > 6 ? 2 : 1;
  const targetWords = target.split(/\s+/);
  
  for (const tWord of targetWords) {
    if (tWord.includes(kw) || kw.includes(tWord)) return true;
    if (levenshteinDistance(kw, tWord) <= maxDistance) {
      return true;
    }
  }
  return false;
}

function normalizeText(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .replace(/\bmart\b/g, 'marche')  // replace 'mart' with 'marche'
    .replace(/\bmarket\b/g, 'marche') // replace 'market' with 'marche'
}

function getKeywords(recherche) {
  return normalizeText(recherche).split(/\s+/).filter(Boolean)
}

function matchMarket(market, keywords) {
  if (keywords.length === 0) return true
  const normNom = normalizeText(market.nom)
  const normDesc = market.description ? normalizeText(market.description) : ''
  return keywords.every(kw => fuzzyMatch(kw, normNom) || fuzzyMatch(kw, normDesc))
}

function MapRecenter({ center, zoomLevel }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoomLevel || 13)
    }
  }, [center, zoomLevel, map])
  return null
}

export default function AccueilClient() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [markets, setMarkets] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  const [recherche, setRecherche] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoPosition, setGeoPosition] = useState(null)
  
  const [mapCenter, setMapCenter] = useState([6.370, 2.430]) // Default Cotonou
  const [mapZoom, setMapZoom] = useState(13)
  const [activeMarket, setActiveMarket] = useState(null)

  const panierCount = cart?.details?.reduce((s, d) => s + d.quantite, 0) || 0

  useEffect(() => {
    async function loadData() {
      try {
        const [marketsRes, cartRes] = await Promise.all([
          api.get('/client/markets'),
          api.get('/client/cart'),
        ])
        setMarkets(marketsRes)
        setCart(cartRes)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    demanderPosition()
  }, [])

  // Auto-selection of market when exactly 1 market matches the search term
  useEffect(() => {
    const keywords = getKeywords(recherche)
    if (keywords.length > 0 && recherche.trim().length >= 2) {
      const matched = markets.filter(m => matchMarket(m, keywords))
      if (matched.length === 1) {
        const singleMarket = matched[0]
        setActiveMarket(singleMarket)
        setMapCenter([singleMarket.latitude, singleMarket.longitude])
        setMapZoom(15)
      }
    } else if (recherche.trim().length === 0) {
      setActiveMarket(null)
      setMapZoom(13)
    }
  }, [recherche, markets])

  function demanderPosition() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGeoPosition(coords)
        setMapCenter([coords.lat, coords.lng])
        setMapZoom(14)
      },
      () => {}
    )
  }

  // Calculate distances
  const marketsWithDistance = markets.map(m => {
    if (geoPosition) {
      const dist = getDistanceKm(geoPosition.lat, geoPosition.lng, m.latitude, m.longitude)
      return { ...m, distance: dist }
    }
    return { ...m, distance: null }
  })

  // Sort closest first
  const sortedMarkets = [...marketsWithDistance].sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance
    }
    return 0
  })

  // Filter based on search query
  const keywords = getKeywords(recherche)
  const marketsFiltered = sortedMarkets.filter(m => matchMarket(m, keywords))

  const suggestions = recherche
    ? markets.filter(m => matchMarket(m, keywords))
    : []

  const handleSelectMarket = (m) => {
    setActiveMarket(m)
    setMapCenter([m.latitude, m.longitude])
    setMapZoom(15)
    setShowSuggestions(false)
    setRecherche(m.nom)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (marketsFiltered.length > 0) {
        handleSelectMarket(marketsFiltered[0])
      }
      setShowSuggestions(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <div className="font-bold text-sm text-gray-500">Chargement de la carte et des marchés…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full font-sans bg-gray-50 flex flex-col pb-6">
      {/* Header Panel - Search */}
      <div className="bg-emerald-800 text-white px-4 pt-3 pb-3 shadow-md flex-shrink-0">
        {/* Search wrapper */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/80 px-4 py-2.5 rounded-2xl">
            <span className="text-gray-300">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un marché (Dantokpa, Ganhi...)..."
              value={recherche}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setRecherche(e.target.value)
                setShowSuggestions(true)
              }}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-emerald-300/80 font-medium"
            />
            {recherche && (
              <button
                onClick={() => {
                  setRecherche('')
                  setActiveMarket(null)
                  setShowSuggestions(false)
                }}
                className="text-white hover:text-gray-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 text-gray-805">
              {suggestions.map((m) => (
                <div
                  key={m.id_marche}
                  onClick={() => handleSelectMarket(m)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-b-0 text-gray-800"
                >
                  <div>
                    <p className="font-bold text-xs">{m.nom}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-xs">{m.description}</p>
                  </div>
                  <span className="text-xs">🏪</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Interactive Map Container with absolute selection drawer overlay */}
      <div className="w-full h-96 relative shadow-inner border-b border-gray-200 flex-shrink-0">
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 10 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapRecenter center={mapCenter} zoomLevel={mapZoom} />

          {/* User Location Pin */}
          {geoPosition && (
            <Marker position={[geoPosition.lat, geoPosition.lng]} icon={createUserIcon()}>
              <Popup>
                <div className="p-1 text-center">
                  <p className="text-xs font-black text-blue-700">📍 Votre position actuelle</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Markets Pins */}
          {marketsFiltered.map(m => {
            const isActive = activeMarket?.id_marche === m.id_marche
            return (
              <Marker
                key={m.id_marche}
                position={[m.latitude, m.longitude]}
                icon={createMarketIcon(isActive)}
                eventHandlers={{
                  click: () => {
                    setActiveMarket(m)
                    setMapCenter([m.latitude, m.longitude])
                    setMapZoom(15)
                    setRecherche(m.nom)
                    setShowSuggestions(false)
                  }
                }}
              />
            )
          })}
        </MapContainer>

        {/* 🌟 Premium Selected Market Map Overlay Card */}
        {activeMarket && (
          <div className="absolute bottom-5 left-4 right-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-4 shadow-2xl z-20 transition-all duration-300 animate-slide-up flex gap-3 items-center">
            <img
              src={activeMarket.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
              alt={activeMarket.nom}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-extrabold text-sm text-gray-800 truncate">{activeMarket.nom}</h4>
                <button
                  onClick={() => {
                    setActiveMarket(null)
                    setRecherche('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{activeMarket.description}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  🏪 {activeMarket._count?.vendeurs || 0} étals actifs
                </span>
                {geoPosition && (
                  <span className="text-[9px] font-bold text-gray-500">
                    📏 {getDistanceKm(geoPosition.lat, geoPosition.lng, activeMarket.latitude, activeMarket.longitude).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigate('/client/market/' + activeMarket.id_marche)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl transition-all flex-shrink-0 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              Visiter →
            </button>
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="px-5 mt-6 flex-1">
        <h3 className="font-black text-gray-850 text-base mb-3 flex items-center justify-between">
          <span>Marchés Disponibles</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {marketsFiltered.length} localmarts
          </span>
        </h3>

        {marketsFiltered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-150 shadow-sm">
            <span className="text-4xl">🏜️</span>
            <p className="text-xs font-bold text-gray-400 mt-2">Aucun marché ne correspond à ce secteur.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {marketsFiltered.map((m) => {
              const isSelected = activeMarket?.id_marche === m.id_marche
              return (
                <div
                  key={m.id_marche}
                  onClick={() => handleSelectMarket(m)}
                  className={`flex items-center gap-3 p-3 bg-white rounded-2xl border transition-all shadow-sm cursor-pointer ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-150 hover:border-emerald-300'
                  }`}
                >
                  <img
                    src={m.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                    alt={m.nom}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-sm text-gray-800 truncate">{m.nom}</h4>
                      {m.distance !== null && (
                        <span className="text-[10px] font-bold text-emerald-600 flex-shrink-0">
                          📏 {m.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-normal">{m.description}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-gray-450 bg-gray-100 px-2 py-0.5 rounded-full">
                        🏪 {m._count?.vendeurs || 0} étals actifs
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/client/market/' + m.id_marche)
                        }}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        Entrer →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
