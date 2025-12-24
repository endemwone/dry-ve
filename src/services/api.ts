/**
 * API Services for Dry-ve
 * 
 * This module provides interfaces and functions for:
 * - Fetching driving routes from OSRM (Open Source Routing Machine)
 * - Fetching weather forecasts from Open-Meteo
 * - Geocoding addresses using Nominatim
 */

// ============================================================================
// Types
// ============================================================================

/** Geographic coordinates */
export interface LatLng {
    lat: number;
    lng: number;
}

/** A driving route with path and metadata */
export interface Route {
    id: string;
    summary: string;
    duration: number; // minutes
    distance: number; // kilometers
    path: LatLng[];
}

/** Weather data for a single point along a route */
export interface WeatherPoint {
    lat: number;
    lng: number;
    time: Date;
    rainProbability: number; // 0-100
    condition: 'Clear' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Storm';
}

/** Geocoding search result */
export interface SearchResult {
    label: string;
    lat: number;
    lng: number;
}

// ============================================================================
// Internal Types (API Responses)
// ============================================================================

interface OpenMeteoResponse {
    hourly: {
        time: string[];
        precipitation_probability: number[];
    };
}

interface OSRMGeoJSONResponse {
    routes: {
        geometry: {
            coordinates: [number, number][]; // [lng, lat] format
            type: string;
        };
        duration: number;
        distance: number;
        weight_name: string;
    }[];
}

interface NominatimResponse {
    display_name: string;
    lat: string;
    lon: string;
}

// ============================================================================
// Weather Cache
// ============================================================================

interface CacheEntry {
    probability: number;
    timestamp: number;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Generate a cache key from coordinates (rounded to 2 decimal places) */
function getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// ============================================================================
// Directions API (OSRM)
// ============================================================================

const OSRM_BASE_URL = 'https://router.project-osrm.org';

export const DirectionsAPI = {
    /**
     * Fetch driving routes between two points
     * @param start - Starting coordinates
     * @param end - Destination coordinates
     * @returns Array of possible routes (may include alternatives)
     */
    getRoutes: async (start: LatLng, end: LatLng): Promise<Route[]> => {
        const url = `${OSRM_BASE_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM request failed: ${response.status}`);
        }

        const data: OSRMGeoJSONResponse = await response.json();

        return data.routes.map((route, index) => ({
            id: `route-${index}`,
            summary: `Route ${index + 1}`,
            duration: Math.round(route.duration / 60),
            distance: parseFloat((route.distance / 1000).toFixed(1)),
            path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
        }));
    }
};

// ============================================================================
// Weather API (Open-Meteo)
// ============================================================================

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export const WeatherAPI = {
    /**
     * Get precipitation probability for a location
     * Results are cached for 5 minutes to reduce API calls
     * @param lat - Latitude
     * @param lng - Longitude
     * @returns Rain probability (0-100)
     */
    getForecast: async (lat: number, lng: number): Promise<number> => {
        const cacheKey = getCacheKey(lat, lng);
        const now = Date.now();

        // Check cache first
        const cached = weatherCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
            return cached.probability;
        }

        const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability&forecast_days=1`;

        try {
            const response = await fetch(url);
            const data: OpenMeteoResponse = await response.json();

            // Get max probability for current and next hour
            const currentHour = new Date().getHours();
            const nextHour = (currentHour + 1) % 24;
            const rainNow = data.hourly.precipitation_probability[currentHour] || 0;
            const rainNext = data.hourly.precipitation_probability[nextHour] || 0;
            const probability = Math.max(rainNow, rainNext);

            // Store in cache
            weatherCache.set(cacheKey, { probability, timestamp: now });

            return probability;
        } catch {
            // Return 0 on error - assume dry if we can't fetch weather
            return 0;
        }
    },

    /** Clear the weather cache (useful for testing) */
    clearCache: (): void => {
        weatherCache.clear();
    }
};

// ============================================================================
// Geocoding API (Nominatim)
// ============================================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const GeocodingAPI = {
    /**
     * Search for locations by address/name
     * @param query - Address or place name to search for
     * @returns Array of matching results
     */
    search: async (query: string): Promise<SearchResult[]> => {
        if (!query.trim()) return [];

        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: '5',
            addressdetails: '1'
        });

        // Nominatim usage policy requires a User-Agent
        // Browsers set it automatically, but we should be mindful of rate limits (1/sec)
        const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Geocoding failed');

            const data: NominatimResponse[] = await response.json();

            return data.map(item => ({
                label: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            }));
        } catch (e) {
            console.error('Geocoding error:', e);
            return [];
        }
    }
};
