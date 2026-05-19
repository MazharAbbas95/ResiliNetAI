import path from 'path';
import fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RawFloodReport {
  id: string;
  text: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  severity: string;
  timestamp: number;
  source: string;
}

export interface NormalizedFloodReport {
  id: string;
  text: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  severity: SignalSeverity;
  timestamp: number;
  source: string;
}

export interface SocialSignalFilters {
  severity?: string;
  location?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_SEVERITIES: SignalSeverity[] = ['low', 'medium', 'high', 'critical'];
const DATA_FILE = path.join(__dirname, '../data/mockFloodReports.json');

// ─── Service ──────────────────────────────────────────────────────────────────

class SocialSignalService {
  private reports: NormalizedFloodReport[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: RawFloodReport[] = JSON.parse(raw);

      let invalid = 0;
      this.reports = parsed
        .filter((r) => {
          const ok =
            r.id &&
            r.text &&
            r.locationName &&
            typeof r.coordinates?.lat === 'number' &&
            typeof r.coordinates?.lng === 'number' &&
            typeof r.timestamp === 'number' &&
            VALID_SEVERITIES.includes(r.severity as SignalSeverity);

          if (!ok) {
            invalid++;
            console.warn(`[SocialSignalService] Invalid report skipped: ${r.id ?? 'unknown'}`);
          }
          return ok;
        })
        .map((r) => ({
          id: r.id.trim(),
          text: r.text.trim(),
          locationName: r.locationName.trim(),
          coordinates: { lat: r.coordinates.lat, lng: r.coordinates.lng },
          severity: r.severity as SignalSeverity,
          timestamp: r.timestamp,
          source: r.source ?? 'mock-social',
        }));

      console.log(`[SocialSignalService] Loaded ${this.reports.length} reports | ${invalid} invalid skipped`);
    } catch (err) {
      console.error('[SocialSignalService] Failed to load mock data:', err);
      this.reports = [];
    }
  }

  /**
   * Returns filtered and normalized reports.
   * Supports optional severity and location filtering.
   */
  getReports(filters: SocialSignalFilters = {}): NormalizedFloodReport[] {
    let results = [...this.reports];

    if (filters.severity) {
      const sev = filters.severity.toLowerCase();
      results = results.filter((r) => r.severity === sev);
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((r) => r.locationName.toLowerCase().includes(loc));
    }

    // Sort newest first
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Returns all reports sorted by timestamp descending.
   * For future AI pipeline ingestion.
   */
  getAllReports(): NormalizedFloodReport[] {
    return this.getReports();
  }
}

export const socialSignalService = new SocialSignalService();
