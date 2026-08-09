import React, { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatPrice } from '../../lib/utils'
import { BOAT_TYPE_LABELS } from '../../lib/labels'
import type { Boat } from '../../types'

// ─── Fix icônes Leaflet avec Vite ─────────────────────────────────────────────
// Leaflet charge les assets via _getIconUrl (CommonJS). Vite change les chemins
// au build, ce qui brise les marqueurs par défaut. On les réassigne explicitement.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

// ─── Cache des icônes « bulle de prix » ───────────────────────────────────────
// Icônes créées une seule fois par prix arrondi et réutilisées (style Airbnb).
const priceIconCache = new Map<number, L.DivIcon>()

const getPriceIcon = (dailyRate: number, dark = false): L.DivIcon => {
  const rounded = Math.round(dailyRate)
  const cacheKey = dark ? -rounded : rounded
  let icon = priceIconCache.get(cacheKey)
  if (!icon) {
    icon = L.divIcon({
      html: `<div style="
        background: ${dark ? '#ffffff' : '#0c4a6e'};
        color: ${dark ? '#003366' : 'white'};
        font-size: 12px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 2px 12px rgba(0,60,80,0.5);
        border: 2px solid ${dark ? 'rgba(0,220,220,0.35)' : 'white'};
        cursor: pointer;
        user-select: none;
      ">${rounded}&nbsp;€</div>`,
      className: '',
      iconSize: undefined,
      iconAnchor: [30, 14],
      popupAnchor: [0, -18],
    })
    priceIconCache.set(cacheKey, icon)
  }
  return icon
}

// Centre de la France métropolitaine - fallback si aucun bateau géolocalisé
const DEFAULT_CENTER: [number, number] = [46.5, 2.5]
const DEFAULT_ZOOM = 5

// Cadrage automatique : toutes les bulles de prix visibles sans dézoomer manuellement
const MapBoundsFitter: React.FC<{ positions: [number, number][]; fitKey: string }> = ({
  positions,
  fitKey,
}) => {
  const map = useMap()
  useEffect(() => {
    // Laisser le conteneur prendre sa vraie taille (colonne sticky) avant le fit
    const apply = () => {
      map.invalidateSize()
      if (positions.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }
      if (positions.length === 1) {
        map.setView(positions[0], 12)
        return
      }
      map.fitBounds(L.latLngBounds(positions), {
        padding: [56, 56],
        maxZoom: 10,
        animate: false,
      })
    }
    apply()
    const t = window.setTimeout(apply, 120)
    return () => window.clearTimeout(t)
  }, [map, fitKey, positions])
  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapViewProps {
  boats: Boat[]
  className?: string
  dark?: boolean
  fullHeight?: boolean
}

// ─── Composant principal ──────────────────────────────────────────────────────

const MapView: React.FC<MapViewProps> = ({ boats, className, dark = false, fullHeight = false }) => {
  // Seuls les bateaux avec coordonnées GPS sont affichés
  const located = useMemo(
    () => boats.filter((b) => b.lat != null && b.lng != null),
    [boats],
  )

  const positions = useMemo<[number, number][]>(
    () => located.map((b) => [b.lat!, b.lng!]),
    [located],
  )

  // Clé stable pour relancer le fitBounds quand le jeu de coords change
  const positionsKey = useMemo(
    () => positions.map(([la, ln]) => `${la.toFixed(4)},${ln.toFixed(4)}`).join('|'),
    [positions],
  )

  const initialCenter = positions[0] ?? DEFAULT_CENTER
  const initialZoom = positions.length <= 1 ? 12 : DEFAULT_ZOOM

  return (
    <div className={[dark ? `map-teal-blueprint ${className ?? ''}` : className, 'relative isolate z-0'].filter(Boolean).join(' ')}>
      {located.length === 0 && boats.length > 0 && (
        <p className="text-xs text-gray-400 mb-2 text-center">
          None of the boats in these results have GPS coordinates.
        </p>
      )}

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        style={{
          height: fullHeight ? '100%' : '600px',
          width: '100%',
          borderRadius: fullHeight ? '0' : '16px',
        }}
      >
        <MapBoundsFitter positions={positions} fitKey={positionsKey} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={
            dark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        {located.map((boat) => (
          <Marker
            key={boat.id}
            position={[boat.lat!, boat.lng!]}
            icon={getPriceIcon(boat.dailyRate, dark)}
          >
            <Popup minWidth={200}>
              <PopupContent boat={boat} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

// ─── Contenu du popup ─────────────────────────────────────────────────────────
// Inline styles nécessaires : les popups Leaflet sont rendus hors de l'arbre
// React, donc les classes Tailwind ne s'appliquent pas de façon fiable.

const PopupContent: React.FC<{ boat: Boat }> = ({ boat }) => (
  <div style={{ fontFamily: 'inherit', minWidth: '180px' }}>
    {/* Image */}
    {boat.images?.[0] && (
      <img
        src={boat.images[0]}
        alt={boat.title}
        style={{
          width: '100%',
          height: '100px',
          objectFit: 'cover',
          borderRadius: '8px',
          marginBottom: '8px',
          display: 'block',
        }}
      />
    )}

    {/* Titre */}
    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', color: '#111827' }}>
      {boat.title}
    </p>

    {/* Type + port */}
    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
      {BOAT_TYPE_LABELS[boat.type] ?? boat.type} · {boat.port}
    </p>

    {/* Prix - formatPrice pour la cohérence avec le reste de l'UI */}
    <p style={{ fontWeight: 700, fontSize: '16px', color: '#f97316', marginBottom: '8px' }}>
      {formatPrice(boat.dailyRate)}
      <span style={{ fontWeight: 400, fontSize: '12px', color: '#9ca3af' }}> /day</span>
    </p>

    {/* Link */}
    <Link
      to={`/bateaux/${boat.id}`}
      style={{
        display: 'block',
        textAlign: 'center',
        background: '#0c4a6e',
        color: 'white',
        borderRadius: '8px',
        padding: '6px 0',
        fontSize: '12px',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      View listing →
    </Link>
  </div>
)

export default MapView
