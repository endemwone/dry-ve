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

const Controls: FC<ControlsProps> = ({ onFindRoutes, isLoading, startPoint, endPoint }) => {
    return (
        <Card className="p-6 mb-6">
            <div className="space-y-4">
                <div className="text-sm text-slate-400 mb-2">
                    <p>Click on the map to set points.</p>
                </div>

                <Input
                    label="Start"
                    value={startPoint ? `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : 'Click on map...'}
                    disabled
                // Add an icon or styling to indicate it's "set by map"
                />
                <Input
                    label="Destination"
                    value={endPoint ? `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : 'Click on map...'}
                    disabled
                />

                <Button
                    onClick={onFindRoutes}
                    isLoading={isLoading}
                    disabled={isLoading || !startPoint || !endPoint}
                    className="w-full mt-4"
                    icon={<Search size={20} />}
                >
                    {isLoading ? 'Calculating...' : 'Find Safe Routes'}
                </Button>

                {(!startPoint || !endPoint) && (
                    <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded">
                        <MapPin size={14} />
                        <span>Set both points to continue</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Controls;
