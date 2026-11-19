import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { index: "src/main.ts" },
    format: "esm",
    platform: "node",
    target: "node24",
    // Keep `.js` / `.d.ts` explicitly (ESM via "type": "module"), so `main` and `types` in package.json
    // do not depend on tsdown's extension defaults.
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    dts: true,
    clean: true
});
