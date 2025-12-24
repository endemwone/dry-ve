import { Route, WeatherAPI, WeatherPoint } from '../services/api';

export interface RouteWeather {
    routeId: string;
    averageRainChance: number;
    maxRainChance: number;
    points: WeatherPoint[];
    recommendation: string;
    score: number;
}

// Calculate distance between two points using Haversine formula
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Distance-based sampling: 1 sample per SAMPLE_INTERVAL_KM, capped at MAX_SAMPLES
const SAMPLE_INTERVAL_KM = 5;
const MAX_SAMPLES = 15;
const MIN_SAMPLES = 3;

export const analyzeRouteWeather = async (route: Route): Promise<RouteWeather> => {
    const samplePoints: typeof route.path = [];

    // Always include start
    samplePoints.push(route.path[0]);

    // Calculate how many samples based on distance
    const targetSamples = Math.min(MAX_SAMPLES, Math.max(MIN_SAMPLES, Math.ceil(route.distance / SAMPLE_INTERVAL_KM)));

    if (route.path.length <= targetSamples) {
        // Short route: use all points
        samplePoints.length = 0;
        samplePoints.push(...route.path);
    } else {
        // Sample evenly based on distance
        let accumulatedDistance = 0;
        const intervalDistance = route.distance / (targetSamples - 1);
        let nextThreshold = intervalDistance;

        for (let i = 1; i < route.path.length; i++) {
            const prev = route.path[i - 1];
            const curr = route.path[i];
            accumulatedDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);

            if (accumulatedDistance >= nextThreshold) {
                samplePoints.push(curr);
                nextThreshold += intervalDistance;
            }
        }

        // Always include end point
        const lastPoint = route.path[route.path.length - 1];
        if (samplePoints[samplePoints.length - 1] !== lastPoint) {
            samplePoints.push(lastPoint);
        }
    }

    console.log(`[SAMPLING] Route "${route.summary}": ${route.distance}km → ${samplePoints.length} samples`);

    // Fetch weather for sample points
    const promises = samplePoints.map(async (point, index) => {
        try {
            const rainChance = await WeatherAPI.getForecast(point.lat, point.lng);
            // TODO: Consider travel time offset for more accurate 'future' weather
            const timeOffset = index * (route.duration / samplePoints.length);

            console.log(`  Sample ${index + 1}: [${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}] (T+${Math.round(timeOffset)}m) → ${rainChance}%`);

            return {
                lat: point.lat,
                lng: point.lng,
                time: new Date(),
                rainProbability: rainChance,
                condition: getCondition(rainChance)
            } as WeatherPoint;
        } catch (err) {
            console.warn(`Failed to fetch weather for sample ${index}`, err);
            return {
                lat: point.lat,
                lng: point.lng,
                time: new Date(),
                rainProbability: 0,
                condition: 'Clear'
            } as WeatherPoint;
        }
    });

    const results = await Promise.all(promises);
    const weatherPoints: WeatherPoint[] = results;

    // Calculate stats
    let totalRain = 0;
    let maxRain = 0;
    results.forEach(p => {
        totalRain += p.rainProbability;
        if (p.rainProbability > maxRain) maxRain = p.rainProbability;
    });

    const avgRain = Math.round(totalRain / results.length);
    const score = (avgRain * 0.4) + (maxRain * 0.6);

    console.log(`[RESULT] Route "${route.summary}": Avg ${avgRain}%, Max ${maxRain}%, Score ${score.toFixed(1)}`);

    let recommendation = "Safe to ride";
    if (maxRain > 70) recommendation = "Stormy! Avoid.";
    else if (maxRain > 40) recommendation = "Rainy sections ahead.";
    else if (avgRain > 20) recommendation = "Might drizzle.";
    else if (results.length > 0 && maxRain < 10) recommendation = "Dry route!";

    return {
        routeId: route.id,
        averageRainChance: avgRain,
        maxRainChance: maxRain,
        points: weatherPoints,
        recommendation,
        score
    };
};

function getCondition(probability: number): WeatherPoint['condition'] {
    if (probability > 70) return 'Storm';
    if (probability > 50) return 'Heavy Rain';
    if (probability > 20) return 'Light Rain';
    if (probability > 10) return 'Cloudy';
    return 'Clear';
}
