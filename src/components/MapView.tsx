/**
 * MapView Component
 * 
 * Interactive map displaying:
 * - Start and end markers (click to set)
 * - Route polylines with color-coding based on rain probability
 * - Auto-bounds to fit all points
 * 
 * Uses Leaflet with CartoDB dark tiles for a modern look.
 */

import { FC, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, Icon, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Services
import { LatLng, Route } from '../services/api';
import { RouteWeather } from '../utils/rainLogic';

// Leaflet marker assets
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerIconShadowPng from 'leaflet/dist/images/marker-shadow.png';

// ============================================================================
// Constants
// ============================================================================

/** Default map center (London) */
const DEFAULT_CENTER: LatLngTuple = [51.505, -0.09];
const DEFAULT_ZOOM = 13;

/** Custom Leaflet marker icon */
const DefaultIcon = new Icon({
    iconUrl: markerIconPng,
    shadowUrl: markerIconShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

/** Route color based on rain probability */
const ROUTE_COLORS = {
    selected: '#fbbf24',  // Yellow
    low: '#22c55e',       // Green (< 30% rain)
    medium: '#f97316',    // Orange (30-60% rain)
    high: '#ef4444',      // Red (> 60% rain)
    default: '#3b82f6'    // Blue (no data)
};

// ============================================================================
// Helper Components
// ============================================================================

interface ClickHandlerProps {
    onClick: (lat: number, lng: number) => void;
}

/**
 * Invisible component that captures map clicks
 */
function ClickHandler({ onClick }: ClickHandlerProps) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

interface MapBoundsProps {
    routes: Route[];
    start: LatLng | null;
    end: LatLng | null;
}

/**
 * Component that adjusts map bounds to fit points and routes
 */
function MapBounds({ routes, start, end }: MapBoundsProps) {
    const map = useMap();

    useEffect(() => {
        const bounds: LatLngTuple[] = [];

        if (start) bounds.push([start.lat, start.lng]);
        if (end) bounds.push([end.lat, end.lng]);

        routes.forEach(route => {
            route.path.forEach(point => {
                bounds.push([point.lat, point.lng]);
            });
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
        }
    }, [routes, start, end, map]);

    return null;
}

// ============================================================================
// Main Component
// ============================================================================

interface MapViewProps {
    routes: Route[];
    weatherData: Record<string, RouteWeather>;
    selectedRouteId: string | null;
    onSelectRoute: (id: string) => void;
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    onMapClick: (lat: number, lng: number) => void;
}

const MapView: FC<MapViewProps> = ({
    routes,
    weatherData,
    selectedRouteId,
    onSelectRoute,
    startPoint,
    endPoint,
    onMapClick
}) => {
    /**
     * Get route color based on selection state and rain probability
     */
    const getRouteColor = (routeId: string): string => {
        if (routeId === selectedRouteId) return ROUTE_COLORS.selected;

        const weather = weatherData[routeId];
        if (!weather) return ROUTE_COLORS.default;

        if (weather.maxRainChance > 60) return ROUTE_COLORS.high;
        if (weather.maxRainChance > 30) return ROUTE_COLORS.medium;
        return ROUTE_COLORS.low;
    };

    /**
     * Get route line weight based on selection
     */
    const getRouteWeight = (routeId: string): number => {
        return routeId === selectedRouteId ? 8 : 5;
    };

    /**
     * Get route opacity based on selection
     */
    const getRouteOpacity = (routeId: string): number => {
        if (!selectedRouteId) return 0.8;
        return routeId === selectedRouteId ? 0.8 : 0.5;
    };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative z-0">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Dark-themed map tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Click handler for setting points */}
                <ClickHandler onClick={onMapClick} />

                {/* Auto-fit bounds */}
                <MapBounds routes={routes} start={startPoint} end={endPoint} />

                {/* Route polylines */}
                {routes.map(route => (
                    <Polyline
                        key={route.id}
                        positions={route.path.map(p => [p.lat, p.lng])}
                        pathOptions={{
                            color: getRouteColor(route.id),
                            weight: getRouteWeight(route.id),
                            opacity: getRouteOpacity(route.id)
                        }}
                        eventHandlers={{ click: () => onSelectRoute(route.id) }}
                    />
                ))}

                {/* Start marker */}
                {startPoint && (
                    <Marker position={[startPoint.lat, startPoint.lng]} icon={DefaultIcon}>
                        <Popup>Start Point</Popup>
                    </Marker>
                )}

                {/* End marker */}
                {endPoint && (
                    <Marker position={[endPoint.lat, endPoint.lng]} icon={DefaultIcon}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default MapView;
