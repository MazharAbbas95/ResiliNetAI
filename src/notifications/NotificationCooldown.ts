const COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

interface AlertLog {
  [key: string]: number;
}

const alertRegistry: AlertLog = {};

export const NotificationCooldown = {
  shouldNotify: (hazardId: string, state: string): boolean => {
    const key = `${hazardId}_${state}`;
    const now = Date.now();
    const lastAlert = alertRegistry[key];

    if (!lastAlert || (now - lastAlert) > COOLDOWN_PERIOD_MS) {
      alertRegistry[key] = now;
      return true;
    }

    return false;
  }
};
