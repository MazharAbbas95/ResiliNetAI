import { create } from 'zustand';

export type SimStepStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface SimPipelineLog {
  id: string;
  timestamp: number;
  agent: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface SimAgentStep {
  id: string;
  name: string;
  description: string;
  status: SimStepStatus;
  confidence?: number;
  reasoning?: string;
  latencyMs?: number;
}

export interface SimHazard {
  id: string;
  type: string;
  center: { latitude: number; longitude: number };
  radius: number;
  severity: 'low' | 'medium' | 'critical';
  color: string;
}

export interface SimRoute {
  id: string;
  type: 'blocked' | 'safe';
  coordinates: { latitude: number; longitude: number }[];
}

export interface SimShelter {
  id: string;
  name: string;
  coordinate: { latitude: number; longitude: number };
  capacity: number;
  occupancy: number;
  eta: string;
}

export interface SimAlert {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  timestamp: number;
}

export interface SimResponder {
  id: string;
  type: 'rescue' | 'ambulance' | 'fire' | 'location' | 'family';
  coordinate: { latitude: number; longitude: number };
  targetCoordinate: { latitude: number; longitude: number };
  status: 'dispatched' | 'en_route' | 'arrived';
  eta: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  hazardType: string;
  rawInput: string;
  structuredOutput: {
    hazard: string;
    severity: string;
    confidence: number;
    location: string;
    verification: string;
  };
  mockLogs: { 
    agent: string; 
    message: string; 
    delay: number; 
    status?: 'info' | 'success' | 'warning' | 'error';
    triggerEvent?: 'SHOW_HAZARD' | 'SHOW_ROUTES' | 'SHOW_SHELTERS' | 'BROADCAST_ALERT' | 'EXPAND_HAZARD';
  }[];
  initialRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  hazards: SimHazard[]; // Initial hazards
  expandedHazards?: SimHazard[]; // Hazards after prediction/expansion
  routes: SimRoute[];
  shelters: SimShelter[];
  alerts: string[];
}

// ------------------------------------------------------------------
// SCENARIO DEFINITIONS
// ------------------------------------------------------------------

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'FLASH_FLOOD',
    title: 'Flash Flood Simulation',
    hazardType: 'FLASH_FLOOD',
    rawInput: 'Heavy rain causing flooding near the Milton highway.',
    structuredOutput: {
      hazard: 'FLASH_FLOOD',
      severity: 'HIGH',
      confidence: 0.87,
      location: 'Milton',
      verification: 'PASSED'
    },
    initialRegion: { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.05, longitudeDelta: 0.05 },
    hazards: [
      { id: 'h1', type: 'FLASH_FLOOD', center: { latitude: 37.78825, longitude: -122.4324 }, radius: 800, severity: 'medium', color: 'rgba(0, 230, 255, 0.5)' }
    ],
    expandedHazards: [
      { id: 'h1_expanded', type: 'FLASH_FLOOD', center: { latitude: 37.78825, longitude: -122.4324 }, radius: 1500, severity: 'critical', color: 'rgba(255, 59, 48, 0.5)' }
    ],
    routes: [
      {
        id: 'r1_blocked',
        type: 'blocked',
        coordinates: [
          { latitude: 37.78000, longitude: -122.4400 },
          { latitude: 37.78825, longitude: -122.4324 },
          { latitude: 37.79000, longitude: -122.4200 }
        ]
      },
      {
        id: 'r2_safe',
        type: 'safe',
        coordinates: [
          { latitude: 37.78000, longitude: -122.4400 },
          { latitude: 37.77500, longitude: -122.4300 },
          { latitude: 37.78500, longitude: -122.4100 },
          { latitude: 37.79000, longitude: -122.4200 }
        ]
      }
    ],
    shelters: [
      { id: 's1', name: 'Milton High School', coordinate: { latitude: 37.77500, longitude: -122.4300 }, capacity: 500, occupancy: 120, eta: '4 min' },
      { id: 's2', name: 'Community Center', coordinate: { latitude: 37.78500, longitude: -122.4100 }, capacity: 200, occupancy: 190, eta: '7 min' }
    ],
    alerts: [
      "⚠️ Flash flood risk increasing near Milton highway.",
      "🛡️ Safe corridor generated. Avoid highway.",
      "🚨 Immediate evacuation recommended."
    ],
    mockLogs: [
      { agent: 'NORMALIZATION', message: 'Converting raw input to structured intelligence...', delay: 500 },
      { agent: 'CROWD', message: 'Aggregating 12 nearby reports. High corroboration.', delay: 1500 },
      { agent: 'SENTIMENT', message: 'Detected high panic urgency in localized area.', delay: 2500 },
      { agent: 'VERIFICATION', message: 'Environmental telemetry matched API thresholds.', delay: 3500, status: 'success' },
      { agent: 'ANALYST', message: 'Flood escalation probability: 82%.', delay: 4500, triggerEvent: 'SHOW_HAZARD' },
      { agent: 'SHIELD', message: 'Verification valid. False positive suppressed.', delay: 5500 },
      { agent: 'PREDICTIVE', message: 'Expansion risk critical within 2 hours.', delay: 6500, triggerEvent: 'EXPAND_HAZARD' },
      { agent: 'TACTICAL', message: 'Strategy recommended: EVACUATION_PREP.', delay: 7500, triggerEvent: 'SHOW_SHELTERS' },
      { agent: 'ROUTING', message: 'Safe corridor generated for Milton highway.', delay: 8500, status: 'success', triggerEvent: 'SHOW_ROUTES' },
      { agent: 'PRIORITY', message: 'Priority P1_HIGH assigned. Ready for broadcast.', delay: 9500, status: 'success', triggerEvent: 'BROADCAST_ALERT' }
    ]
  },
  {
    id: 'WILDFIRE',
    title: 'Wildfire Expansion',
    hazardType: 'WILDFIRE',
    rawInput: 'Strong smoke and intense heat reported near industrial sector.',
    structuredOutput: {
      hazard: 'WILDFIRE',
      severity: 'CRITICAL',
      confidence: 0.94,
      location: 'Industrial Sector',
      verification: 'PASSED'
    },
    initialRegion: { latitude: 34.0522, longitude: -118.2437, latitudeDelta: 0.1, longitudeDelta: 0.1 },
    hazards: [
      { id: 'w1', type: 'WILDFIRE', center: { latitude: 34.0522, longitude: -118.2437 }, radius: 1200, severity: 'critical', color: 'rgba(255, 149, 0, 0.6)' }
    ],
    expandedHazards: [
      { id: 'w1_expanded', type: 'WILDFIRE', center: { latitude: 34.0522, longitude: -118.2437 }, radius: 3000, severity: 'critical', color: 'rgba(255, 59, 48, 0.6)' }
    ],
    routes: [
      {
        id: 'wr1_blocked',
        type: 'blocked',
        coordinates: [
          { latitude: 34.0400, longitude: -118.2500 },
          { latitude: 34.0522, longitude: -118.2437 },
          { latitude: 34.0600, longitude: -118.2300 }
        ]
      },
      {
        id: 'wr2_safe',
        type: 'safe',
        coordinates: [
          { latitude: 34.0400, longitude: -118.2500 },
          { latitude: 34.0300, longitude: -118.2400 },
          { latitude: 34.0450, longitude: -118.2100 },
          { latitude: 34.0600, longitude: -118.2300 }
        ]
      }
    ],
    shelters: [
      { id: 'ws1', name: 'Downtown Arena', coordinate: { latitude: 34.0450, longitude: -118.2100 }, capacity: 1500, occupancy: 400, eta: '8 min' }
    ],
    alerts: [
      "⚠️ Wildfire detected near industrial sector.",
      "🚨 Immediate evacuation required. Seek shelter."
    ],
    mockLogs: [
      { agent: 'NORMALIZATION', message: 'Parsing smoke and heat reports...', delay: 500 },
      { agent: 'CROWD', message: 'Deduplicating 45 unique sensor hits.', delay: 1500 },
      { agent: 'SENTIMENT', message: 'Panic levels CRITICAL. Evacuation requested.', delay: 2500 },
      { agent: 'VERIFICATION', message: 'Thermal imaging confirms active combustion.', delay: 3500, status: 'success' },
      { agent: 'ANALYST', message: 'Wildfire expansion highly likely due to wind.', delay: 4500, triggerEvent: 'SHOW_HAZARD' },
      { agent: 'SHIELD', message: 'Multiple source confirmation. Shield passed.', delay: 5500 },
      { agent: 'PREDICTIVE', message: 'Modeling wind patterns: 40km/h spread.', delay: 6500, triggerEvent: 'EXPAND_HAZARD' },
      { agent: 'TACTICAL', message: 'Strategy: IMMEDIATE_EVACUATION.', delay: 7500, triggerEvent: 'SHOW_SHELTERS' },
      { agent: 'ROUTING', message: 'Computing multi-directional escape routes...', delay: 8500, triggerEvent: 'SHOW_ROUTES' },
      { agent: 'PRIORITY', message: 'Priority P0_CRITICAL assigned. Escalate now.', delay: 9500, status: 'success', triggerEvent: 'BROADCAST_ALERT' }
    ]
  },
  {
    id: 'FALSE_POSITIVE',
    title: 'Mass Panic (False Positive)',
    hazardType: 'UNKNOWN',
    rawInput: 'An asteroid just hit downtown and destroyed the entire city!',
    structuredOutput: {
      hazard: 'UNKNOWN_THREAT',
      severity: 'CRITICAL',
      confidence: 0.12,
      location: 'Downtown',
      verification: 'FAILED'
    },
    initialRegion: { latitude: 40.7128, longitude: -74.0060, latitudeDelta: 0.05, longitudeDelta: 0.05 },
    hazards: [
      { id: 'f1', type: 'UNKNOWN_THREAT', center: { latitude: 40.7128, longitude: -74.0060 }, radius: 1000, severity: 'critical', color: 'rgba(255, 59, 48, 0.6)' }
    ],
    expandedHazards: [
      { id: 'f1_expanded', type: 'UNKNOWN_THREAT', center: { latitude: 40.7128, longitude: -74.0060 }, radius: 2500, severity: 'critical', color: 'rgba(255, 59, 48, 0.6)' }
    ],
    routes: [
      {
        id: 'fr1_blocked',
        type: 'blocked',
        coordinates: [
          { latitude: 40.7000, longitude: -74.0100 },
          { latitude: 40.7128, longitude: -74.0060 },
          { latitude: 40.7200, longitude: -74.0000 }
        ]
      }
    ],
    shelters: [
      { id: 'fs1', name: 'Metro Safe Zone', coordinate: { latitude: 40.7200, longitude: -74.0000 }, capacity: 2000, occupancy: 50, eta: '12 min' }
    ],
    alerts: ["ℹ️ System: Threat analysis complete. FALSE POSITIVE confirmed."],
    mockLogs: [
      { agent: 'NORMALIZATION', message: 'Parsing extreme claim...', delay: 500 },
      { agent: 'CROWD', message: 'Single source report. No corroboration found.', delay: 1500, status: 'warning' },
      { agent: 'SENTIMENT', message: 'Highly emotional, hyperbolic text detected.', delay: 2500 },
      { agent: 'VERIFICATION', message: 'Seismic and environmental sensors show normal.', delay: 3500, status: 'warning' },
      { agent: 'ANALYST', message: 'Claim unlikely. Probability 0.001%.', delay: 4500, triggerEvent: 'SHOW_HAZARD' },
      { agent: 'SHIELD', message: 'Potential false positive detected. Verifying...', delay: 5500, status: 'warning' },
      { agent: 'PREDICTIVE', message: 'Modeling potential asteroid impact radius...', delay: 6500, triggerEvent: 'EXPAND_HAZARD' },
      { agent: 'TACTICAL', message: 'Strategy: PASSIVE_MONITORING. No immediate action.', delay: 7500, triggerEvent: 'SHOW_SHELTERS' },
      { agent: 'ROUTING', message: 'Computing escape routes... none required.', delay: 8500, triggerEvent: 'SHOW_ROUTES' },
      { agent: 'PRIORITY', message: 'FALSE POSITIVE BLOCKED. Escalation suppressed.', delay: 9500, status: 'error', triggerEvent: 'BROADCAST_ALERT' }
    ]
  }
];

