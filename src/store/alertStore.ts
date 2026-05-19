import { create } from 'zustand';
import { Alert } from '@appTypes/intelligence';

interface AlertState {
  activeAlerts: Alert[];
  setActiveAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: [],
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts }),
  addAlert: (alert) => set((state) => ({ 
    activeAlerts: [alert, ...state.activeAlerts].sort((a, b) => b.sentAt - a.sentAt) 
  })),
  removeAlert: (id) => set((state) => ({ 
    activeAlerts: state.activeAlerts.filter(a => a.id !== id) 
  })),
  clearAlerts: () => set({ activeAlerts: [] }),
}));
