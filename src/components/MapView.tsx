import { FC, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple, Icon, LeafletMouseEvent } from 'leaflet';
import { LatLng, Route } from '../services/api';
import { RouteWeather } from '../utils/rainLogic';
import markerIconPng from "leaflet/dist/images/marker-icon.png"
import markerIconShadowPng from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = new Icon({
    iconUrl: markerIconPng,
    shadowUrl: markerIconShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface MapViewProps {
    routes: Route[];
    weatherData: Record<string, RouteWeather>;
    selectedRouteId: string | null;
    onSelectRoute: (id: string) => void;
    startPoint: LatLng | null;
    endPoint: LatLng | null;
    onMapClick: (lat: number, lng: number) => void;
}

// Map Click Handler Component
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

// Component to handle map bounds
function MapBounds({ routes, start, end }: { routes: Route[], start: LatLng | null, end: LatLng | null }) {
    const map = useMap();

    useEffect(() => {
        const bounds: LatLngTuple[] = [];

        if (start) bounds.push([start.lat, start.lng]);
        if (end) bounds.push([end.lat, end.lng]);

        routes.forEach(r => {
            r.path.forEach(p => bounds.push([p.lat, p.lng]));
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
    }, [routes, start, end, map]);

    return null;
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

    const getRouteColor = (routeId: string) => {
        const weather = weatherData[routeId];
        if (!weather) return '#3b82f6';
        if (routeId === selectedRouteId) return '#fbbf24';
        if (weather.maxRainChance > 60) return '#ef4444';
        if (weather.maxRainChance > 30) return '#f97316';
        return '#22c55e';
    };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative z-0">
            <MapContainer
                center={[51.505, -0.09]} // Default to London
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <ClickHandler onClick={onMapClick} />
                <MapBounds routes={routes} start={startPoint} end={endPoint} />

                {routes.map(route => (
                    <Polyline
                        key={route.id}
                        positions={route.path.map(p => [p.lat, p.lng])}
                        pathOptions={{
                            color: getRouteColor(route.id),
                            weight: route.id === selectedRouteId ? 8 : 5,
                            opacity: selectedRouteId && route.id !== selectedRouteId ? 0.5 : 0.8
                        }}
                        eventHandlers={{ click: () => onSelectRoute(route.id) }}
                    />
                ))}

                {startPoint && (
                    <Marker position={[startPoint.lat, startPoint.lng]} icon={DefaultIcon}>
                        <Popup>Start Point</Popup>
                    </Marker>
                )}
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
