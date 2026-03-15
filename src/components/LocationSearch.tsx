import React, { useState } from 'react';
import { Search, Navigation } from 'lucide-react';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onAddToRoute: (lat: number, lng: number) => void;
  onUserLocationFound?: (lat: number, lng: number) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, onAddToRoute, onUserLocationFound }) => {
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          onLocationSelect(lat, lng);
          if (onUserLocationFound) onUserLocationFound(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not get your location. Please check your system/browser location permissions and try again.");
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
      <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
         <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
               <input 
                 className="input" 
                 style={{ width: '100%', paddingRight: '40px', paddingLeft: '12px' }} 
                 value={query} 
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                 placeholder="Search location..."
                 onFocus={() => { if(results.length) setShowResults(true) }}
               />
               <button 
                 onClick={searchLocation}
                 style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                 disabled={loading}
               >
                 <Search size={18} />
               </button>
            </div>
            <button className="btn-icon" onClick={getUserLocation} title="Use My Location" style={{ padding: '0 12px' }}>
               <Navigation size={18} color="var(--primary)" />
            </button>
         </div>

         {/* Backdrop to close results */}
         {showResults && (
           <div 
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} 
             onClick={() => setShowResults(false)}
           />
         )}

         {showResults && results.length > 0 && (
           <div className="glass-panel" style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', 
              maxHeight: '250px', overflowY: 'auto', zIndex: 1001, padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '4px'
           }}>
              {results.map((r, idx) => (
                 <div key={idx} style={{ 
                    padding: '8px', borderRadius: 'var(--radius-md)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: '1px solid transparent'
                 }} 
                 onClick={() => {
                   setShowResults(false);
                   onLocationSelect(parseFloat(r.lat), parseFloat(r.lon));
                 }}>
                   <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                     {r.display_name}
                   </div>
                   <button 
                     className="btn" 
                     style={{ padding: '6px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowResults(false);
                       onAddToRoute(parseFloat(r.lat), parseFloat(r.lon));
                     }}
                   >
                     Add
                   </button>
                 </div>
              ))}
           </div>
         )}
      </div>
  )
}
