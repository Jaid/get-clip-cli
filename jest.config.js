module.exports = {
  testEnvironment: "node",
  coverageDirectory: "dist/jest/coverage",
  collectCoverageFrom: ["src/**"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
  ],
  moduleNameMapper: {
    "^root": "<rootDir>",
    "^src": "<rootDir>/src",
    "^lib": "<rootDir>/src/lib",
  },
}