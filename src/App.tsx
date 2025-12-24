import { useState, useRef } from 'react';
import { Map, MapPin } from 'lucide-react';
import MapView from './components/MapView';
import RouteList from './components/RouteList';
import Controls from './components/Controls';
import Toast from './components/ui/Toast';
import { DirectionsAPI, LatLng, Route } from './services/api';
import { analyzeRouteWeather, RouteWeather } from './utils/rainLogic';

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

function App() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [weatherData, setWeatherData] = useState<Record<string, RouteWeather>>({});
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<ToastState | null>(null);

    // Rate limiting
    const lastRequestRef = useRef<number>(0);
    const RATE_LIMIT_MS = 2000;

    // Real interaction state
    const [startPoint, setStartPoint] = useState<LatLng | null>(null);
    const [endPoint, setEndPoint] = useState<LatLng | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleMapClick = (lat: number, lng: number) => {
        if (!startPoint) {
            setStartPoint({ lat, lng });
        } else if (!endPoint) {
            setEndPoint({ lat, lng });
        } else {
            setStartPoint({ lat, lng });
            setEndPoint(null);
            setRoutes([]);
        }
    };

    const handleFindRoutes = async () => {
        if (!startPoint || !endPoint) return;

        // Rate limiting check
        const now = Date.now();
        if (now - lastRequestRef.current < RATE_LIMIT_MS) {
            showToast('Please wait a moment before searching again', 'error');
            return;
        }
        lastRequestRef.current = now;

        setIsLoading(true);
        setRoutes([]);
        setWeatherData({});
        setSelectedRouteId(null);

        try {
            const fetchedRoutes = await DirectionsAPI.getRoutes(startPoint, endPoint);

            if (fetchedRoutes.length === 0) {
                showToast('No routes found. Try different locations.', 'error');
                setIsLoading(false);
                return;
            }

            setRoutes(fetchedRoutes);

            const weatherMap: Record<string, RouteWeather> = {};

            await Promise.all(fetchedRoutes.map(async (route) => {
                const result = await analyzeRouteWeather(route);
                weatherMap[route.id] = result;
            }));

            setWeatherData(weatherMap);

            if (fetchedRoutes.length > 0) {
                const best = fetchedRoutes.reduce((prev, curr) => {
                    const s1 = weatherMap[prev.id]?.score ?? 100;
                    const s2 = weatherMap[curr.id]?.score ?? 100;
                    return s1 < s2 ? prev : curr;
                });
                setSelectedRouteId(best.id);
                showToast(`Found ${fetchedRoutes.length} route(s)!`, 'success');
            }

        } catch (error) {
            console.error("Failed", error);
            showToast('Failed to fetch routes. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-900 text-white flex flex-col md:flex-row overflow-hidden">

            <div className="w-full md:w-96 p-4 md:p-6 bg-slate-900 flex flex-col z-10 border-r border-slate-800 shadow-2xl overflow-y-auto">
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

                <Controls
                    onFindRoutes={handleFindRoutes}
                    isLoading={isLoading}
                    startPoint={startPoint}
                    endPoint={endPoint}
                />

                {routes.length > 0 && (
                    <RouteList
                        routes={routes}
                        weatherData={weatherData}
                        selectedRouteId={selectedRouteId}
                        onSelectRoute={setSelectedRouteId}
                        isLoading={isLoading}
                    />
                )}
            </div>

            <div className="flex-1 p-2 md:p-4 bg-slate-950 relative">
                <MapView
                    routes={routes}
                    weatherData={weatherData}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    onMapClick={handleMapClick}
                />
            </div>

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

export default App;
