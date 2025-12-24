import { Route, WeatherAPI, WeatherPoint } from '../services/api';

export interface RouteWeather {
    routeId: string;
    averageRainChance: number;
    maxRainChance: number;
    points: WeatherPoint[];
    recommendation: string;
    score: number;
}

export const analyzeRouteWeather = async (
    route: Route,
    numSamples: number = 10
): Promise<RouteWeather> => {
    const samplePoints: typeof route.path = [];

    // Sampling Strategy: Evenly distribute n samples across the route
    if (route.path.length <= numSamples) {
        samplePoints.push(...route.path);
    } else {
        const step = Math.floor(route.path.length / numSamples);
        for (let i = 0; i < numSamples; i++) {
            samplePoints.push(route.path[i * step]);
        }
    }

    // TODO: Optimize sampling strategy? Maybe prioritize start/mid/end or use vector tiles.
    // Fetch weather for sample points
    const promises = samplePoints.map(async (point, index) => {
        try {
            const rainChance = await WeatherAPI.getForecast(point.lat, point.lng);
            // TODO: Consider travel time offset for more accurate 'future' weather
            const timeOffset = index * (route.duration / numSamples);

            console.log(`Sample ${index + 1}: Rain chance at [${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}] (T+${Math.round(timeOffset)}m) is ${rainChance}%`);

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

    // Calc stats
    let totalRain = 0;
    let maxRain = 0;
    results.forEach(p => {
        totalRain += p.rainProbability;
        if (p.rainProbability > maxRain) maxRain = p.rainProbability;
    });

    console.log(`Route [${route.summary}] Analysis: Avg Rain: ${Math.round(totalRain / results.length)}%, Max Rain: ${maxRain}% in ${results.length} samples.`);

    const avgRain = Math.round(totalRain / results.length);
    const score = (avgRain * 0.4) + (maxRain * 0.6);

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
