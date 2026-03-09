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

const getPriceIcon = (dailyRate: number): L.DivIcon => {
  const rounded = Math.round(dailyRate)
  let icon = priceIconCache.get(rounded)
  if (!icon) {
    icon = L.divIcon({
      html: `<div style="
        background: #0c4a6e;
        color: white;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.30);
        border: 2px solid white;
        cursor: pointer;
        user-select: none;
      ">${rounded}&nbsp;€</div>`,
      className: '',
      iconSize: undefined,
      iconAnchor: [30, 14],
      popupAnchor: [0, -18],
    })
    priceIconCache.set(rounded, icon)
  }
  return icon
}

// ─── MapUpdater — recentre la carte quand les résultats changent ──────────────
// MapContainer ne relit pas center/zoom après le premier rendu (react-leaflet v4).
// Ce composant enfant force la mise à jour via l'API Leaflet directement.
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1], zoom])
  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapViewProps {
  boats: Boat[]
  className?: string
}

// Centre de la France métropolitaine — fallback si aucun bateau géolocalisé
const DEFAULT_CENTER: [number, number] = [46.5, 2.5]
const DEFAULT_ZOOM = 6

// ─── Composant principal ──────────────────────────────────────────────────────

const MapView: React.FC<MapViewProps> = ({ boats, className }) => {
  // Seuls les bateaux avec coordonnées GPS sont affichés
  const located = useMemo(
    () => boats.filter((b) => b.lat != null && b.lng != null),
    [boats],
  )

  // Barycentre des bateaux pour centrer la carte automatiquement
  const center = useMemo<[number, number]>(
    () =>
      located.length > 0
        ? [
            located.reduce((s, b) => s + b.lat!, 0) / located.length,
            located.reduce((s, b) => s + b.lng!, 0) / located.length,
          ]
        : DEFAULT_CENTER,
    [located],
  )

  const zoom = located.length > 0 ? 8 : DEFAULT_ZOOM

  return (
    <div className={className}>
      {located.length === 0 && boats.length > 0 && (
        <p className="text-xs text-gray-400 mb-2 text-center">
          Aucun bateau dans ces résultats n'a de coordonnées GPS.
        </p>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '600px', width: '100%', borderRadius: '16px' }}
      >
        {/* Recentrage dynamique quand les résultats changent */}
        <MapUpdater center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {located.map((boat) => (
          <Marker
            key={boat.id}
            position={[boat.lat!, boat.lng!]}
            icon={getPriceIcon(boat.dailyRate)}
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

    {/* Prix — formatPrice pour la cohérence avec le reste de l'UI */}
    <p style={{ fontWeight: 700, fontSize: '16px', color: '#f97316', marginBottom: '8px' }}>
      {formatPrice(boat.dailyRate)}
      <span style={{ fontWeight: 400, fontSize: '12px', color: '#9ca3af' }}> /jour</span>
    </p>

    {/* Lien */}
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
      Voir l'annonce →
    </Link>
  </div>
)

export default MapView
