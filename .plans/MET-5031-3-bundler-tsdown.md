# MET-5031 – Replace ncc build with tsdown

> Roadmap: 1. ESLint 10 + TypeScript 6 (MET-5032) → 2. ncc → tsdown (this plan) → 3. Jest → Vitest (separate ticket).
> Each step must leave `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` green.
> Commits in this branch, each green on its own: 1. plan → 2. switch `build` to tsdown → 3. `run` script →
> 4. `tsconfig.json` / `jest.config.js` cleanup → 5. check plan boxes.
> Reference: `migrate-mongo-sag` already switched from Vite to tsdown (`tsdown.config.mts`, `package.json`).

## Rationale

`@vercel/ncc` is a webpack-based bundler for single-file Node apps. For a library it needs workarounds:
it always reads `tsconfig.json` and emits a `.d.ts` for **every** file in it (also `run.d.ts` and
`__tests__/*.spec.d.ts`), it does not clean `dist/`, and it bundles all dependencies into one 685 kB
`dist/index.js`. tsdown (successor of tsup, built on Rolldown, same tool as in `migrate-mongo-sag`) is made for
libraries: it externalizes `dependencies`, bundles the declarations into one file reachable from the entry, and
cleans `dist/`. The public API (`getVault`, `VaultParams`) and the CommonJS entry `dist/index.js` stay the same,
because other `sag-js` projects (e.g. `migrate-mongo-sag`) consume this package.

## Acceptance criteria

- [x] `@vercel/ncc` is removed. `tsdown` is added, pinned to a minor range (`~0.23.x`, it is still 0.x), and the
      version is at least 14 days old (`npmMinimalAgeGate`). Done: `~0.23.5`, same as `migrate-mongo-sag`.
- [x] `tsdown.config.mts` is added and `build` is changed to `tsdown`.
- [x] Output keeps the **same format (CJS)** and the **same path** `dist/index.js`; `package.json#main` does not
      change. `package.json` stays **without** `"type": "module"` (ESM is out of scope here).
- [x] `dist/index.js` loads with `require()` and exports `getVault` (and nothing else, like before).
      A smoke test with AppRole env vars and an unreachable URL fails the same way with the old and new build.
- [x] Declarations are emitted as **one bundled file**; `package.json#types` points to it (e.g. `dist/index.d.ts`).
      It exports the same API as the old `dist/main.d.ts` (`getVault`, `VaultParams`; `VaultClient` with
      `loadSecret` / `loadSecretsToEnv` as return type). Done: `dist/index.d.ts` equals the old `main.d.ts`
      except for indentation.
- [x] `dist/` contains only the files from the entry: no `run.d.ts`, no `__tests__/`, no extra chunks or
      source maps. Then `!dist/__tests__` is removed from `files` in `package.json`.
- [x] `npm pack --dry-run` contains no test files and no `run` files. Done: 5 files (LICENSE, README.md,
      `dist/index.d.ts`, `dist/index.js`, package.json) instead of 12; `dist/index.js` is 7.1 kB instead of 701 kB.
- [x] `dependencies` (`hashi-vault-js`, `fs-extra`) and Node builtins are external, not bundled (see Technical details).
      The `require(...)` list of `dist/index.js` is `child_process`, `fs-extra`, `hashi-vault-js`, `util`.
- [x] The `run` script (manual local runner for `src/run.ts`) works with tsdown and no longer writes into `dist/`.
      Done differently than planned: an ESM runner fails at runtime, because Node cannot read the named exports
      `pathExists` / `readFile` from the CommonJS package `fs-extra`. So the runner is built as CJS, like
      `dist/index.js`, into `.temp/run.cjs`, and `src/run.ts` wraps its code in an async function instead of using
      top-level `await`. Tested locally against Vault with `vault login`.
- [x] `declaration` and `rootDir` are removed from `tsconfig.json` if tsdown does not need them.
      Done: `noEmit: true` is in `tsconfig.json`, `typecheck` is plain `tsc`, and tsdown still emits the declarations.
