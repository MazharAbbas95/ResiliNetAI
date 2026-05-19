import { seedingService } from '../services/firebase/seedingService';

const runSeeder = async () => {
  try {
    console.log('[Seeder] Starting manual data injection...');
    await seedingService.seedMockData();
    console.log('[Seeder] Data injection complete!');
  } catch (error) {
    console.error('[Seeder] Injection failed:', error);
  }
};

runSeeder();
