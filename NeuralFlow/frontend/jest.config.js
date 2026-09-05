export default {
  testEnvironment: 'jsdom',
  transform: {},
  extensionsToTreatAsEsm: ['.jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(zustand)/)'
  ],
  injectGlobals: true,
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3001',
        VITE_WS_URL: 'ws://localhost:3001'
      }
    }
  }
};
