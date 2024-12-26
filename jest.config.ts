import type { Config } from 'jest';

const config: Config = {
  // The root directory where Jest should look for test files
  rootDir: 'src',

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Process .ts and .tsx files using ts-jest
  },

  // Specify the test environment, typically 'node' for server-side code
  testEnvironment: 'node',

  // Directory where Jest should output coverage information
  coverageDirectory: 'coverage',

  // File extensions Jest should look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],

  // Path to find your test files
  testMatch: [
    '**/tests/**/*.test.ts',    // Look for .test.ts files inside tests folder
    '**/?(*.)+(spec|test).ts',  // Look for files ending with .spec.ts or .test.ts
  ],

  // You can also set up ts-jest to work with TypeScript
  preset: 'ts-jest',
};

export default config;
