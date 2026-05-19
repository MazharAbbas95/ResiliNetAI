export const JsonValidator = {
  validate: (payload: any, schema: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!payload || typeof payload !== 'object') {
      return { isValid: false, errors: ['Payload is not a valid JSON object'] };
    }

    if (schema === 'hazard') {
      if (!payload.severity) errors.push('Missing required field: severity');
      if (!payload.reportType) errors.push('Missing required field: reportType');
      
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (payload.severity && !validSeverities.includes(payload.severity)) {
        errors.push(`Invalid severity level: ${payload.severity}`);
      }
    }

    if (schema === 'location') {
      if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
        errors.push('Coordinates must be numeric');
      }
      if (payload.lat < -90 || payload.lat > 90) errors.push('Latitude out of range');
      if (payload.lng < -180 || payload.lng > 180) errors.push('Longitude out of range');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  repair: (payload: any, schema: string): any => {
    // Attempt basic structural repairs
    const repaired = { ...payload };
    
    if (schema === 'hazard') {
      if (!repaired.severity) repaired.severity = 'medium';
      if (!repaired.validated) repaired.validated = false;
    }
    
    return repaired;
  }
};
