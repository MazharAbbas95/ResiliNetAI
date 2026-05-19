export interface AlertMemoryState {
  alertId: string;
  hazardId?: string;
  sourceAgent: string;
  escalationLevel: number;
  triggerCount: number;
  dismissed: boolean;
  dismissedAt?: number;
  timestamps: number[];
  riskCategory?: string;
  notes?: string[];
}

export class AlertMemory {
  private alerts: Map<string, AlertMemoryState> = new Map();

  public getAlert(alertId: string): AlertMemoryState | undefined {
    return this.alerts.get(alertId);
  }

  public getAllAlerts(): Record<string, AlertMemoryState> {
    const result: Record<string, AlertMemoryState> = {};
    this.alerts.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  public recordAlertTrigger(
    alertId: string,
    sourceAgent: string,
    hazardId?: string,
    riskCategory?: string
  ): void {
    const existing = this.alerts.get(alertId);
    const now = Date.now();

    if (existing) {
      this.alerts.set(alertId, {
        ...existing,
        triggerCount: existing.triggerCount + 1,
        timestamps: [...existing.timestamps, now],
        dismissed: false, // Reactivate alert if re-triggered
        dismissedAt: undefined,
        riskCategory: riskCategory || existing.riskCategory
      });
    } else {
      this.alerts.set(alertId, {
        alertId,
        sourceAgent,
        hazardId,
        escalationLevel: 0,
        triggerCount: 1,
        dismissed: false,
        timestamps: [now],
        riskCategory,
        notes: [`Triggered by ${sourceAgent}`]
      });
    }
  }

  public escalateAlert(alertId: string, reason?: string): void {
    const existing = this.alerts.get(alertId);
    if (existing) {
      existing.escalationLevel += 1;
      if (!existing.notes) existing.notes = [];
      existing.notes.push(`Escalated to level ${existing.escalationLevel}${reason ? `: ${reason}` : ''}`);
    }
  }

  public dismissAlert(alertId: string): void {
    const existing = this.alerts.get(alertId);
    if (existing) {
      existing.dismissed = true;
      existing.dismissedAt = Date.now();
      if (!existing.notes) existing.notes = [];
      existing.notes.push('Dismissed by operator/agent');
    }
  }

  public isRateLimited(alertId: string, maxTriggers: number, timeWindowMs: number): boolean {
    const existing = this.alerts.get(alertId);
    if (!existing) return false;

    const now = Date.now();
    const recentTriggers = existing.timestamps.filter(t => now - t < timeWindowMs);
    return recentTriggers.length >= maxTriggers;
  }

  public clear(): void {
    this.alerts.clear();
  }
}
