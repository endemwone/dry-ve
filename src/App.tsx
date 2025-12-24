import { useState } from 'react';
import { Map, MapPin } from 'lucide-react';
import MapView from './components/MapView';
import RouteList from './components/RouteList';
import Controls from './components/Controls';
import { DirectionsAPI, LatLng, Route } from './services/api';
import { analyzeRouteWeather, RouteWeather } from './utils/rainLogic';

function App() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [weatherData, setWeatherData] = useState<Record<string, RouteWeather>>({});
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Real interaction state
    const [startPoint, setStartPoint] = useState<LatLng | null>(null);
    const [endPoint, setEndPoint] = useState<LatLng | null>(null);

    const handleMapClick = (lat: number, lng: number) => {
        // Toggle logic: If start is empty, set start. If start exists but end empty, set end. If both exist, reset start.
        if (!startPoint) {
            setStartPoint({ lat, lng });
        } else if (!endPoint) {
            setEndPoint({ lat, lng });
        } else {
            setStartPoint({ lat, lng });
            setEndPoint(null);
            setRoutes([]); // Clear old routes
        }
    };

    const handleFindRoutes = async () => {
        if (!startPoint || !endPoint) return;

        setIsLoading(true);
        setRoutes([]);
        setWeatherData({});
        setSelectedRouteId(null);

        try {
            const fetchedRoutes = await DirectionsAPI.getRoutes(startPoint, endPoint);
            setRoutes(fetchedRoutes);

            const weatherMap: Record<string, RouteWeather> = {};

            // Analyze weather for found routes
            await Promise.all(fetchedRoutes.map(async (route) => {
                const result = await analyzeRouteWeather(route);
                weatherMap[route.id] = result;
            }));

            setWeatherData(weatherMap);

            if (fetchedRoutes.length > 0) {
                // Find best score
                const best = fetchedRoutes.reduce((prev, curr) => {
                    const s1 = weatherMap[prev.id]?.score ?? 100;
                    const s2 = weatherMap[curr.id]?.score ?? 100;
                    return s1 < s2 ? prev : curr;
                });
                setSelectedRouteId(best.id);
            }

        } catch (error) {
            console.error("Failed", error);
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
                        Rain Map
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

        </div>
    );
}

export default App;
