module.exports = {
  projects: [
    {
      displayName: 'cxx-parser',
      coverageDirectory: 'cxx-parser',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: 'cxx-parser/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
    },
    {
      displayName: 'terra',
      coverageDirectory: 'terra',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: 'terra/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
    },
    {
      displayName: 'terra-core',
      coverageDirectory: 'terra-core',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: 'terra-core/__tests__/.*\\.(test|spec)\\.[jt]sx?$',
    },
  ],
};
