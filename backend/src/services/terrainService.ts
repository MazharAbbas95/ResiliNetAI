/**
 * Terrain Vulnerability Service
 * 
 * Simulates geographic and elevation-based risk factors for flood analysis.
 * In a production system, this would integrate with GIS/DEM (Digital Elevation Model) data.
 */

export interface TerrainVulnerability {
  terrainRisk: 'low' | 'medium' | 'high' | 'critical';
  terrainScore: number; // 0-100
  terrainFactors: string[];
}

export class TerrainService {
  /**
   * Calculates terrain vulnerability based on location coordinates.
   * Logic is deterministic/mocked for specific regions in Pakistan.
   */
  static calculateTerrainRisk(lat: number, lng: number): TerrainVulnerability {
    const factors: string[] = [];
    let score = 30; // base score

    // Simulate Low-lying areas / Flood Plains (e.g. near Indus River basin)
    // Coarse coordinates for Indus basin regions
    const isLowLying = (lat > 24 && lat < 28) || (lat > 31 && lat < 32); 
    
    if (isLowLying) {
      score += 35;
      factors.push('low elevation zone');
      factors.push('flood plain proximity');
    } else {
      factors.push('elevated terrain');
    }

    // Simulate Urban Drainage issues (e.g. Lahore/Karachi centers)
    const isUrbanCenter = (lat > 31.4 && lat < 31.6 && lng > 74.2 && lng < 74.4) || // Lahore
                          (lat > 24.8 && lat < 25.0 && lng > 66.9 && lng < 67.2);   // Karachi

    if (isUrbanCenter) {
      score += 20;
      factors.push('high urban density');
      factors.push('poor drainage infrastructure');
    }

    // Proximity to water body simulator (pseudo-random based on hash of coords)
    const waterProximityHash = Math.abs(Math.sin(lat * 100) + Math.cos(lng * 100));
    if (waterProximityHash > 1.5) {
      score += 15;
      factors.push('adjacent to water body');
    }

    // Clamp score
    const terrainScore = Math.min(100, Math.max(0, score));

    // Determine risk label
    let terrainRisk: TerrainVulnerability['terrainRisk'] = 'low';
    if (terrainScore >= 76) terrainRisk = 'critical';
    else if (terrainScore >= 51) terrainRisk = 'high';
    else if (terrainScore >= 26) terrainRisk = 'medium';

    return {
      terrainRisk,
      terrainScore,
      terrainFactors: factors
    };
  }
}
