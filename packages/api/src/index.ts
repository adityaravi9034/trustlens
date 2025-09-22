/**
 * TrustLens API Server Entry Point
 */

import { TrustLensAPI } from './app';

async function main() {
  try {
    console.log('🚀 Starting TrustLens API...');

    const api = new TrustLensAPI();
    await api.initialize();
    api.listen();

  } catch (error) {
    console.error('❌ Failed to start TrustLens API:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { TrustLensAPI };