import React, { useEffect, useState, useRef } from 'react';
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

// Tracks a single timestamp per added point so we can fade them
interface TimedPoint {
  point: Point;
  addedAt: number;
}

const FADE_DURATION_MS = 10_000; // points shown for 10 seconds

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
  // Track each added point with a timestamp
  const [timedPoints, setTimedPoints] = useState<TimedPoint[]>([]);
  // Ticker to force re-renders for opacity calculation
  const [tick, setTick] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPointsLengthRef = useRef(points.length);

  // When a new point is added, record its timestamp
  useEffect(() => {
    if (points.length > prevPointsLengthRef.current) {
      // New point appended
      const newPoint = points[points.length - 1];
      setTimedPoints(prev => [...prev, { point: newPoint, addedAt: Date.now() }]);
    } else if (points.length < prevPointsLengthRef.current) {
      // Point removed (undo / clear) — trim or clear timed list to match
      setTimedPoints(prev => prev.slice(0, points.length));
    }
    prevPointsLengthRef.current = points.length;
  }, [points]);

  // Interval ticker to drive opacity recalculation & cleanup
  useEffect(() => {
    tickerRef.current = setInterval(() => {
      const now = Date.now();
      setTimedPoints(prev => {
        const still = prev.filter(tp => now - tp.addedAt < FADE_DURATION_MS);
        if (still.length === 0) {
          // Nothing fading any more — stop the ticker
          if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
          }
        }
        return still.length === prev.length ? prev : still; // Avoid re-render if nothing changed
      });
      setTick(t => t + 1); // force opacity recalc
    }, 200);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  // Restart ticker when a new point is added
  useEffect(() => {
    if (timedPoints.length > 0 && !tickerRef.current) {
      tickerRef.current = setInterval(() => {
        const now = Date.now();
        setTimedPoints(prev => {
          const still = prev.filter(tp => now - tp.addedAt < FADE_DURATION_MS);
          if (still.length === 0 && tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
          }
          return still.length === prev.length ? prev : still;
        });
        setTick(t => t + 1);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedPoints.length]);

  // Unused but needed to force render on tick change
  void tick;

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

        {/* Start Marker */}
        {points.length > 0 && (
          <Marker position={points[0]} title="Start" />
        )}

        {/* Subtle fading waypoint dots for all intermediate & endpoint positions */}
        {timedPoints.map((tp, i) => {
          const elapsed = Date.now() - tp.addedAt;
          // Start fading after 7s, fully gone at 10s
          const fadeStart = 7000;
          const opacity = elapsed < fadeStart
            ? 0.65
            : Math.max(0, 0.65 * (1 - (elapsed - fadeStart) / (FADE_DURATION_MS - fadeStart)));

          return (
            <CircleMarker
              key={`wp-${i}-${tp.addedAt}`}
              center={tp.point}
              radius={6}
              pathOptions={{
                color: '#de5442ff',
                fillColor: '#ee8d5cff',
                fillOpacity: opacity * 0.6,
                opacity: opacity,
                weight: 1.5,
              }}
            />
          );
        })}

        {/* Inactive alternative routes */}
        {routes.map((route, index) => {
          const isActive = index === activeRouteIndex;
          if (!isActive) {
            return (
              <Polyline
                key={`route-${index}`}
                positions={route.coordinates}
                color="#6c88b0ff"
                weight={4}
                opacity={0.4}
                lineCap="round"
                lineJoin="round"
                eventHandlers={{
                  click: () => onRouteSelect && onRouteSelect(index)
                }}
              />
            )
          }
          return null;
        })}

        {/* Active route */}
        {routes[activeRouteIndex] && (
          <Polyline
            positions={routes[activeRouteIndex].coordinates}
            color="#192950ff"
            weight={6}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* End Marker */}
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
