# MET-5031 – Replace ncc build with tsdown and Jest with Vitest

> Roadmap: 1. ESLint 10 + TypeScript 6 (MET-5032) → 2. ncc → tsdown and Jest → Vitest (this plan) →
> 3. ESM bundle (later, separate step, because it can break consumers).
> Each step must leave `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` green.
> Commits in this branch: 1. ncc → tsdown (incl. this plan) → 2. Jest → Vitest.
> Reference: `migrate-mongo-sag` already uses tsdown (`tsdown.config.mts`) and Vitest 5 (`vitest.config.mts`).

## Rationale

`@vercel/ncc` is a webpack-based bundler for single-file Node apps. For a library it needs workarounds:
it always reads `tsconfig.json` and emits a `.d.ts` for **every** file in it (also `run.d.ts` and
`__tests__/*.spec.d.ts`), it does not clean `dist/`, and it bundles all dependencies into one 685 kB
`dist/index.js`. tsdown (successor of tsup, built on Rolldown, same tool as in `migrate-mongo-sag`) is made for
libraries: it externalizes `dependencies`, bundles the declarations into one file reachable from the entry, and
cleans `dist/`. The public API (`getVault`, `VaultParams`) and the CommonJS entry `dist/index.js` stay the same,
because other `sag-js` projects (e.g. `migrate-mongo-sag`) consume this package.

Jest needs `ts-jest` to run TypeScript, with its own compiler options and TypeScript peer ranges that lag behind.
Vitest runs the TypeScript specs directly and is what `migrate-mongo-sag` uses, so both repos share one setup.
The ESM switch is not part of this plan.

## Acceptance criteria

### ncc → tsdown

- [x] `@vercel/ncc` is removed. `tsdown` is added, pinned to a minor range (`~0.23.x`, it is still 0.x), and the
      version is at least 14 days old (`npmMinimalAgeGate`). Done: `~0.23.5`, same as `migrate-mongo-sag`.
- [x] `tsdown.config.mts` is added and `build` is changed to `tsdown`.
- [x] Output keeps the **same format (CJS)** and the **same path** `dist/index.js`; `package.json#main` does not
      change. `package.json` stays **without** `"type": "module"` (ESM is out of scope here).
- [x] `dist/index.js` loads with `require()` and exports `getVault` (and nothing else, like before).
      A smoke test with AppRole env vars and an unreachable URL fails the same way with the old and new build.
- [x] Declarations are emitted as **one bundled file**; `package.json#types` points to it (`dist/index.d.ts`).
      It exports the same API as the old `dist/main.d.ts` (`getVault`, `VaultParams`; `VaultClient` with
      `loadSecret` / `loadSecretsToEnv` as return type). Done: `dist/index.d.ts` equals the old `main.d.ts`
      except for indentation.
- [x] `dist/` contains only the files from the entry: no `run.d.ts`, no `__tests__/`, no extra chunks or
      source maps. Then `!dist/__tests__` is removed from `files` in `package.json`.
- [x] `npm pack --dry-run` contains no test files and no `run` files. Done: 5 files (LICENSE, README.md,
      `dist/index.d.ts`, `dist/index.js`, package.json) instead of 12; `dist/index.js` is 7.1 kB instead of 701 kB.
- [x] `dependencies` (`hashi-vault-js`, `fs-extra`) and Node builtins are external, not bundled (see Technical details).
      The `require(...)` list of `dist/index.js` is `child_process`, `fs-extra`, `hashi-vault-js`, `util`.
- [x] The manual local runner works with tsdown and no longer writes into `dist/`. It is moved from `src/run.ts`
      to `src/__samples__/load-secret.ts`, and the script is renamed from `run` to `sample` (`yarn sample`).
      Tested locally against Vault with `vault login`.
- [x] `declaration` and `rootDir` are removed from `tsconfig.json` if tsdown does not need them.
      Done: `noEmit: true` is in `tsconfig.json`, `typecheck` is plain `tsc`, and tsdown still emits the declarations.

### Jest → Vitest

