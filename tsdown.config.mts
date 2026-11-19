import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { index: "src/main.ts" },
    format: "cjs",
    platform: "node",
    target: "node24",
    // Keep `.js` / `.d.ts` explicitly: tsdown defaults to `.cjs` / `.d.cts` for platform "node",
    // which would break `main` and `types` in package.json.
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    dts: true,
    clean: true,
    outputOptions: {
        // Emit "use strict" like the previous ncc build did; the ESM sources assume strict mode.
        strict: true
    }
});
