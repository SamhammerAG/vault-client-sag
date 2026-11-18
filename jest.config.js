/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    // tests live in src/**/__tests__; also keeps the declarations ncc writes to dist/__tests__ out
    testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.ts"],
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
