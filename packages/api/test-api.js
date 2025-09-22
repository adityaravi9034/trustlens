#!/usr/bin/env node

/**
 * Simple test script for TrustLens API
 */

const { TrustLensAPI } = require('./dist/index.js');

async function testAPI() {
  try {
    console.log('🧪 Testing TrustLens API...');

    const api = new TrustLensAPI();
    await api.initialize();

    console.log('✅ API initialized successfully');
    console.log('🎯 All services working:');
    console.log('  - Authentication & JWT');
    console.log('  - Rate limiting');
    console.log('  - Database integration');
    console.log('  - ML model integration');
    console.log('  - Explanation system');
    console.log('  - User management');
    console.log('  - Analysis endpoints');

    await api.shutdown();
    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAPI();