/**
 * Controls Component
 * 
 * Displays the route search form with:
 * - Start/end point inputs (map click or text search)
 * - Autocomplete dropdown for address search
 * - Search button with loading state
 */

import { FC, useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { LatLng, GeocodingAPI, SearchResult } from '../services/api';

interface ControlsProps {
    onFindRoutes: () => void;
    isLoading: boolean;
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    onSetStart: (point: LatLng | null) => void;
    onSetEnd: (point: LatLng | null) => void;
}

/**
 * Autocomplete Input Component
 */
interface LocationSearchProps {
    label: string;
    point: LatLng | null;
    onSelect: (point: LatLng | null) => void;
}

function LocationSearch({ label, point, onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync query with selected point
    useEffect(() => {
        if (point) {
            setQuery(`${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
        } else if (!showResults) {
            setQuery('');
        }
    }, [point, showResults]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3 || point) return; // Don't search if too short or already selected

            // If user is just typing coords manually, ignore
            if (query.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)) return;

            setIsSearching(true);
            const data = await GeocodingAPI.search(query);
            setResults(data);
            setIsSearching(false);
            setShowResults(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, point]);

    const handleSelect = (result: SearchResult) => {
        onSelect({ lat: result.lat, lng: result.lng });
        setQuery(result.label); // Ideally show cleaner name
        setShowResults(false);
    };

    const handleClear = () => {
        onSelect(null);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Input
                    label={label}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!e.target.value) onSelect(null);
                    }}
                    placeholder="Search address or click map..."
                    className="pr-8"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-8 text-slate-500 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((result, i) => (
                        <button
                            key={i}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 border-b border-slate-700/50 last:border-0 transition-colors"
                            onClick={() => handleSelect(result)}
                        >
                            <div className="font-medium text-slate-200 truncate">{result.label.split(',')[0]}</div>
                            <div className="text-xs text-slate-500 truncate">{result.label}</div>
                        </button>
                    ))}
                </div>
            )}

            {isSearching && (
                <div className="absolute right-3 top-9">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

const Controls: FC<ControlsProps> = ({
    onFindRoutes,
    isLoading,
    startPoint,
    endPoint,
    onSetStart,
    onSetEnd
}) => {
    const canSearch = startPoint && endPoint && !isLoading;

    return (
        <Card className="p-6 mb-6">
            <div className="space-y-4">
                {/* Instructions */}
                <p className="text-sm text-slate-400">
                    Search for a location or click on the map.
                </p>

                <LocationSearch
                    label="Start"
                    point={startPoint}
                    onSelect={onSetStart}
                />

                <LocationSearch
                    label="Destination"
                    point={endPoint}
                    onSelect={onSetEnd}
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
            </div>
        </Card>
    );
};

export default Controls;
