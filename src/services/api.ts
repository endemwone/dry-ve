
export interface LatLng {
    lat: number;
    lng: number;
}

export interface Route {
    id: string;
    summary: string;
    duration: number; // in minutes
    distance: number; // in km
    path: LatLng[];
}

export interface WeatherPoint {
    lat: number;
    lng: number;
    time: Date;
    rainProbability: number; // 0-100
    condition: 'Clear' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Storm';
}

interface OpenMeteoResponse {
    hourly: {
        time: string[];
        precipitation_probability: number[];
    }
}

interface OSRMGeoJSONResponse {
    routes: {
        geometry: {
            coordinates: [number, number][]; // [lng, lat]
            type: string;
        };
        duration: number;
        distance: number;
        weight_name: string;
    }[];
}

export const DirectionsAPI = {
    getRoutes: async (start: LatLng, end: LatLng): Promise<Route[]> => {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch routes');

            const data: OSRMGeoJSONResponse = await response.json();

            return data.routes.map((route, index) => ({
                id: `route-${index}`,
                summary: `Route ${index + 1} (via ${route.weight_name})`,
                duration: Math.round(route.duration / 60),
                distance: parseFloat((route.distance / 1000).toFixed(1)),
                path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
            }));
        } catch (e) {
            console.error(e);
            throw e; // Re-throw so App.tsx can handle it
        }
    }
};

// Weather cache: key = "lat,lng" (rounded to 2 decimals), value = { probability, timestamp }
interface CacheEntry {
    probability: number;
    timestamp: number;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export const WeatherAPI = {
    getForecast: async (lat: number, lng: number): Promise<number> => {
        const cacheKey = getCacheKey(lat, lng);
        const now = Date.now();

        // Check cache
        const cached = weatherCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return cached.probability;
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability&forecast_days=1`;

        try {
            const response = await fetch(url);
            const data: OpenMeteoResponse = await response.json();

            const currentHour = new Date().getHours();
            const nextHour = (currentHour + 1) % 24;

            const rainNow = data.hourly.precipitation_probability[currentHour] || 0;
            const rainNext = data.hourly.precipitation_probability[nextHour] || 0;

            const probability = Math.max(rainNow, rainNext);

            // Store in cache
            weatherCache.set(cacheKey, { probability, timestamp: now });
            console.log(`[CACHE MISS] ${cacheKey} -> ${probability}%`);

            return probability;
        } catch (e) {
            console.error("Weather fetch failed", e);
            return 0;
        }
    },

    // Clear cache (useful for testing or manual refresh)
    clearCache: () => {
        weatherCache.clear();
        console.log('[CACHE CLEARED]');
    }
};
