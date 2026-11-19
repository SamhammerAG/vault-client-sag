# MET-5031 – Publish the library as ESM

> Roadmap: 1. ESLint 10 + TypeScript 6 (MET-5032) → 2. ncc → tsdown and Jest → Vitest → 3. ESM bundle (this plan).
> Steps 2 and 3 are done in the same branch (`MET-5031-buildtools`) and go out as **one release**.
> Each commit must leave `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` green.

## Rationale

The source is already written as ESM, but the package still ships CommonJS. Its dependency `hashi-vault-js` is
ESM-only, so the CommonJS build has to `require()` an ES module. Shipping ESM removes that interop layer and
tsdown's "use ESM" warning.

The only known consumer is `migrate-mongo-sag` (Node 24). It can load an ESM-only package both from its current
CommonJS build (`require()` of ESM is supported since Node 22.12 / 20.19) and from its own later ESM build. So we
switch to **ESM-only**, not to a dual ESM + CommonJS package, which would need two builds, two declaration files
and a conditional `exports` map. Older Node versions are not supported.

## Acceptance criteria

- [x] `package.json` gets `"type": "module"`. `main` (`dist/index.js`) and `types` (`dist/index.d.ts`) keep their
      paths; the files are now ESM.
- [x] `tsdown.config.mts` emits `format: "esm"`. `outputOptions.strict` is removed (ESM is always strict).
      The "use ESM" warning from tsdown is gone.
- [x] `engines.node` is set to `>=24`.
- [x] `dist/` contains only `index.js` and `index.d.ts`, and `npm pack --dry-run` lists only them plus `LICENSE`,
      `README.md` and `package.json`.
- [x] `dist/index.d.ts` exports the same API as the baseline `dist/main.d.ts`.
- [x] The built package works in Node 24 without "Named export … not found" errors:
      `import { getVault } from "@samhammer/vault-client-sag"` and `require("@samhammer/vault-client-sag")` both
      return the function `getVault` (checked against the packed tarball, not the source).
      Done: tarball extracted into a consumer folder with a CommonJS `package.json` (no `"type"`); `require()` from
      a `.js` file and `import` from a `.mjs` file both work, without an `ExperimentalWarning`. A smoke test via
      `require()` with AppRole env vars reaches the network call, like the CommonJS build did.
- [x] `fs-extra` works in the ESM build (see Technical details). First done with a default import; then
      `fs-extra` and `@types/fs-extra` were removed and `src/kubernetes.ts` uses `node:fs/promises`.
- [x] Node builtins are imported with the `node:` prefix (`node:util`, `node:child_process`, `node:fs/promises`).
- [x] `yarn sample` works against Vault. The sample uses top-level `await` again, because it is built as ESM now.
- [ ] `migrate-mongo-sag` works with the new package (installed from the local tarball): its build starts and its
      tests pass. Not done yet: postponed, together with a test of a CommonJS consumer repo that runs migrations.
- [ ] The release is a **new major version**; the release notes say the package is ESM-only and needs Node 24.
- [ ] CI passes.

## Technical details

- **`"type": "module"` instead of `.mjs`:** it keeps `main`, `types` and the `.js` / `.d.ts` extensions from step 2,
  so `outExtensions` stays as it is. The config files are `.ts` / `.mts` and are not affected. The sample output in
  `node_modules/.cache/vault-client-sag` also uses our `package.json` as nearest one, so it runs as ESM too.
- **No `exports` map:** `exports` is a `package.json` field that tells Node and TypeScript which file to load for
  `import` and for `require`. tsdown creates the `.d.ts` files, but not this mapping. With one format, `main` and
  `types` are enough, so we do not add `exports`. It can be added later if we need it (it also blocks deep imports
  into `dist/`).
- **`fs-extra` → `node:fs/promises`:** Node can import `pathExists` by name from `fs-extra`, but not `readFile`
  ("Named export 'readFile' not found", seen in step 2). A default import (`import fse from "fs-extra"`) worked,
  but was only a workaround. fs-extra has no newer major (latest 11.4.1); its `fs-extra/esm` entry only exports
  fs-extra's own functions, not `readFile`. We only used `pathExists` and `readFile`, which Node covers today, so
  `fs-extra` and `@types/fs-extra` are removed: `readFile` comes from `node:fs/promises` (returns a Buffer as before),
  and `pathExists` is a small helper around `access` (`true` / `false`), the same as fs-extra's implementation.
- **`node:` prefix:** builtins are imported as `node:…`, so it is clear that they are Node modules and an npm package
  with the same name can never replace them. No lint rule enforces it (`import-x` has none; it would need another
  plugin), there are only three such imports.
- **`hashi-vault-js`** already works as a default import from ESM (checked).
- **Consumers with CommonJS output** (like `migrate-mongo-sag` today) `require()` the package. Node 24 supports
  that as long as the module has no top-level `await`, which ours does not have.
- **Vitest** does not catch CommonJS/ESM interop problems (Vite bridges them), so the checks above must run in Node
  against the packed tarball.
