/**
 * Global Jest test setup
 */
import 'reflect-metadata';

// Set a higher timeout for all tests (30 seconds)
jest.setTimeout(30000);

// Add a global afterAll hook to ensure database connections are properly closed
afterAll(async () => {
  // Add a small delay to allow any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Silence console output during tests
global.console = {
  ...console,
  // Keep error logging, silence others during tests
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
