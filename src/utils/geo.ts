import polyline from '@mapbox/polyline';

export type Point = [number, number]; // [lat, lng]

/**
 * Haversine formula to calculate the distance between two latitude/longitude points in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculates total distance of an array of points (lat, lng)
 */
export function calculateTotalDistance(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(
      points[i][0], points[i][1],
      points[i+1][0], points[i+1][1]
    );
  }
  return total;
}

/**
 * Convert MM:SS or HH:MM:SS to total seconds.
 */
export function parsePaceToSeconds(paceStr: string): number {
  const parts = paceStr.split(':');
  
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs)) return 0;
    return (mins * 60) + secs;
  }
  
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (isNaN(hours) || isNaN(mins) || isNaN(secs)) return 0;
    return (hours * 3600) + (mins * 60) + secs;
  }

  return 0;
}

/**
 * Convert total seconds to MM:SS format.
 */
export function formatSecondsToTime(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || !isFinite(totalSeconds)) return "00:00";
  const absSeconds = Math.abs(Math.round(totalSeconds));
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = absSeconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate expected time in seconds given distance (km) and pace (seconds/km)
 */
export function calculateEstimatedTime(distanceKm: number, paceSecondsPerKm: number): number {
  return distanceKm * paceSecondsPerKm;
}

/**
 * Calculates estimated calorie burn based on distance (km) and weight (kg, default 70)
 */
export function calculateCalories(distanceKm: number, weightKg: number = 70): number {
  // Rough estimate: 1.036 kcal per kg per km
  return Math.round(distanceKm * weightKg * 1.036);
}

/**
 * Interface for the OSRM Route response
 */
export interface OSRMRouteResult {
  distance: number; // in meters
  coordinates: Point[]; // Decoded array of [lat, lng]
}

/**
 * Fetches routes from OSRM given an array of waypoints.
 * OSRM expects coordinates in [lng, lat] order in the URL.
 * Requests alternative pathways if available.
 */
export async function fetchOSRMRoute(waypoints: Point[]): Promise<OSRMRouteResult[]> {
  if (waypoints.length < 2) return [];

  // Format points as lng,lat;lng,lat...
  const coordinatesString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
  
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${coordinatesString}?overview=full&alternatives=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return [];
    }

    const results: OSRMRouteResult[] = data.routes.map((route: any) => {
      const decodedGeometry = polyline.decode(route.geometry);
      const resultPoints: Point[] = decodedGeometry.map(p => [p[0], p[1]] as Point);

      return {
        distance: route.distance, // OSRM returns distance in meters
        coordinates: resultPoints
      };
    });

    return results;
  } catch (error) {
    console.error("Failed to fetch OSRM route:", error);
    return [];
  }
}
