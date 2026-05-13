/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest to transform TypeScript
  preset: 'ts-jest',

  // Run in Node environment
  testEnvironment: 'node',

  // Look for tests in the __tests__ directory
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],

  // Transform TS files, but mock .js extension imports (ESM → CJS compatibility)
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          // Override module to CommonJS for Jest (ts-jest requirement)
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowJs: true,
        },
        // Treat .js imports in TypeScript as CJS (resolves ESM .js imports)
        diagnostics: { ignoreCodes: [1343] },
      },
    ],
  },

  // Allow jest to resolve .js → .ts automatically for internal imports
  moduleNameMapper: {
    // Map .js imports to their .ts source counterparts
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Collect coverage from controllers, services, middleware
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'services/**/*.ts',
    'middleware/**/*.ts',
    '!**/*.d.ts',
  ],

  // Global test timeout (10 seconds per test)
  testTimeout: 10000,

  // Clear mock call history between tests but preserve implementations.
  // resetMocks: true would wipe factory-defined mock return values (e.g. calculateOvertime)
  // causing mocked async functions to return undefined and cascade into 500 errors.
  clearMocks: true,
  resetMocks: false,
};
