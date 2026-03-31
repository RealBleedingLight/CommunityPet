import { initializeBot } from './bot/index';

initializeBot().catch((error) => {
  console.error('Failed to initialize bot:', error);
  process.exit(1);
});
