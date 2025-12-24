/**
 * Controls Component
 * 
 * Displays the route search form with:
 * - Start/end point displays (set by clicking the map)
 * - Search button with loading state
 * - Helpful prompts for user guidance
 */

import { FC } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { LatLng } from '../services/api';

interface ControlsProps {
    onFindRoutes: () => void;
    isLoading: boolean;
    startPoint: LatLng | null;
    endPoint: LatLng | null;
}

/**
 * Format coordinates for display
 */
function formatCoords(point: LatLng | null): string {
    if (!point) return 'Click on map...';
    return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

const Controls: FC<ControlsProps> = ({
    onFindRoutes,
    isLoading,
    startPoint,
    endPoint
}) => {
    const canSearch = startPoint && endPoint && !isLoading;

    return (
        <Card className="p-6 mb-6">
            <div className="space-y-4">
                {/* Instructions */}
                <p className="text-sm text-slate-400">
                    Click on the map to set points.
                </p>

                {/* Coordinate displays */}
                <Input
                    label="Start"
                    value={formatCoords(startPoint)}
                    disabled
                    readOnly
                />
                <Input
                    label="Destination"
                    value={formatCoords(endPoint)}
                    disabled
                    readOnly
                />

                {/* Search button */}
                <Button
                    onClick={onFindRoutes}
                    isLoading={isLoading}
                    disabled={!canSearch}
                    className="w-full mt-4"
                    icon={<Search size={20} />}
                >
                    {isLoading ? 'Calculating...' : 'Find Safe Routes'}
                </Button>

                {/* Helper message */}
                {!canSearch && !isLoading && (
                    <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded">
                        <MapPin size={14} />
                        <span>Set both points to continue</span>
                    </div>
                )}

                {/* TODO: Add departure time picker for future weather forecasts */}
            </div>
        </Card>
    );
};

export default Controls;
