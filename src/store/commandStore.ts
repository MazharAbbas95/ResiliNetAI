import { create } from 'zustand';

export interface CommandEntry {
  id: string;
  timestamp: number;
  command: string;
  response: string;
  status: 'executing' | 'success' | 'warning' | 'error';
}

interface CommandState {
  commands: CommandEntry[];
  addCommand: (command: string, response: string, status?: CommandEntry['status']) => void;
  clearCommands: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  commands: [],
  addCommand: (command, response, status = 'success') => set((state) => ({
    commands: [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      command,
      response,
      status
    }, ...state.commands].slice(0, 50)
  })),
  clearCommands: () => set({ commands: [] }),
}));