- [x] `jest`, `ts-jest`, `@types/jest` and `jest.config.js` are removed. `vitest` `^5` is added, plus `vite` as a
      direct devDependency, because Vitest 5 declares it as a non-optional peer (same as `migrate-mongo-sag`).
      Done: `vitest@^5.1.0`, `vite@^8.3.6` (5.1.1 is still blocked by the 14-day age gate).
- [x] `vitest.config.mts` sets `include: ["src/**/__tests__/**/*.spec.ts"]` and `unstubEnvs: true`.
- [x] `yarn test` runs `vitest run`, and all 10 existing tests pass.
- [x] The specs import `describe` / `it` / `expect` / `vi` from `vitest` (no globals), and `jest` is removed from
      `types` in `tsconfig.json`.

### Both

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
runtime. Consumers already install both packages, because they are listed in `dependencies`, and now get security
updates of them (and their transitive dependencies) through their own lockfile.

### `package.json`

- `build`: `tsdown`.
- `types`: `dist/index.d.ts` instead of `dist/main.d.ts`. Consumers only import the package root, so the file name
  does not matter to them.
- `files`: `["dist/**/*"]`, because the build no longer writes `dist/__tests__`.
- `sample` (was `run`): a manual test of the real runtime against Vault. The file moves from `src/run.ts` to
  `src/__samples__/load-secret.ts`, next to `src/__tests__/`, so it is clearly separate from the library code
  without adding another root folder. tsdown only builds what `src/main.ts` reaches, so it never ends up in `dist/`.
  ncc compiled its top-level `await` into CJS and wrote it to `dist/index.js`, overwriting the package build.
  Rolldown does not support top-level `await` in CJS output, and an ESM build fails at runtime, because Node cannot
  read the named exports `pathExists` / `readFile` from the CommonJS package `fs-extra`. So the sample wraps its code
  in an async function and is built as CJS (like `dist/index.js`) into `.temp/`:
  `tsdown samples/load-secret.ts --no-config --no-dts -f cjs -d .temp && node .temp/load-secret.cjs`. `.temp/` is in
  `.gitignore` and in `globalIgnores` in `eslint.config.ts` (same as the reference).

### `tsconfig.json`

- `declaration: true` and `rootDir: "src"` were only there for ncc (ncc reads `tsconfig.json`; TS 6 requires
  `rootDir` when declarations are emitted, TS5011). Both are removed and `noEmit: true` is set like the reference;
  `typecheck` is plain `tsc`. tsdown's dts plugin still works with `noEmit: true` in `tsconfig.json`.
- `types: ["node"]` (no `jest` any more; the specs import from `vitest`).

### Vitest

- `vitest.config.mts` (not `.ts`, same reason as the tsdown config) only has test options. The explicit `include`
  is needed, because Vitest only excludes `node_modules` and `.git` by default.
- `params.spec.ts` used `process.env.VaultTimeout = ...` and an `afterEach` that set it to `undefined` (which Node
  turns into the string `"undefined"`). It now uses `vi.stubEnv`, and `unstubEnvs: true` restores the env after
  each test.
- The `app/jest-config` block is removed from `eslint.config.ts`; `vitest.config.mts` is covered by the
  TypeScript block.
- Side effect: Jest found no tests when the repo path contains `\.claude` on Windows (e.g. in a Claude Code
  worktree), because `<rootDir>` was read as a glob with an escape. Vitest does not have this problem.

### Things to watch

- tsdown needs Node `^22.18 || ^24.11` to **build**, Vitest 5 needs `^22.12 || ^24 || >=26`. Volta pins 24.22.1,
  so CI is fine. Consumers are not affected.
- Before the switch, save a baseline: delete `dist/`, build with ncc, keep `dist/` and the `npm pack --dry-run`
  list. After the switch, compare: declaration API, `require(dist/index.js)` exports, file list.
- tsdown prints an informational warning that recommends ESM; ignore it here.
- For the later ESM step: with `fs-extra` external, `import { pathExists, readFile } from "fs-extra"` fails in
  ESM output (CommonJS package, named exports not detected). Use the default import or `node:fs/promises` there.
- After changing dependencies, run `yarn dedupe` so ncc / Jest leftovers leave `yarn.lock`.
