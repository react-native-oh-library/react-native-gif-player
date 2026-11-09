module.exports = {
  rootDir: require('path').resolve(__dirname, '..'),
  roots: ['<rootDir>/jest'],
  preset: 'react-native',
  testMatch: ['<rootDir>/jest/__tests__/**/*-test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/oh_modules/', '/harmony/'],
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
  transform: {
    '^.+\\.(js|ts|tsx)$': [
      'babel-jest',
      { configFile: require.resolve('./babel.config.js') },
    ],
  },
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  collectCoverageFrom: ['src/index.tsx'],
  coverageDirectory: '<rootDir>/jest/coverage',
};
