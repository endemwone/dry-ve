import { FC } from 'react';
import { Route } from '../services/api';
import { RouteWeather } from '../utils/rainLogic';
import { CloudRain, Clock } from 'lucide-react';
import { Card } from './ui/Card';

interface RouteListProps {
    routes: Route[];
    weatherData: Record<string, RouteWeather>;
    selectedRouteId: string | null;
    onSelectRoute: (id: string) => void;
    isLoading: boolean;
}

const RouteList: FC<RouteListProps> = ({ routes, weatherData, selectedRouteId, onSelectRoute, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-800 rounded-xl" />
                ))}
            </div>
        )
    }

    // Sort routes by score (lowest score = least rain/risk)
    const sortedRoutes = [...routes].sort((a, b) => {
        const scoreA = weatherData[a.id]?.score ?? 100;
        const scoreB = weatherData[b.id]?.score ?? 100;
        return scoreA - scoreB;
    });

    return (
        <div className="space-y-4">
            {sortedRoutes.map((route, index) => {
                const weather = weatherData[route.id];
                const isBest = index === 0;

                return (
                    <Card
                        key={route.id}
                        variant="interactive"
                        isSelected={route.id === selectedRouteId}
                        onClick={() => onSelectRoute(route.id)}
                        className="p-4 rounded-xl"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    {isBest && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                            BEST ROUTE
                                        </span>
                                    )}
                                    <h3 className="font-semibold text-lg">{route.summary}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 text-slate-300">
                                    <Clock size={16} />
                                    <span>{route.duration} min</span>
                                </div>
                                <div className="text-sm text-slate-500">{route.distance} km</div>
                            </div>
                        </div>

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
            })}
        </div>
    );
};

export default RouteList;
