import { useLocationStore } from '../store/locationStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FloodReport {
  id: string;
  text: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  severity: SignalSeverity;
  timestamp: number;
  source: string;
  category?: 'FlashFlood' | 'Erosion' | 'Debris' | 'Wildfire' | 'Infrastructure' | 'Traffic' | 'PowerOutage' | 'StormDamage';
  trustScore?: number;
}

export interface SocialSignalResponse {
  reports: FloodReport[];
  count: number;
  source: string;
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function deduceHazardType(text: string): 'FlashFlood' | 'Erosion' | 'Debris' | 'Wildfire' | 'Infrastructure' | 'Traffic' | 'PowerOutage' | 'StormDamage' {
  const lower = text.toLowerCase();
  if (lower.includes('flood') || lower.includes('water') || lower.includes('inundat') || lower.includes('rain')) return 'FlashFlood';
  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('burn') || lower.includes('wildfire')) return 'Wildfire';
  if (lower.includes('debris') || lower.includes('rock') || lower.includes('mud') || lower.includes('slide')) return 'Debris';
  if (lower.includes('erosion') || lower.includes('washout') || lower.includes('sinkhole')) return 'Erosion';
  if (lower.includes('power') || lower.includes('electricity') || lower.includes('outage') || lower.includes('blackout')) return 'PowerOutage';
  if (lower.includes('storm') || lower.includes('wind') || lower.includes('gale') || lower.includes('lightning')) return 'StormDamage';
  if (lower.includes('block') || lower.includes('closed') || lower.includes('traffic') || lower.includes('detour')) return 'Traffic';
  if (lower.includes('bridge') || lower.includes('collapse') || lower.includes('cracked') || lower.includes('infrastructure')) return 'Infrastructure';
  return 'FlashFlood'; // default fallback
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const socialSignalService = {
  /**
   * Returns filtered, geofenced, and deduplicated crowd social reports.
   * Leverages real user store submissions, completely offline-capable.
   */
  getReports: async (): Promise<SocialSignalResponse> => {
    try {
      const startTime = Date.now();

      // Dynamically load real user-submitted reports to avoid circular imports
      let realReports: FloodReport[] = [];
      try {
        const { useSocialSignalStore } = require('../store/socialSignalStore');
        realReports = useSocialSignalStore.getState().reports || [];
      } catch (err) {
        console.warn('[SocialSignalService] Could not resolve socialSignalStore:', err);
      }

      // 1. Geofence filtering: only return reports within 5km of user's active GPS coordinate
      const userLoc = useLocationStore.getState().currentLocation;
      let filtered = [...realReports];
      
      if (userLoc && userLoc.latitude !== 0 && userLoc.longitude !== 0) {
        filtered = filtered.filter(report => {
          const distance = getDistanceKm(
            userLoc.latitude,
            userLoc.longitude,
            report.coordinates.lat,
            report.coordinates.lng
          );
          return distance <= 5.0; // 5km radius threshold
        });
      }

      // 2. Duplicate suppression, text-deduplication, and categorization auto-mapping
      const seenTexts = new Set<string>();
      const processed: FloodReport[] = [];
      
      // Sort newest first
      const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

      for (const report of sorted) {
        const textKey = report.text.trim().toLowerCase();
        
        // Suppress exact or near-identical text submissions
        if (seenTexts.has(textKey)) {
          continue;
        }

        // Add auto hazard categorization mapping
        const category = deduceHazardType(report.text);
        
        // Assign credibility weighting based on source
        let trustScore = 0.5; // default anonymous
        if (report.source === 'autonomous-dispatch-agent') trustScore = 1.0;
        else if (report.source === 'official-feed' || report.source === 'sensor-network') trustScore = 0.9;
        else if (report.source === 'registered-volunteer') trustScore = 0.85;
        else if (report.source === 'mobile-app-user') trustScore = 0.7;

        seenTexts.add(textKey);
        processed.push({
          ...report,
          category,
          trustScore
        });
      }

      const latency = Date.now() - startTime;
      console.log(`[SocialSignalService] Loaded and filtered ${processed.length} reports in ${latency}ms`);

      return {
        reports: processed,
        count: processed.length,
        source: 'real-user-feed',
      };
    } catch (error: any) {
      console.error('[SocialSignalService] Error loading reports:', error.message ?? error);
      return { reports: [], count: 0, source: 'real-user-feed' };
    }
  },
};
