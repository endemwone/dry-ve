/**
 * RouteList Component
 * 
 * Displays a list of routes sorted by rain score (driest first).
 * Each route shows:
 * - Duration and distance
 * - Rain probability and recommendation
 * - "Best Route" badge for the top option
 */

import { FC } from 'react';
import { CloudRain, Clock } from 'lucide-react';
import { Route } from '../services/api';
import { RouteWeather } from '../utils/rainLogic';
import { Card } from './ui/Card';

interface RouteListProps {
    routes: Route[];
    weatherData: Record<string, RouteWeather>;
    selectedRouteId: string | null;
    onSelectRoute: (id: string) => void;
    isLoading: boolean;
}

/**
 * Loading skeleton placeholder
 */
function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-800 rounded-xl" />
            ))}
        </div>
    );
}

/**
 * Individual route card component
 */
interface RouteCardProps {
    route: Route;
    weather: RouteWeather | undefined;
    isSelected: boolean;
    isBest: boolean;
    onSelect: () => void;
}

function RouteCard({ route, weather, isSelected, isBest, onSelect }: RouteCardProps) {
    return (
        <Card
            variant="interactive"
            isSelected={isSelected}
            onClick={onSelect}
            className="p-4 rounded-xl"
        >
            {/* Header: Route name and duration */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {isBest && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            BEST ROUTE
                        </span>
                    )}
                    <h3 className="font-semibold text-lg">{route.summary}</h3>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-300">
                        <Clock size={16} />
                        <span>{route.duration} min</span>
                    </div>
                    <div className="text-sm text-slate-500">{route.distance} km</div>
                </div>
            </div>

            {/* Weather info */}
            {weather && (
                <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-900/50 p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <CloudRain size={18} />
                        <span className="font-medium">{weather.maxRainChance}% Rain</span>
                    </div>
                    <div className="text-sm text-slate-400 flex items-center justify-end">
                        {weather.recommendation}
                    </div>
                </div>
            )}
        </Card>
    );
}

const RouteList: FC<RouteListProps> = ({
    routes,
    weatherData,
    selectedRouteId,
    onSelectRoute,
    isLoading
}) => {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Sort routes by score (lowest = driest)
    const sortedRoutes = [...routes].sort((a, b) => {
        const scoreA = weatherData[a.id]?.score ?? 100;
        const scoreB = weatherData[b.id]?.score ?? 100;
        return scoreA - scoreB;
    });

    return (
        <div className="space-y-4">
            {sortedRoutes.map((route, index) => (
                <RouteCard
                    key={route.id}
                    route={route}
                    weather={weatherData[route.id]}
                    isSelected={route.id === selectedRouteId}
                    isBest={index === 0}
                    onSelect={() => onSelectRoute(route.id)}
                />
            ))}
        </div>
    );
};

export default RouteList;
