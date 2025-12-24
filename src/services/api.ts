
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

// Helper to decode OSRM Polyline (Geometry is usually encoded)
// For simplicity in this demo, we'll ask OSRM for GeoJSON (easier to parse) 
// or implement a simple decoder. 
// OSRM defaults to polyline5. 
// Let's use 'overview=full&geometries=geojson' for OSRM to get explicit coordinates.
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
        // Using OSRM Public Demo Server
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch routes');

            const data: OSRMGeoJSONResponse = await response.json();

            return data.routes.map((route, index) => ({
                id: `route-${index}`,
                summary: `Route ${index + 1} (via ${route.weight_name})`,
                duration: Math.round(route.duration / 60), // seconds to minutes
                distance: parseFloat((route.distance / 1000).toFixed(1)), // meters to km
                path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
            }));
        } catch (e) {
            console.error(e);
            return [];
        }
    }
};

export const WeatherAPI = {
    // Get forecast for a specific point
    getForecast: async (lat: number, lng: number): Promise<number> => {
        // Open-Meteo Free API
        // We get hourly precipitation_probability
        // We only need the current/next hour for simplicity in this MVP
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability&forecast_days=1`;

        try {
            const response = await fetch(url);
            const data: OpenMeteoResponse = await response.json();

            // Simple logic: get the max rain prob in the next 2 hours
            const currentHour = new Date().getHours();
            const nextHour = (currentHour + 1) % 24;

            const rainNow = data.hourly.precipitation_probability[currentHour] || 0;
            const rainNext = data.hourly.precipitation_probability[nextHour] || 0;

            return Math.max(rainNow, rainNext);
        } catch (e) {
            console.error("Weather fetch failed", e);
            return 0;
        }
    }
};
