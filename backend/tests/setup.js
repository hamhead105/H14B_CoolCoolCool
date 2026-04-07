import { jest } from '@jest/globals';

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore specific log levels during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error,
};

// Global test timeout
jest.setTimeout(10000);

// Ensure JWT_SECRET exists during tests so auth middleware can run with mocked jsonwebtoken
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Setup fetch for older Node versions if needed
if (!global.fetch) {
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
