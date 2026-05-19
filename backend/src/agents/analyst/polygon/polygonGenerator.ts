import { Coordinate } from '../types/analystTypes';

/**
 * Generates a simple rectangular polygon (bounding box) around a cluster.
 * In the future, this could use a Convex Hull algorithm for more accurate polygons.
 */
export function generatePolygonCoords(center: Coordinate, radiusMeters: number): Coordinate[] {
  const latOffset = (radiusMeters / 111320); // roughly 1 degree lat = 111km
  const lngOffset = (radiusMeters / (111320 * Math.cos(center.lat * (Math.PI / 180))));

  return [
    { lat: center.lat + latOffset, lng: center.lng - lngOffset },
    { lat: center.lat + latOffset, lng: center.lng + lngOffset },
    { lat: center.lat - latOffset, lng: center.lng + lngOffset },
    { lat: center.lat - latOffset, lng: center.lng - lngOffset },
    { lat: center.lat + latOffset, lng: center.lng - lngOffset }, // close loop
  ];
}
