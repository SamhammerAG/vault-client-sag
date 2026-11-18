/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    testEnvironment: "node",
    // only look for tests in src/, not in the declarations ncc writes to dist/__tests__
    roots: ["<rootDir>/src"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                // ts-jest compiles to CommonJS, which doesn't combine with "bundler" resolution from tsconfig.json
                // and would fall back to the deprecated "node10" resolution under TypeScript 6
                tsconfig: { module: "Node16", moduleResolution: "Node16", esModuleInterop: true }
            }
        ]
    }
};
