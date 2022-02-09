module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist', 'node_modules'],
  rootDir: '.',
  resetModules: true,
  verbose: true,
  modulePaths: ['<rootDir>/src/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'd.ts'],
  modulePathIgnorePatterns: ['out']
}
