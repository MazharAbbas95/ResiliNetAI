/**
 * Recursively removes all `undefined` values from an object or array to prevent Firestore write crashes.
 * Enforces schema safety and clean payload objects.
 */
export function sanitizePayload<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item)) as any;
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(data as any)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        sanitized[key] = sanitizePayload(val);
      }
    }
    return sanitized;
  }

  return data;
}
