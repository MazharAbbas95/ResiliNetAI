import { Coordinate } from '../types/analystTypes';

/**
 * Clusters geospatial points using a simple distance threshold.
 */
export function clusterPoints(
  points: { lat: number; lng: number }[],
  distanceThresholdKm: number = 0.5 // 500 meters
): { center: Coordinate; points: Coordinate[]; radius: number }[] {
  const clusters: { center: Coordinate; points: Coordinate[]; radius: number }[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const currentCluster: Coordinate[] = [points[i]];
    visited.add(i);

    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue;

      const dist = calculateDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (dist <= distanceThresholdKm) {
        currentCluster.push(points[j]);
        visited.add(j);
      }
    }

    if (currentCluster.length > 0) {
      const center = calculateCenter(currentCluster);
      clusters.push({
        center,
        points: currentCluster,
        radius: calculateMaxDistance(center, currentCluster) * 1000 // to meters
      });
    }
  }

  return clusters;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateCenter(points: Coordinate[]): Coordinate {
  const lat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
  const lng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;
  return { lat, lng };
}

function calculateMaxDistance(center: Coordinate, points: Coordinate[]): number {
  let max = 0;
  for (const p of points) {
    const d = calculateDistance(center.lat, center.lng, p.lat, p.lng);
    if (d > max) max = d;
  }
  return Math.max(0.1, max); // min 100m
}