const INITIAL_STEPS: SimAgentStep[] = [
  { id: 'NORMALIZATION', name: 'NORMALIZATION', description: 'Convert raw data to structured', status: 'idle' },
  { id: 'CROWD', name: 'CROWD UNION', description: 'Deduplicate & score trustworthiness', status: 'idle' },
  { id: 'SENTIMENT', name: 'SENTIMENT', description: 'Analyze emotional urgency', status: 'idle' },
  { id: 'VERIFICATION', name: 'VERIFICATION FUSION', description: 'Verify API & telemetry', status: 'idle' },
  { id: 'ANALYST', name: 'ANALYST', description: 'Strategic interpretation', status: 'idle' },
  { id: 'SHIELD', name: 'SHIELD MODULE', description: 'Prevent false positives', status: 'idle' },
  { id: 'PREDICTIVE', name: 'PREDICTIVE SIMULATOR', description: 'Model future outcomes', status: 'idle' },
  { id: 'TACTICAL', name: 'TACTICAL ANALYZER', description: 'Recommend strategy', status: 'idle' },
  { id: 'ROUTING', name: 'NAVIGATION ROUTER', description: 'Compute evacuation routing', status: 'idle' },
  { id: 'PRIORITY', name: 'COORDINATION PRIORITY', description: 'Assign final response priority', status: 'idle' },
];