- [ ] CI passes (no workflow change expected). Not verified yet: the branch is not pushed. All CI steps (lint,
      typecheck, test, build) pass locally.

## Technical details

### `tsdown.config.mts` (outline)

Same shape as `migrate-mongo-sag`. `.mts`, because without `"type": "module"` Node prints
`MODULE_TYPELESS_PACKAGE_JSON` for a `.ts` config.

- `entry: { index: "src/main.ts" }`, `format: "cjs"`, `platform: "node"`, `target: "node24"`, `clean: true`.
  `target` matches Volta; ncc did not lower the syntax either (it used `target: "ESNext"` from `tsconfig.json`).
- **Output extension:** tsdown defaults to `fixedExtension: true` for `platform: "node"`, so the output would be
  `dist/index.cjs` / `dist/index.d.cts`. Set `outExtensions: () => ({ js: ".js", dts: ".d.ts" })` explicitly,
  so `main` and `types` keep their extensions.
- `dts: true`. tsdown bundles the declarations of everything reachable from `src/main.ts` into one file and
  keeps `import ... from "hashi-vault-js"` as external import. Compare it with the baseline `dist/main.d.ts`.
- `outputOptions.strict: true`, like the reference: keeps the `"use strict"` directive (Rolldown's default `"auto"`
  would drop it; the ESM sources assume strict mode).

### Dependencies are no longer bundled

ncc inlined `hashi-vault-js`, `fs-extra` and their dependencies (axios, …) into `dist/index.js` (685 kB). tsdown
externalizes `dependencies` from `package.json` by default, so `dist/index.js` gets small and `require`s them at
runtime. Consumers already install both packages today, because they are listed in `dependencies`, so nothing
changes for them, and the duplicate copy goes away. Check the `require(...)` list of the new output: only Node
builtins, `hashi-vault-js` and `fs-extra`.

### `package.json`

- `build`: `tsdown`.
- `types`: path of the bundled declaration file (e.g. `dist/index.d.ts` instead of `dist/main.d.ts`).
  Consumers only import the package root, so the file name does not matter to them.
- `files`: `["dist/**/*"]`, once the build no longer writes `dist/__tests__` (verify, don't assume).
- `run`: ncc compiled the top-level `await` in `src/run.ts` into CJS and wrote it to `dist/index.js`, overwriting
  the package build. Rolldown does not support top-level `await` in CJS output, so build `src/run.ts` as **ESM**
  into `.temp/` (not `dist/`), then run it, e.g. `tsdown src/run.ts --no-config --format esm --no-dts -d .temp`
  `&& node .temp/run.mjs`. Add `.temp/` to `.gitignore` and to `globalIgnores` in `eslint.config.ts` (same as the
  reference). It needs `vault login` / `VAULT_ADDR`; without them it only has to start and print the auth error.

### `tsconfig.json` and Jest

- `declaration: true` and `rootDir: "src"` were only there for ncc (ncc reads `tsconfig.json`; TS 6 requires
  `rootDir` when declarations are emitted, TS5011). Remove both and set `noEmit: true` like the reference;
  `typecheck` can then become plain `tsc`. Check that tsdown's dts plugin still works with `noEmit: true` in
  `tsconfig.json`; if not, keep `noEmit` in the script.
- `jest.config.js` keeps `testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.ts"]` (it states where tests live and
  matches the planned Vitest `include`). Only update its comment, which mentions ncc.

### Things to watch

- tsdown needs Node `^22.18 || ^24.11` to **build**. Volta pins 24.22.1, so CI is fine. Consumers are not affected.
- Before the switch, save a baseline: delete `dist/`, build with ncc, keep `dist/` and the `npm pack --dry-run`
  list. After the switch, compare: declaration API, `require(dist/index.js)` exports, file list.
- tsdown may print an informational warning that recommends ESM; ignore it here.
- For the later ESM step: with `fs-extra` external, `import { pathExists, readFile } from "fs-extra"` fails in
  ESM output (CommonJS package, named exports not detected). Use the default import or `node:fs/promises` there.
- After changing dependencies, run `yarn dedupe` so ncc leftovers leave `yarn.lock`.
