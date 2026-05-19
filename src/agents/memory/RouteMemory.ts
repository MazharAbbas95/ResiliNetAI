export interface RouteMemoryState {
  routeId: string;
  attemptsCount: number;
  lastRecalculated: number;
  recalculationHistory: Array<{
    timestamp: number;
    success: boolean;
    reason?: string;
  }>;
  rejectedRoutes: string[]; // Unique identifiers or paths of rejected/unsafe routes
  safeCorridors: string[]; // List of successful/safe routes identified
  unsafeCorridors: string[]; // List of corridors identified as unsafe
  routeConfidence: number;
}

export class RouteMemory {
  private routeState: Map<string, RouteMemoryState> = new Map();

  public getRouteState(routeId: string): RouteMemoryState | undefined {
    return this.routeState.get(routeId);
  }

  public getAllRoutes(): Record<string, RouteMemoryState> {
    const result: Record<string, RouteMemoryState> = {};
    this.routeState.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  public recordRerouteAttempt(
    routeId: string,
    success: boolean,
    details?: {
      reason?: string;
      rejectedRoute?: string;
      safeCorridor?: string;
      unsafeCorridor?: string;
      confidence?: number;
    }
  ): void {
    const existing = this.routeState.get(routeId);
    const now = Date.now();

    const newRecalc = {
      timestamp: now,
      success,
      reason: details?.reason
    };

    if (existing) {
      const rejected = [...existing.rejectedRoutes];
      if (details?.rejectedRoute && !rejected.includes(details.rejectedRoute)) {
        rejected.push(details.rejectedRoute);
      }

      const safe = [...existing.safeCorridors];
      if (details?.safeCorridor && !safe.includes(details.safeCorridor)) {
        safe.push(details.safeCorridor);
      }

      const unsafe = [...existing.unsafeCorridors];
      if (details?.unsafeCorridor && !unsafe.includes(details.unsafeCorridor)) {
        unsafe.push(details.unsafeCorridor);
      }

      this.routeState.set(routeId, {
        ...existing,
        attemptsCount: existing.attemptsCount + 1,
        lastRecalculated: now,
        recalculationHistory: [...existing.recalculationHistory, newRecalc],
        rejectedRoutes: rejected,
        safeCorridors: safe,
        unsafeCorridors: unsafe,
        routeConfidence: details?.confidence !== undefined ? details.confidence : existing.routeConfidence
      });
    } else {
      this.routeState.set(routeId, {
        routeId,
        attemptsCount: 1,
        lastRecalculated: now,
        recalculationHistory: [newRecalc],
        rejectedRoutes: details?.rejectedRoute ? [details.rejectedRoute] : [],
        safeCorridors: details?.safeCorridor ? [details.safeCorridor] : [],
        unsafeCorridors: details?.unsafeCorridor ? [details.unsafeCorridor] : [],
        routeConfidence: details?.confidence !== undefined ? details.confidence : 1.0
      });
    }
  }

  public clear(): void {
    this.routeState.clear();
  }
}
