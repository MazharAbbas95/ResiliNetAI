import { Region, Coordinate } from '@appTypes/geospatial';

export const getRegionForCoordinates = (points: Coordinate[]): Region => {
  let minX: number, maxX: number, minY: number, maxY: number;

  // init first point
  ((point) => {
    minX = point.latitude;
    maxX = point.latitude;
    minY = point.longitude;
    maxY = point.longitude;
  })(points[0]);

  // calculate rect
  points.map((point) => {
    minX = Math.min(minX, point.latitude);
    maxX = Math.max(maxX, point.latitude);
    minY = Math.min(minY, point.longitude);
    maxY = Math.max(maxY, point.longitude);
  });

  const midX = (minX! + maxX!) / 2;
  const midY = (minY! + maxY!) / 2;
  const deltaX = (maxX! - minX!) * 1.5; // add padding
  const deltaY = (maxY! - minY!) * 1.5;

  return {
    latitude: midX,
    longitude: midY,
    latitudeDelta: deltaX,
    longitudeDelta: deltaY,
  };
};
