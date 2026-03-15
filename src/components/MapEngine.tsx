import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type Point = [number, number];

interface MapEngineProps {
  points: Point[];
  routes?: { coordinates: Point[], distance: number }[];
  activeRouteIndex?: number;
  onRouteSelect?: (index: number) => void;
  userLocation?: Point | null;
  onMapClick: (latlng: Point) => void;
  initialCenter?: Point;
}

// Component to handle map clicks
function ClickHandler({ onMapClick }: { onMapClick: (latlng: Point) => void }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Component to handle programmatic fly-to
function FlyToHandler() {
  const map = useMap();
  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, zoom } = customEvent.detail;
      map.flyTo([lat, lng], zoom || 15);
    };
    window.addEventListener('fly-to', handleFlyTo);
    return () => window.removeEventListener('fly-to', handleFlyTo);
  }, [map]);
  return null;
}

export const MapEngine: React.FC<MapEngineProps> = ({ 
  points, 
  routes = [], 
  activeRouteIndex = 0,
  onRouteSelect,
  userLocation, 
  onMapClick,
  initialCenter = [51.505, -0.09]
}) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={initialCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <FlyToHandler />
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap (Free)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenTopoMap (Terrain)">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="CartoDark (Night)">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <ClickHandler onMapClick={onMapClick} />
        
        {points.length > 0 && (
          <Marker position={points[0]} title="Start" />
        )}

        {routes.map((route, index) => {
          const isActive = index === activeRouteIndex;
          if (!isActive) {
            return (
              <Polyline 
                key={`route-${index}`}
                positions={route.coordinates} 
                color="var(--text-secondary, #64748b)" 
                weight={isActive ? 6 : 4} 
                opacity={0.5}
                lineCap="round"
                lineJoin="round"
                eventHandlers={{
                  click: () => onRouteSelect && onRouteSelect(index)
                }}
              />
            )
          }
          return null; // Render active last so it's on top
        })}

        {routes[activeRouteIndex] && (
          <Polyline 
            positions={routes[activeRouteIndex].coordinates} 
            color="var(--primary, #6366f1)" 
            weight={6} 
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {/* End market */}
        {points.length > 1 && (
          <Marker position={points[points.length - 1]} title="End" />
        )}
        
        {/* User Location */}
        {userLocation && (
          <CircleMarker 
            center={userLocation} 
            radius={8} 
            pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} 
          />
        )}
      </MapContainer>
    </div>
  );
};
