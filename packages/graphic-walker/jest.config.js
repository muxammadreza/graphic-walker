/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Only run tests from the TypeScript source and test folders; ignore dist artifacts which are ES modules
    testMatch: ['**/src/**/*.test.[jt]s?(x)', '**/test/**/*.test.[jt]s?(x)'],
    testPathIgnorePatterns: ['<rootDir>/dist/', '/node_modules/'],
};
