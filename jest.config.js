/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    testEnvironment: "node",
    // only look for tests in src/, not in the declarations ncc writes to dist/__tests__
    roots: ["<rootDir>/src"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                // always on in TypeScript 6, but ts-jest warns (TS151001) unless it is set explicitly
                tsconfig: { esModuleInterop: true }
            }
        ]
    }
};
