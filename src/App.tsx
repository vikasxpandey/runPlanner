import { useState, useEffect } from 'react';
import { MapEngine } from './components/MapEngine';
import { RouteStats } from './components/RouteStats';
import { PaceCalculator } from './components/PaceCalculator';
import { LocationSearch } from './components/LocationSearch';
import { fetchOSRMRoute, type Point } from './utils/geo';
import { Route, Undo2, Trash2, ChevronUp, ChevronDown, RotateCw } from 'lucide-react';



function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [routes, setRoutes] = useState<{ coordinates: Point[], distance: number }[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<Point | null>(null);
  // Derived distance
  const distanceKm = routes.length > 0 ? routes[activeRouteIndex]?.distance / 1000 : 0;
  const [isPanelsExpanded, setIsPanelsExpanded] = useState(true);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  
  // Coordinates for Mumbai, India
  const MUMBAI_COORDS: Point = [19.0760, 72.8777];

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
          // Map is already initialized in Mumbai
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }
      );
    }
  }, []);

  // Effect to recalculate routing whenever waypoints change
  useEffect(() => {
    const getRoute = async () => {
      if (points.length < 2) {
        setRoutes([]);
        setActiveRouteIndex(0);
        return;
      }
      // If round trip is enabled, we append the first point to the end to close the loop
      const pointsToRoute = isRoundTrip
        ? [...points, points[0]]
        : points;

      const results = await fetchOSRMRoute(pointsToRoute);
      if (results && results.length > 0) {
        setRoutes(results);
        setActiveRouteIndex(0);
      } else {
        // Fallback or error state
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

      {/* Header Overlay */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 1000,
          padding: '12px 20px',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
            <Route size={24} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>

          </div>
        </div>

        {/* Location Search Bar */}
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          onAddToRoute={handleAddToRoute}
          onUserLocationFound={(lat, lng) => setUserLocation([lat, lng])}
        />
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
          pointerEvents: isPanelsExpanded ? 'auto' : 'none',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'flex-end',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isPanelsExpanded ? 'translateY(0)' : 'translateY(150%)',
          opacity: isPanelsExpanded ? 1 : 0,
          maxHeight: isPanelsExpanded ? '1000px' : '0px',
        }}>
          <div style={{ flex: '0 0 auto', width: '90%', maxWidth: '400px' }}>
            <RouteStats
              distanceKm={distanceKm}
              userWeightKg={67}
            />
          </div>
          <div style={{ flex: '0 0 auto', width: '90%', maxWidth: '400px' }}>
            <PaceCalculator
              distanceKm={distanceKm}
            />
          </div>
        </div>
      </div>
    </div >
  );
}

export default App;
