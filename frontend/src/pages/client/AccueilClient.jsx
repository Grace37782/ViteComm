import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Search, Store, MapPin, Ruler, Mountain, ChevronDown } from 'lucide-react'

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
  html: `<div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg text-white hover:scale-115 transition-transform ${
    isActive ? 'bg-amber-500 scale-110 ring-4 ring-amber-300' : 'bg-emerald-650'
  }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path="M2 7h20"/><path="22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg></div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

const createUserIcon = () => L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
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

const PAGE_SIZE = 10

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
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const [markets, setMarkets] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  const [recherche, setRecherche] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoPosition, setGeoPosition] = useState(null)
  
  const [mapCenter, setMapCenter] = useState([6.370, 2.430]) // Default Cotonou
  const [mapZoom, setMapZoom] = useState(13)
  const [activeMarket, setActiveMarket] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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
    setVisibleCount(PAGE_SIZE)
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

  const visibleItems = marketsFiltered.slice(0, visibleCount)
  const hasMore = visibleCount < marketsFiltered.length

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
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin"><Loader2 size={32} /></div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Chargement de la carte et des marchés…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full font-sans flex flex-col pb-6" style={{ background: 'var(--bg)' }}>
      {/* Header Panel - Search */}
      <div className="bg-emerald-800 text-white px-4 pt-3 pb-3 shadow-md flex-shrink-0">
        {/* Search wrapper */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/80 px-4 py-2.5 rounded-2xl">
            <span className="text-gray-300"><Search size={16} /></span>
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
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl border overflow-hidden z-50"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {suggestions.map((m) => (
                <div
                  key={m.id_marche}
                  onClick={() => handleSelectMarket(m)}
                  className="px-4 py-3 cursor-pointer flex items-center justify-between border-b last:border-b-0"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div>
                    <p className="font-bold text-xs">{m.nom}</p>
                    <p className="text-[10px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{m.description}</p>
                  </div>
                  <span className="text-xs"><Store size={14} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ Interactive Map Container with absolute selection drawer overlay */}
      <div className="w-full h-96 relative shadow-inner flex-shrink-0"
        style={{ borderBottom: `1px solid ${isDark ? 'var(--border)' : '#e5e7eb'}` }}>
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
                  <p className="text-xs font-black text-blue-700">Votre position actuelle</p>
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
          <div className="absolute bottom-5 left-4 right-4 backdrop-blur-md rounded-3xl p-4 shadow-2xl z-20 transition-all duration-300 animate-slide-up flex gap-3 items-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <img
              src={activeMarket.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
              alt={activeMarket.nom}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-extrabold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{activeMarket.nom}</h4>
                <button
                  onClick={() => {
                    setActiveMarket(null)
                    setRecherche('')
                  }}
                  className="text-xs w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{activeMarket.description}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] font-bold text-emerald-700 px-2 py-0.5 rounded-full"
                  style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#D1FAE5' }}>
                  <Store size={10} className="inline" /> {activeMarket._count?.vendeurs || 0} étals actifs
                </span>
                {geoPosition && (
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    <Ruler size={10} className="inline" /> {getDistanceKm(geoPosition.lat, geoPosition.lng, activeMarket.latitude, activeMarket.longitude).toFixed(1)} km
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
        <h3 className="font-black text-base mb-3 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span>Marchés Disponibles</span>
          <span className="text-xs font-semibold text-emerald-600 px-2.5 py-1 rounded-full"
            style={{ background: isDark ? 'rgba(29,158,117,0.15)' : '#D1FAE5' }}>
            {marketsFiltered.length} localmarts
          </span>
        </h3>

        {marketsFiltered.length === 0 ? (
          <div className="text-center py-10 rounded-3xl shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-4xl"><Mountain size={40} /></span>
            <p className="text-xs font-bold mt-2" style={{ color: 'var(--text-muted)' }}>Aucun marché ne correspond à ce secteur.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleItems.map((m) => {
              const isSelected = activeMarket?.id_marche === m.id_marche
              return (
                <div
                  key={m.id_marche}
                  onClick={() => handleSelectMarket(m)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all shadow-sm cursor-pointer ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-emerald-300'
                  }`}
                  style={{
                    background: 'var(--surface)',
                    borderColor: isSelected ? undefined : 'var(--border)',
                  }}
                >
                  <img
                    src={m.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                    alt={m.nom}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{m.nom}</h4>
                      {m.distance !== null && (
                        <span className="text-[10px] font-bold text-emerald-600 flex-shrink-0">
                          <Ruler size={10} className="inline" /> {m.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] line-clamp-2 mt-0.5 leading-normal" style={{ color: 'var(--text-muted)' }}>{m.description}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: 'var(--text-muted)', background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}>
                        <Store size={10} className="inline" /> {m._count?.vendeurs || 0} étals actifs
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

            {hasMore && (
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                <ChevronDown size={14} /> Charger plus ({marketsFiltered.length - visibleCount} restant{marketsFiltered.length - visibleCount > 1 ? 's' : ''})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
