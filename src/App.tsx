import { useState, useEffect } from 'react';
import { MapEngine } from './components/MapEngine';
import { RouteStats } from './components/RouteStats';
import { PaceCalculator } from './components/PaceCalculator';
import { LocationSearch } from './components/LocationSearch';
import { SettingsPanel } from './components/SettingsPanel';
import { fetchOSRMRoute, type Point } from './utils/geo';
import { Route, Undo2, Trash2, ChevronUp, ChevronDown, RotateCw, Settings } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

// Coordinates for Mumbai, India
const MUMBAI_COORDS: Point = [19.0760, 72.8777];

function App() {
  // Persisted state
  const [points, setPoints] = useLocalStorage<Point[]>('rp_points', []);
  const [activeRouteIndex, setActiveRouteIndex] = useLocalStorage<number>('rp_activeRouteIndex', 0);
  const [userWeightKg, setUserWeightKg] = useLocalStorage<number>('rp_weightKg', 70);
  const [isRoundTrip, setIsRoundTrip] = useLocalStorage<boolean>('rp_roundTrip', false);

  // Ephemeral state (not persisted)
  const [routes, setRoutes] = useState<{ coordinates: Point[], distance: number }[]>([]);
  const [userLocation, setUserLocation] = useState<Point | null>(null);
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derived distance
  const distanceKm = routes.length > 0 ? routes[activeRouteIndex]?.distance / 1000 : 0;

  // Background location check on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          window.dispatchEvent(new CustomEvent('fly-to', { detail: { lat, lng, zoom: 15 } }));
        },
        (err) => {
          console.log("On-mount geolocation failed or denied:", err);
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }
      );
    }
  }, []);

  // Restore route on load if points exist
  useEffect(() => {
    const restoreRoute = async () => {
      if (points.length < 2) {
        setRoutes([]);
        return;
      }
      const pointsToRoute = isRoundTrip ? [...points, points[0]] : points;
      const results = await fetchOSRMRoute(pointsToRoute);
      if (results && results.length > 0) {
        setRoutes(results);
        // Fly to first point on restore
        window.dispatchEvent(new CustomEvent('fly-to', { detail: { lat: points[0][0], lng: points[0][1], zoom: 13 } }));
      }
    };
    restoreRoute();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to recalculate routing whenever waypoints change
  useEffect(() => {
    const getRoute = async () => {
      if (points.length < 2) {
        setRoutes([]);
        setActiveRouteIndex(0);
        return;
      }
      const pointsToRoute = isRoundTrip ? [...points, points[0]] : points;
      const results = await fetchOSRMRoute(pointsToRoute);
      if (results && results.length > 0) {
        setRoutes(results);
        setActiveRouteIndex(0);
      } else {
        setRoutes([]);
        setActiveRouteIndex(0);
      }
    };

    getRoute();
  }, [points, isRoundTrip]);

  const handleMapClick = (latlng: Point) => {
    setPoints((prev) => [...prev, latlng]);
  };

  const handleClear = () => {
    setPoints([]);
    setRoutes([]);
  };

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    window.dispatchEvent(new CustomEvent('fly-to', { detail: { lat, lng, zoom: 15 } }));
  };

  const handleAddToRoute = (lat: number, lng: number) => {
    window.dispatchEvent(new CustomEvent('fly-to', { detail: { lat, lng, zoom: 15 } }));
    handleMapClick([lat, lng]);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background Map Component */}
      <MapEngine
        points={points}
        routes={routes}
        activeRouteIndex={activeRouteIndex}
        onRouteSelect={setActiveRouteIndex}
        userLocation={userLocation}
        onMapClick={handleMapClick}
        initialCenter={MUMBAI_COORDS}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        weightKg={userWeightKg}
        onWeightChange={setUserWeightKg}
      />

      {/* Header Overlay */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 1000,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', flexShrink: 0 }}>
          <Route size={24} />
        </div>

        {/* Location Search Bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            onAddToRoute={handleAddToRoute}
            onUserLocationFound={(lat, lng) => setUserLocation([lat, lng])}
          />
        </div>

        {/* Settings Button */}
        <button
          className="btn-icon"
          style={{ padding: '8px', flexShrink: 0 }}
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Floating Action Controls */}
      <div style={{
        position: 'absolute',
        top: '110px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {points.length > 0 && (
          <>
            <button
              className={`btn-icon ${isRoundTrip ? 'active' : ''}`}
              onClick={() => setIsRoundTrip(!isRoundTrip)}
              title="Toggle Round Trip"
              style={{ background: isRoundTrip ? "var(--secondary)" : "var(--panel-bg)" }}
            >
              <RotateCw size={20} />
            </button>
            <button className="btn-icon" onClick={handleUndo} title="Undo Last Point">
              <Undo2 size={20} />
            </button>
            <button className="btn-icon" onClick={handleClear} title="Clear Route">
              <Trash2 size={20} color="var(--accent)" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Floating Panels (Collapsible) */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
      }}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelsExpanded(!isPanelsExpanded)}
          className="btn-icon"
          style={{
            pointerEvents: 'auto',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-lg)',
            alignSelf: 'flex-end',
            marginRight: '16px'
          }}
          title={isPanelsExpanded ? "Hide Panels" : "Show Panels"}
        >
          {isPanelsExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        {/* Scrollable Panels Area */}
        <div style={{
          width: '100%',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'flex-end',
          pointerEvents: 'auto',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isPanelsExpanded ? 'translateY(0)' : 'translateY(150%)',
          opacity: isPanelsExpanded ? 1 : 0,
          maxHeight: isPanelsExpanded ? '1000px' : '0px',
        }}>
          <div style={{ flex: '0 0 auto', width: '90%', maxWidth: '400px' }}>
            <RouteStats
              distanceKm={distanceKm}
              userWeightKg={userWeightKg}
            />
          </div>
          <div style={{ flex: '0 0 auto', width: '90%', maxWidth: '400px' }}>
            <PaceCalculator
              distanceKm={distanceKm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
