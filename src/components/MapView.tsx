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

import { FC, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, Icon, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Services
import { LatLng, Route } from '../services/api';
import { getSegmentColor, RouteWeather } from '../utils/rainLogic';

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
     * Generate color-coded segments for the selected route
     */
    /**
     * Generate color-coded segments for the selected route
     * Uses linear interpolation between weather samples to create a gradient-like effect
     */
    const coloredSegments = useMemo(() => {
        if (!selectedRouteId) return null;

        const route = routes.find(r => r.id === selectedRouteId);
        const weather = weatherData[selectedRouteId];

        if (!route || !weather || !weather.points.length) return null;

        const segments: { positions: LatLngTuple[]; color: string }[] = [];
        let currentSegment: LatLngTuple[] = [];
        let currentColor = '';

        // 1. Map weather samples to their approximate distance along the route
        // We assume weather points appear in order along the path
        const sampleDistances: { dist: number; prob: number }[] = [];
        let currentDist = 0;
        let lastPoint = route.path[0];
        let sampleIndex = 0;

        // Find distance for each weather sample by walking the route
        // This maps the sparse weather points to the dense route path
        for (const point of route.path) {
            currentDist += Math.hypot(point.lat - lastPoint.lat, point.lng - lastPoint.lng); // Simplified distance for speed? No, let's use LatLng logic if possible, but for interpolation ratio simple hypot is okay-ish locally, but haversine is better.
            // Actually, let's just use the weather points directly provided
            // We need to know "At 5km, rain is 10%". "At 10km, rain is 20%".

            // Optimization: matching exact coordinates might fail due to float precision
            // Let's rely on the fact that selectSamplePoints usually picks existing points

            const sample = weather.points[sampleIndex];
            if (sample && Math.abs(sample.lat - point.lat) < 0.0001 && Math.abs(sample.lng - point.lng) < 0.0001) {
                sampleDistances.push({ dist: currentDist, prob: sample.rainProbability });
                sampleIndex++;
            }
            lastPoint = point;
        }

        // Ensure first and last are covered if matching failed (robustness)
        if (sampleDistances.length === 0) {
            sampleDistances.push({ dist: 0, prob: weather.points[0].rainProbability });
        }
        if (sampleIndex < weather.points.length) {
            // Append remaining
            for (let i = sampleIndex; i < weather.points.length; i++) {
                sampleDistances.push({ dist: currentDist, prob: weather.points[i].rainProbability });
            }
        }

        // 2. Walk route again and interpolate
        currentDist = 0;
        lastPoint = route.path[0];
        let nextSampleIdx = 0;

        route.path.forEach((point) => {
            // Update distance
            // We use simple Euclidean here for relative ratios to avoid expensive Haversine in loop
            // Scale doesn't matter as long as it's consistent with above
            currentDist += Math.hypot(point.lat - lastPoint.lat, point.lng - lastPoint.lng);
            lastPoint = point;

            // Find surrounding samples
            // We want sample[i].dist <= currentDist <= sample[i+1].dist
            while (nextSampleIdx < sampleDistances.length - 1 && currentDist > sampleDistances[nextSampleIdx + 1].dist) {
                nextSampleIdx++;
            }

            const prev = sampleDistances[nextSampleIdx];
            const next = sampleDistances[nextSampleIdx + 1] || prev; // Handle end of route

            let prob = prev.prob;
            if (next.dist > prev.dist) {
                const ratio = (currentDist - prev.dist) / (next.dist - prev.dist);
                prob = prev.prob + (next.prob - prev.prob) * Math.max(0, Math.min(1, ratio));
            }

            const color = getSegmentColor(prob);
            const pos: LatLngTuple = [point.lat, point.lng];

            if (!currentColor) currentColor = color;

            if (color !== currentColor) {
                if (currentSegment.length > 0) {
                    currentSegment.push(pos); // Connect segments
                    segments.push({ positions: currentSegment, color: currentColor });
                }
                currentSegment = [pos];
                currentColor = color;
            } else {
                currentSegment.push(pos);
            }
        });

        if (currentSegment.length > 0) {
            segments.push({ positions: currentSegment, color: currentColor });
        }

        return segments;
    }, [selectedRouteId, routes, weatherData]);

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

                {/* Unselected Routes - Grey/Dimmed */}
                {routes.map(route => {
                    const isSelected = route.id === selectedRouteId;
                    if (isSelected) return null; // We render selected separately

                    return (
                        <Polyline
                            key={route.id}
                            positions={route.path.map(p => [p.lat, p.lng])}
                            pathOptions={{
                                color: '#334155', // Slate-700
                                weight: 5,
                                opacity: 0.5,
                                className: 'hover:stroke-blue-500 cursor-pointer transition-colors'
                            }}
                            eventHandlers={{ click: () => onSelectRoute(route.id) }}
                        />
                    );
                })}

                {/* Selected Route - Colored Segments */}
                {coloredSegments ? (
                    coloredSegments.map((segment, i) => (
                        <Polyline
                            key={`segment-${i}`}
                            positions={segment.positions}
                            pathOptions={{
                                color: segment.color,
                                weight: 8,
                                opacity: 0.9,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }}
                        />
                    ))
                ) : (
                    // Fallback if no weather data yet or logic fails
                    selectedRouteId && routes.find(r => r.id === selectedRouteId) && (
                        <Polyline
                            positions={routes.find(r => r.id === selectedRouteId)!.path.map(p => [p.lat, p.lng])}
                            pathOptions={{ color: '#fbbf24', weight: 8, opacity: 0.8 }}
                        />
                    )
                )}

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
