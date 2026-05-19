import { Agent, AgentTask, AgentResponse } from '../core/AgentTypes';
import { NormalizedSignal } from './NormalizationAgent';

export interface CrowdUnionResult {
  uniqueReportCount: number;
  clusteredSignals: NormalizedSignal[];
  spamRejectedCount: number;
  trustScore: number; // 0.0 - 1.0
  dominantType: string;
  locationConsistency: boolean;
  sourceBreakdown: Record<string, number>;
}

const SPAM_PHRASES = ['test', 'hello', 'hi', 'ok', 'yes', 'no', 'thanks', 'lol', 'haha', '???'];

function isSpam(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return SPAM_PHRASES.some(p => lower === p || lower.startsWith(p + ' '));
}

function computeDeduplicationSimilarity(a: NormalizedSignal, b: NormalizedSignal): number {
  let score = 0;
  if (a.type === b.type) score += 0.4;
  if (a.location === b.location && a.location !== 'Unknown Location') score += 0.3;
  const sharedKeywords = a.entityKeywords.filter(k => b.entityKeywords.includes(k));
  score += Math.min(0.3, sharedKeywords.length * 0.15);
  return score;
}

export class CrowdSourcedUnionAgent implements Agent {
  public id = 'crowd';
  public name = 'CROWD';

  public async execute(task: AgentTask): Promise<AgentResponse> {
    const actions: string[] = [];
    const reasoning: string[] = [];

    // Gather all available social signals from store + task payload
    let existingSignals: NormalizedSignal[] = [];
    try {
      const { useSocialSignalStore } = require('../../store/socialSignalStore');
      const reports = useSocialSignalStore.getState().reports || [];
      const lat = task.payload?.lat ?? 0;
      const lng = task.payload?.lng ?? 0;
      existingSignals = reports
        .filter((r: any) => {
          if (!r.coordinates) return false;
          const dLat = Math.abs(r.coordinates.lat - lat);
          const dLng = Math.abs(r.coordinates.lng - lng);
          return dLat < 0.1 && dLng < 0.1;
        })
        .map((r: any): NormalizedSignal => ({
          type: 'general_observation',
          condition: r.text?.split(' ')[0]?.toLowerCase() ?? 'unknown',
          location: r.locationName ?? 'Unknown Location',
          severityIndicators: [],
          entityKeywords: [],
          rawConfidence: (r.trustScore ?? 0.4),
          sourceType: r.source === 'user-report' ? 'user_input' : 'social_report',
          verified: false,
          timestamp: (r.timestamp ?? Date.now() / 1000) * 1000,
          rawInput: r.text ?? '',
        }));
    } catch (e) {
      reasoning.push('Social signal store unavailable. Proceeding with pipeline input signal only.');
    }

    // Include the signal from the current task payload (just normalized)
    const pipelineSignal = task.payload?.normalizedSignal as NormalizedSignal | undefined;
    const allSignals = pipelineSignal ? [pipelineSignal, ...existingSignals] : existingSignals;

    reasoning.push(`Total incoming signals: ${allSignals.length}`);

    // Step 1: Spam rejection
    let spamRejectedCount = 0;
    const validSignals = allSignals.filter(s => {
      if (isSpam(s.rawInput)) {
        spamRejectedCount++;
        return false;
      }
      return true;
    });
    actions.push(`Spam filter rejected ${spamRejectedCount} signal(s).`);

    // Step 2: Deduplication clustering
    const clusters: NormalizedSignal[][] = [];
    for (const sig of validSignals) {
      let added = false;
      for (const cluster of clusters) {
        if (cluster[0] && computeDeduplicationSimilarity(sig, cluster[0]) > 0.5) {
          cluster.push(sig);
          added = true;
          break;
        }
      }
      if (!added) clusters.push([sig]);
    }
    const uniqueReportCount = clusters.length;
    actions.push(`Clustered into ${uniqueReportCount} unique signal group(s) after deduplication.`);

    // Step 3: Trust scoring — weighted by source diversity and report count
    // More unique clusters from different sources → higher trust
    const sourceTypes = new Set(validSignals.map(s => s.sourceType));
    const sourceDiversityBonus = Math.min(0.3, (sourceTypes.size - 1) * 0.15);
    const countBonus = Math.min(0.4, (uniqueReportCount - 1) * 0.12);
    const avgRawConfidence = validSignals.length > 0
      ? validSignals.reduce((acc, s) => acc + s.rawConfidence, 0) / validSignals.length
      : 0.10;
    
    const trustScore = Math.min(1.0, avgRawConfidence * 0.3 + countBonus + sourceDiversityBonus + (uniqueReportCount > 0 ? 0.10 : 0));

    // Step 4: Dominant type detection
    const typeCounts: Record<string, number> = {};
    for (const s of validSignals) {
      typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1;
    }
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

    // Step 5: Location consistency check
    const locations = validSignals.map(s => s.location).filter(l => l !== 'Unknown Location');
    const uniqueLocations = new Set(locations);
    const locationConsistency = uniqueLocations.size <= 2;

    const result: CrowdUnionResult = {
      uniqueReportCount,
      clusteredSignals: validSignals,
      spamRejectedCount,
      trustScore,
      dominantType,
      locationConsistency,
      sourceBreakdown: typeCounts,
    };

    reasoning.push(`Unique signal clusters: ${uniqueReportCount} | Trust Score: ${(trustScore * 100).toFixed(0)}%`);
    reasoning.push(`Source diversity: ${[...sourceTypes].join(', ')} | Location consistent: ${locationConsistency}`);

    // A single unverified user report = very low trust
    if (uniqueReportCount === 1 && validSignals[0]?.sourceType === 'user_input') {
      reasoning.push('CAUTION: Only 1 source report found. Trust extremely limited. Single-source input cannot establish ground truth.');
    }

    return {
      success: validSignals.length > 0,
      confidence: trustScore,
      requiresVerification: true,
      requiresEscalation: false,
      nextAgent: 'SENTIMENT',
      reasoning,
      actions,
      memoryUpdates: [{ type: 'CROWD_UNION_RESULT', result }],
      eventType: 'SIGNAL_VALIDATED',
      timestamp: Date.now(),
    };
  }
}

export const crowdSourcedUnionAgent = new CrowdSourcedUnionAgent();
