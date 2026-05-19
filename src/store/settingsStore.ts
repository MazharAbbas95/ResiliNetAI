import { create } from 'zustand';

interface SettingsState {
  isCriticalResponseActive: boolean;
  isEmergencyAlertActive: boolean;
  isLiveGpsTrackingActive: boolean;
  isIntelligentAutoRefreshActive: boolean;
  isBackgroundSyncActive: boolean;

  toggleCriticalResponse: () => void;
  toggleEmergencyAlert: () => void;
  toggleLiveGpsTracking: () => void;
  toggleIntelligentAutoRefresh: () => void;
  toggleBackgroundSync: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isCriticalResponseActive: false,
  isEmergencyAlertActive: true,
  isLiveGpsTrackingActive: true,
  isIntelligentAutoRefreshActive: true,
  isBackgroundSyncActive: true,

  toggleCriticalResponse: () => set((state) => ({ isCriticalResponseActive: !state.isCriticalResponseActive })),
  toggleEmergencyAlert: () => set((state) => ({ isEmergencyAlertActive: !state.isEmergencyAlertActive })),
  toggleLiveGpsTracking: () => set((state) => ({ isLiveGpsTrackingActive: !state.isLiveGpsTrackingActive })),
  toggleIntelligentAutoRefresh: () => set((state) => ({ isIntelligentAutoRefreshActive: !state.isIntelligentAutoRefreshActive })),
  toggleBackgroundSync: () => set((state) => ({ isBackgroundSyncActive: !state.isBackgroundSyncActive })),
  resetSettings: () => set({
    isCriticalResponseActive: false,
    isEmergencyAlertActive: true,
    isLiveGpsTrackingActive: true,
    isIntelligentAutoRefreshActive: true,
    isBackgroundSyncActive: true,
  })
}));
