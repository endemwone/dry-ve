/**
 * Rain Analysis Logic for Dry-ve
 * 
 * Analyzes weather conditions along a route to provide:
 * - Rain probability scores
 * - Route recommendations
 * - Weather-based route ranking
 */

import { Route, WeatherAPI, WeatherPoint } from '../services/api';

// ============================================================================
// Types
// ============================================================================

/** Weather analysis result for a single route */
export interface RouteWeather {
    routeId: string;
    averageRainChance: number;  // 0-100
    maxRainChance: number;      // 0-100
    points: WeatherPoint[];
    recommendation: string;
    score: number;              // Lower is better (less rain)
}

// ============================================================================
// Configuration
// ============================================================================

/** Sample one weather point per this many kilometers */
const SAMPLE_INTERVAL_KM = 5;

/** Maximum number of weather samples per route */
const MAX_SAMPLES = 15;

/** Minimum number of weather samples per route */
const MIN_SAMPLES = 3;

// ============================================================================
// Constants
// ============================================================================

export const RAIN_COLORS = {
    SAFE: '#22c55e',      // 0-10% (Green)
    LOW: '#84cc16',       // 10-30% (Lime)
    MODERATE: '#eab308',  // 30-50% (Yellow)
    UNPLEASANT: '#f97316',// 50-70% (Orange)
    HEAVY: '#ef4444',     // 70-90% (Red)
    SEVERE: '#7e22ce'     // 90-100% (Purple)
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color based on rain probability
 */
export function getSegmentColor(probability: number): string {
    if (probability > 90) return RAIN_COLORS.SEVERE;
    if (probability > 70) return RAIN_COLORS.HEAVY;
    if (probability > 50) return RAIN_COLORS.UNPLEASANT;
    if (probability > 30) return RAIN_COLORS.MODERATE;
    if (probability > 10) return RAIN_COLORS.LOW;
    return RAIN_COLORS.SAFE;
}

/**
 * Calculate distance between two points using the Haversine formula
 * @returns Distance in kilometers
 */
function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Convert rain probability to a weather condition label
 */
function getCondition(probability: number): WeatherPoint['condition'] {
    if (probability > 70) return 'Storm';
    if (probability > 50) return 'Heavy Rain';
    if (probability > 20) return 'Light Rain';
    if (probability > 10) return 'Cloudy';
    return 'Clear';
}

/**
 * Generate a recommendation message based on rain data
 */
function getRecommendation(avgRain: number, maxRain: number): string {
    if (maxRain > 70) return 'Stormy! Avoid.';
    if (maxRain > 40) return 'Rainy sections ahead.';
    if (avgRain > 20) return 'Might drizzle.';
    if (maxRain < 10) return 'Dry route!';
    return 'Safe to ride';
}

/**
 * Select sample points along a route based on distance
 * Uses distance-based sampling: 1 point per SAMPLE_INTERVAL_KM
 */
function selectSamplePoints(route: Route): Route['path'] {
    const { path, distance } = route;

    // Calculate target number of samples
    const targetSamples = Math.min(
        MAX_SAMPLES,
        Math.max(MIN_SAMPLES, Math.ceil(distance / SAMPLE_INTERVAL_KM))
    );

    // For short routes, use all points
    if (path.length <= targetSamples) {
        return [...path];
    }

    // Sample evenly based on distance
    const samples: Route['path'] = [path[0]]; // Always include start
    let accumulatedDistance = 0;
    const intervalDistance = distance / (targetSamples - 1);
    let nextThreshold = intervalDistance;

    for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        accumulatedDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);

        if (accumulatedDistance >= nextThreshold) {
            samples.push(curr);
            nextThreshold += intervalDistance;
        }
    }

    // Always include end point
    const lastPoint = path[path.length - 1];
    if (samples[samples.length - 1] !== lastPoint) {
        samples.push(lastPoint);
    }

    return samples;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze weather conditions along a route
 * 
 * @param route - The route to analyze
 * @returns Weather analysis with score, recommendation, and sample points
 * 
 * @example
 * const weather = await analyzeRouteWeather(route);
 * console.log(weather.recommendation); // "Dry route!"
 */
export async function analyzeRouteWeather(route: Route): Promise<RouteWeather> {
    const samplePoints = selectSamplePoints(route);

    // Fetch weather for all sample points in parallel
    const weatherPromises = samplePoints.map(async (point) => {
        try {
            const rainChance = await WeatherAPI.getForecast(point.lat, point.lng);

            return {
                lat: point.lat,
                lng: point.lng,
                time: new Date(),
                rainProbability: rainChance,
                condition: getCondition(rainChance)
            } as WeatherPoint;
        } catch {
            // Default to clear weather on error
            return {
                lat: point.lat,
                lng: point.lng,
                time: new Date(),
                rainProbability: 0,
                condition: 'Clear'
            } as WeatherPoint;
        }
    });

    const weatherPoints = await Promise.all(weatherPromises);

    // Calculate statistics
    let totalRain = 0;
    let maxRain = 0;

    for (const point of weatherPoints) {
        totalRain += point.rainProbability;
        if (point.rainProbability > maxRain) {
            maxRain = point.rainProbability;
        }
    }

    const avgRain = Math.round(totalRain / weatherPoints.length);

    // Score formula: weighted average of avg and max rain
    // Lower score = better (less rainy)
    const score = (avgRain * 0.4) + (maxRain * 0.6);

    return {
        routeId: route.id,
        averageRainChance: avgRain,
        maxRainChance: maxRain,
        points: weatherPoints,
        recommendation: getRecommendation(avgRain, maxRain),
        score
    };
}