interface SimulationDemoState {
  isActive: boolean;
  selectedScenario: DemoScenario;
  scenarios: DemoScenario[];
  steps: SimAgentStep[];
  logs: SimPipelineLog[];
  simulationProgress: number; // 0 to 100

  // Map state
  activeHazards: SimHazard[];
  activeRoutes: SimRoute[];
  activeShelters: SimShelter[];
  activeAlerts: SimAlert[];
  activeResponders: SimResponder[];
  predictiveTimeline: 'NOW' | '+30M' | '+1H' | '+2H';

  // Actions
  selectScenario: (scenarioId: string) => void;
  runSimulation: () => void;
  resetSimulation: () => void;
  stopSimulation: () => void;
  dispatchResponder: (type: 'rescue' | 'ambulance' | 'fire' | 'location' | 'family', origin: {latitude: number, longitude: number}, target: {latitude: number, longitude: number}) => void;
}

// Keep a reference to any active timeouts to allow stopping
let activeTimeouts: NodeJS.Timeout[] = [];

export const useSimulationDemoStore = create<SimulationDemoState>((set, get) => ({
  isActive: false,
  scenarios: DEMO_SCENARIOS,
  selectedScenario: DEMO_SCENARIOS[0],
  steps: INITIAL_STEPS,
  logs: [],
  simulationProgress: 0,
  
  activeHazards: [],
  activeRoutes: [],
  activeShelters: [],
  activeAlerts: [],
  activeResponders: [],
  predictiveTimeline: 'NOW',

  selectScenario: (id) => {
    const scenario = get().scenarios.find(s => s.id === id);
    if (scenario) {
      set({ selectedScenario: scenario });
      get().resetSimulation();
    }
  },

  resetSimulation: () => {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
    set({
      isActive: false,
      steps: INITIAL_STEPS.map(s => ({ ...s, status: 'idle' as SimStepStatus, confidence: undefined, reasoning: undefined })),
      logs: [],
      simulationProgress: 0,
      activeHazards: [],
      activeRoutes: [],
      activeShelters: [],
      activeAlerts: [],
      activeResponders: [],
      predictiveTimeline: 'NOW'
    });
  },

  stopSimulation: () => {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
    set({ isActive: false });
  },

  runSimulation: () => {
    const { selectedScenario, resetSimulation } = get();
    resetSimulation();
    
    set({ isActive: true, simulationProgress: 5 });

    let cumulativeDelay = 0;
    
    // Simulate pipeline progression
    selectedScenario.mockLogs.forEach((logItem, index) => {
      cumulativeDelay = logItem.delay;

      const timeout = setTimeout(() => {
        set((state) => {
          // Add Log
          const newLog: SimPipelineLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            agent: logItem.agent,
            message: logItem.message,
            status: logItem.status || 'info'
          };
          
          // Trigger visual map events based on the log's triggerEvent
          let newHazards = [...state.activeHazards];
          let newRoutes = [...state.activeRoutes];
          let newShelters = [...state.activeShelters];
          let newAlerts = [...state.activeAlerts];
          let newTimeline = state.predictiveTimeline;

          if (logItem.triggerEvent === 'SHOW_HAZARD') {
            newHazards = selectedScenario.hazards;
          } else if (logItem.triggerEvent === 'EXPAND_HAZARD') {
            newHazards = selectedScenario.expandedHazards || selectedScenario.hazards;
            newTimeline = '+2H';
          } else if (logItem.triggerEvent === 'SHOW_ROUTES') {
            newRoutes = selectedScenario.routes;
          } else if (logItem.triggerEvent === 'SHOW_SHELTERS') {
            newShelters = selectedScenario.shelters;
          } else if (logItem.triggerEvent === 'BROADCAST_ALERT') {
            selectedScenario.alerts.forEach((msg, i) => {
              newAlerts.push({
                id: Math.random().toString(36),
                message: msg,
                type: 'warning',
                timestamp: Date.now() + i * 1000
              });
            });
          }

          // Update Steps
          const newSteps = state.steps.map(step => {
            if (step.id === logItem.agent) {
              const status: SimStepStatus = logItem.status === 'error' ? 'error' : 'completed';
              return {
                ...step,
                status,
                confidence: Math.round(70 + Math.random() * 25), // Fake confidence
                reasoning: logItem.message,
                latencyMs: Math.round(40 + Math.random() * 120)
              };
            }
            
            // Set the *next* agent in the list to processing, if applicable
            const currentAgentIndex = INITIAL_STEPS.findIndex(s => s.id === logItem.agent);
            if (currentAgentIndex !== -1 && step.id === INITIAL_STEPS[currentAgentIndex + 1]?.id && logItem.status !== 'error') {
               return { ...step, status: 'processing' as SimStepStatus };
            }

            return step;
          });
          
          // For the very first log, set normalization to processing immediately if it isn't completed
          if (index === 0) {
              const normStep = newSteps.find(s => s.id === 'NORMALIZATION');
              if (normStep && normStep.status === 'idle') normStep.status = 'processing';
          }

          const progress = Math.min(100, Math.round(((index + 1) / selectedScenario.mockLogs.length) * 100));

          return {
            logs: [newLog, ...state.logs],
            steps: newSteps,
            simulationProgress: progress,
            activeHazards: newHazards,
            activeRoutes: newRoutes,
            activeShelters: newShelters,
            activeAlerts: newAlerts,
            predictiveTimeline: newTimeline
          };
        });
      }, cumulativeDelay);

      activeTimeouts.push(timeout);
    });

    // Finalize
    const finishTimeout = setTimeout(() => {
      set({ isActive: false, simulationProgress: 100 });
    }, cumulativeDelay + 1000);
    activeTimeouts.push(finishTimeout);
  },

  dispatchResponder: (type, origin, target) => {
    const id = `${type}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Add responder to state
    set((state) => ({
      activeResponders: [...state.activeResponders, {
        id,
        type,
        coordinate: origin,
        targetCoordinate: target,
        status: 'dispatched',
        eta: '4 min'
      }],
      // Inject synthetic log for tactical feedback
      logs: [{
        id: Math.random().toString(36),
        timestamp: Date.now(),
        agent: 'TACTICAL',
        message: `DISPATCH: ${type.toUpperCase()} unit en route to incident zone.`,
        status: 'warning'
      }, ...state.logs]
    }));

    // Simulate moving responder
    let steps = 0;
    const totalSteps = 60; // 3 seconds at 20 fps
    
    const moveInterval = setInterval(() => {
      steps++;
      set((state) => {
        const updatedResponders = state.activeResponders.map(res => {
          if (res.id === id) {
            // Linear interpolation
            const progress = steps / totalSteps;
            const currentLat = origin.latitude + (target.latitude - origin.latitude) * progress;
            const currentLng = origin.longitude + (target.longitude - origin.longitude) * progress;
            
            return {
              ...res,
              coordinate: { latitude: currentLat, longitude: currentLng },
              status: progress >= 1 ? 'arrived' : 'en_route',
              eta: progress >= 1 ? 'ARRIVED' : `${Math.max(1, Math.round(4 * (1 - progress)))} min`
            };
          }
          return res;
        });
        return { activeResponders: updatedResponders as SimResponder[] };
      });

      if (steps >= totalSteps) {
        clearInterval(moveInterval);
      }
    }, 50);
  }
}));
