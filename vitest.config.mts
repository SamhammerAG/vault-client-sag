import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // tests live in src/**/__tests__; Vitest only excludes node_modules and .git by default
        include: ["src/**/__tests__/**/*.spec.ts"],
        // restore env vars set with vi.stubEnv after each test
        unstubEnvs: true
    }
});
