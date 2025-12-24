/**
 * Dry-ve - Find the driest route to your destination
 * 
 * Main application component that orchestrates:
 * - Map interactions (click to set start/end points)
 * - Route fetching from OSRM
 * - Weather analysis for each route
 * - Results display with recommendations
 */

import { useState, useRef } from 'react';
import { Map, MapPin } from 'lucide-react';

// Components
import MapView from './components/MapView';
import RouteList from './components/RouteList';
import Controls from './components/Controls';
import Toast from './components/ui/Toast';

// Services & Types
import { DirectionsAPI, LatLng, Route } from './services/api';
import { analyzeRouteWeather, RouteWeather } from './utils/rainLogic';

// ============================================================================
// Types
// ============================================================================

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

// ============================================================================
// Configuration
// ============================================================================

/** Minimum time (ms) between route searches to prevent API abuse */
const RATE_LIMIT_MS = 2000;

// ============================================================================
// App Component
// ============================================================================

export default function App() {
    // Route state
    const [routes, setRoutes] = useState<Route[]>([]);
    const [weatherData, setWeatherData] = useState<Record<string, RouteWeather>>({});
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // UI state
    const [toast, setToast] = useState<ToastState | null>(null);

    // Map interaction state
    const [startPoint, setStartPoint] = useState<LatLng | null>(null);
    const [endPoint, setEndPoint] = useState<LatLng | null>(null);

    // Rate limiting
    const lastRequestRef = useRef<number>(0);

    // ========================================================================
    // Handlers
    // ========================================================================

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    /**
     * Handle map clicks to set start/end points
     * First click = start, second click = end, third click = reset
     */
    const handleMapClick = (lat: number, lng: number) => {
        if (!startPoint) {
            setStartPoint({ lat, lng });
        } else if (!endPoint) {
            setEndPoint({ lat, lng });
        } else {
            // Reset and start over
            setStartPoint({ lat, lng });
            setEndPoint(null);
            setRoutes([]);
        }
    };

    /**
     * Fetch routes and analyze weather for each
     */
    const handleFindRoutes = async () => {
        if (!startPoint || !endPoint) return;

        // Rate limiting
        const now = Date.now();
        if (now - lastRequestRef.current < RATE_LIMIT_MS) {
            showToast('Please wait before searching again', 'error');
            return;
        }
        lastRequestRef.current = now;

        // Reset state
        setIsLoading(true);
        setRoutes([]);
        setWeatherData({});
        setSelectedRouteId(null);

        try {
            // Fetch routes from OSRM
            const fetchedRoutes = await DirectionsAPI.getRoutes(startPoint, endPoint);

            if (fetchedRoutes.length === 0) {
                showToast('No routes found. Try different locations.', 'error');
                setIsLoading(false);
                return;
            }

            setRoutes(fetchedRoutes);

            // Analyze weather for each route in parallel
            const weatherMap: Record<string, RouteWeather> = {};
            await Promise.all(
                fetchedRoutes.map(async (route) => {
                    weatherMap[route.id] = await analyzeRouteWeather(route);
                })
            );
            setWeatherData(weatherMap);

            // Auto-select the best route (lowest score)
            const bestRoute = fetchedRoutes.reduce((best, current) => {
                const bestScore = weatherMap[best.id]?.score ?? 100;
                const currentScore = weatherMap[current.id]?.score ?? 100;
                return currentScore < bestScore ? current : best;
            });
            setSelectedRouteId(bestRoute.id);

            showToast(`Found ${fetchedRoutes.length} route(s)!`, 'success');

        } catch (error) {
            console.error('Route search failed:', error);
            showToast('Failed to fetch routes. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="h-screen w-full bg-slate-900 text-white flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <aside className="w-full md:w-96 p-4 md:p-6 bg-slate-900 flex flex-col z-10 border-r border-slate-800 shadow-2xl overflow-y-auto">
                {/* Header */}
                <header className="mb-6 flex items-center gap-3">
                    <div className="flex -space-x-2">
                        <span className="p-2 bg-blue-500 rounded-full bg-opacity-20 text-blue-400 z-10 border border-slate-900">
                            <Map size={24} />
                        </span>
                        <span className="p-2 bg-cyan-500 rounded-full bg-opacity-20 text-cyan-400 z-0 border border-slate-900">
                            <MapPin size={24} />
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Dry-ve
                    </h1>
                </header>

                {/* Controls */}
                <Controls
                    onFindRoutes={handleFindRoutes}
                    isLoading={isLoading}
                    startPoint={startPoint}
                    endPoint={endPoint}
                />

                {/* Route Results */}
                {routes.length > 0 && (
                    <RouteList
                        routes={routes}
                        weatherData={weatherData}
                        selectedRouteId={selectedRouteId}
                        onSelectRoute={setSelectedRouteId}
                        isLoading={isLoading}
                    />
                )}
            </aside>

            {/* Map */}
            <main className="flex-1 p-2 md:p-4 bg-slate-950 relative">
                <MapView
                    routes={routes}
                    weatherData={weatherData}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    onMapClick={handleMapClick}
                />
            </main>

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
