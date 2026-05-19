import { Coordinate } from '@appTypes/geospatial';

export const locationUtils = {
  calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371e3; // metres
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  },

  isSignificantMove(coord1: Coordinate, coord2: Coordinate, threshold: number = 5): boolean {
    return this.calculateDistance(coord1, coord2) > threshold;
  },
};
