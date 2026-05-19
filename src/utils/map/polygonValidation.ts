import { PolygonCoordinate } from '@appTypes/geospatial';

export const polygonValidation = {
  isValidPolygon(polygon: PolygonCoordinate[]): boolean {
    if (!polygon || polygon.length < 3) return false;
    
    return polygon.every(coord => 
      typeof coord.latitude === 'number' && 
      typeof coord.longitude === 'number' &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude)
    );
  },

  isPointInPolygon(point: PolygonCoordinate, polygon: PolygonCoordinate[]): boolean {
    let x = point.latitude, y = point.longitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = polygon[i].latitude, yi = polygon[i].longitude;
      let xj = polygon[j].latitude, yj = polygon[j].longitude;
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
};
