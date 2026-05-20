import { adminDb } from '../config/firebaseAdmin.ts';

type ReadinessState = {
  firestore: 'unknown' | 'connected' | 'error';
  lastChecked?: string;
};

const state: ReadinessState = {
  firestore: 'unknown',
};

export const getReadinessState = (): ReadinessState => state;

export const runReadinessChecks = async (): Promise<ReadinessState> => {
  try {
    // Lightweight Firestore probe
    await adminDb.collection('system_ping').limit(1).get();
    state.firestore = 'connected';
  } catch (err) {
    console.error('[Readiness] Firestore probe failed', err);
    state.firestore = 'error';
  }

  state.lastChecked = new Date().toISOString();
  return state;
};

export default {
  getReadinessState,
  runReadinessChecks,
};
