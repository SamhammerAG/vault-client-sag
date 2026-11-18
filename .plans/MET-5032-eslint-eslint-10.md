# MET-5032 – Update ESLint 8 → 10 (flat config) and TypeScript 4.9 → 6

> Roadmap: 1. ESLint 10 + TypeScript 6 (this plan) → 2. Jest → Vitest (separate ticket, decided later).
> Each step is its own branch/PR and must leave `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` green.
> Commits in this branch, each green on its own: 1. ESLint 10 → 2. Prettier 3 → 3. TypeScript 6 → 4. `strict`.
> Reference: `migrate-mongo-sag` already went through the same migration (`eslint.config.ts`, `tsconfig.json`, CI).

## Rationale

ESLint 8 has been EOL since Oct 2024, and ESLint 9 has been EOL since 2026-08-06. ESLint 10 removes the legacy
`.eslintrc` format completely, so we have to move to flat config. The current plugins also have to change:
`@typescript-eslint/*` v5 does not support ESLint 9/10, and `eslint-plugin-import` (latest 2.32.0) only supports
`eslint` up to `^9`. TypeScript 4.9 is far behind as well. TypeScript 6 is the last JS-based release before
TypeScript 7 and turns several old options into deprecation errors, so we update it in the same step. Runtime
code only changes where the new lint rules or the compiler require it. The published output (`dist/index.js`,
`dist/main.d.ts`) must stay compatible, because other `sag-js` projects (e.g. `migrate-mongo-sag`) consume it.

## Acceptance criteria

- [x] `eslint` is updated to `^10` and `@eslint/js` `^10` is added.
- [x] `.eslintrc.cjs`, `.eslintsag.cjs` and `.eslintignore` are replaced by a single `eslint.config.ts`
      (loaded via `jiti`, same setup as `migrate-mongo-sag`).
- [x] `@rushstack/eslint-patch`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` and
      `eslint-plugin-import` are removed. `typescript-eslint` (v8, unified package) and
      `eslint-plugin-import-x` are added instead.
- [x] `eslint-config-prettier` is updated to `^10` and used via `eslint-config-prettier/flat` (`skipFormatting`).
      `eslint-plugin-prettier` is removed; formatting is left to prettier itself (format on save / `yarn format`).
- [x] `prettier` is updated to `^3`. A pure reformat (if any) goes into its own commit.
- [x] All current SAG rules are still active, with the same severity (see Technical details).
- [x] `dist/` and `.yarn/` are ignored by ESLint.
- [x] `typescript` is updated to `~6.0` and `tsconfig.json` has no deprecated options left (no `ignoreDeprecations`).
- [x] A `typecheck` script (`tsc --noEmit`) exists and runs in CI.
- [x] The tests are moved from `tests/` to `src/__tests__/`, so `yarn typecheck` covers them too.
- [x] The published package content is unchanged: no test declarations in the npm package (`npm pack --dry-run`).
- [x] `yarn test` still runs on Jest/ts-jest with TypeScript 6 (see Things to watch).
- [x] `yarn build` (ncc) works with TypeScript 6, and `dist/main.d.ts` exports the same API as before.
- [x] `yarn lint` passes in CI. New findings from changed `recommended` sets are fixed or explicitly
      turned off with a short justification.
- [x] VS Code "fix all on save" still works with the flat config (ESLint extension v3+).

## Technical details

### Packages

| remove | add / update |
| --- | --- |
| `eslint@8` | `eslint@^10`, `@eslint/js@^10` |
| `@rushstack/eslint-patch` | – (not needed with flat config) |
| `@typescript-eslint/eslint-plugin@5`, `@typescript-eslint/parser@5` | `typescript-eslint@^8` (peer `eslint ^8.57 \|\| ^9 \|\| ^10`, `typescript >=4.8.4 <6.1`) |
| `eslint-plugin-import@2` | `eslint-plugin-import-x@^4` (peer includes `^10`) |
| `eslint-config-prettier@8`, `eslint-plugin-prettier@4` | `eslint-config-prettier@^10` |
| `prettier@2` | `prettier@^3` |
| `typescript@4.9` | `typescript@~6.0` (tilde, because of the `typescript-eslint` peer range `<6.1`) |
| – | `globals` (for `globals.node`) |
| – | `jiti@^2` (loads `eslint.config.ts`) |

Jest, `ts-jest`, `@types/jest` and `@vercel/ncc` stay as they are.

### `eslint.config.ts` (outline)

Use `defineConfig` and `globalIgnores` from `eslint/config`, with named blocks like `migrate-mongo-sag`:

1. `globalIgnores(["dist/", ".yarn/"])` replaces `.eslintignore`.
2. `app/typescript` (`**/*.{ts,mts}`): extends `js.configs.recommended` and `tseslint.configs.recommended`,
   sets `globals.node`. Rules: `@typescript-eslint/consistent-type-imports: error`,
   `@typescript-eslint/explicit-member-accessibility: error`. The old `no-console: off` /
   `no-debugger: off` overrides are dropped: `no-console` is not in recommended anyway, and
   `no-debugger` should catch leftover `debugger` statements.
3. `app/imports` (`**/*.{ts,mts,js,mjs}`): registers `import-x`. Rules `import-x/first`,
   `import-x/newline-after-import`, `import-x/no-duplicates`, `import-x/no-self-import`: `error`.
4. `jest.config.js` is CommonJS (`module.exports`). Either lint it with a small CommonJS block
   (`sourceType: "commonjs"`, `globals.node`) or ignore it until the Vitest switch removes it.
5. `eslint-config-prettier/flat` comes last and turns off rules that conflict with prettier.

There is no `migrate-mongo` block here; that part of the reference config does not apply.

### `tsconfig.json`

- `moduleResolution: "node"` (= `node10`) is deprecated in TS 6 and fails with an error. Switch to
  `"bundler"`, which matches how ncc bundles the code (`module: "ESNext"` stays).
- Remove options that are no-ops or irrelevant: `esModuleInterop` (always on in TS 6), `jsx: "preserve"`,
  `useDefineForClassFields` (no classes with fields that depend on it). Drop `DOM` / `DOM.Iterable` from `lib`;
  this is Node-only code.
- Keep `declaration: true`. ncc uses it to emit `dist/main.d.ts`, which `package.json#types` points to.
  So do **not** put `noEmit` into `tsconfig.json`; pass it in the script instead (`"typecheck": "tsc --noEmit"`).
- `types: ["node", "jest"]` is already explicit, which matters because TS 6 defaults `types` to `[]`.
- TS 6 requires an explicit `rootDir` when declarations are emitted (error TS5011). Set `"rootDir": "src"`, which
  also pins the output layout to `dist/main.d.ts`.
- `forceConsistentCasingInFileNames` is dropped (default `true` since TS 5.0). `lib: ["ESNext"]` stays: without
  it, `target: "ESNext"` loads `lib.esnext.full.d.ts`, which includes the DOM libs again.
- `strict` is turned on in its own commit, like `migrate-mongo-sag`: `strict: true` with
  `useUnknownInCatchVariables: false` (the catch blocks read `error.isVaultError` / `status` / `vaultHelpMessage`).
  `noImplicitThis` is removed, it is part of `strict`. The remaining errors (possibly undefined env values and
  regex groups) are fixed without changing runtime behavior.
- `isolatedModules: true` can be added like in the reference; check that `src/` has no re-exports of types
  that would need `export type`.
- `include` stays `["src/**/*.ts"]`. Do **not** add a second root like `tests/`: TypeScript would then use the
  repo root as the common root, and the declarations would move to `dist/src/main.d.ts`, which breaks
  `package.json#types`.

### Tests in `src/__tests__/`

Same layout as `migrate-mongo-sag`. One `tsconfig.json` covers source and tests, for `yarn typecheck` and the IDE.

- Move `tests/params.spec.ts` and `tests/parse.spec.ts` to `src/__tests__/` and fix the imports
  (`../src/utils` → `../utils`, `../src/parse` → `../parse`). Delete the empty `tests/` folder.
- Jest's default `testMatch` already finds `__tests__` folders and `*.spec.ts` files. But it would also pick up
  `dist/__tests__/*.spec.d.ts` after a build, so `jest.config.js` sets `roots: ["<rootDir>/src"]`.
- ncc always reads `tsconfig.json` (no option for another config file) and emits a declaration for **every**
  file in it, not only for files reachable from `main.ts` (that is why `dist/run.d.ts` exists). So the build
  will also produce `dist/__tests__/*.spec.d.ts`. Keep them out of the package by adding `"!dist/__tests__"` to
  `files` in `package.json`.
- Drop `-e tests` from the `build` script. In ncc, `-e` marks a module named `tests` as external; it never
  excluded the test folder and has no effect.

### Scripts and CI

- `lint`: `eslint .` (lints the config files too). Drop `--fix` so CI only reports; use the VS Code fix-on-save
  or `yarn lint --fix` locally.
- `typecheck`: `tsc --noEmit`, added to `.github/workflows/ci.yaml` between `yarn lint` and `yarn test`
  (same order as `migrate-mongo-sag`).
- `format`: `prettier --write --experimental-cli src/` (Prettier 3, same as the reference).

### Things to watch

- ESLint 10 looks up the config **from the directory of each linted file**, not from the cwd. With a
  single root config that makes no difference here.
- `/* eslint-env */` comments now cause **errors**. The only one is in `.eslintsag.cjs`, which is deleted.
- Node requirement: `^20.19 || ^22.13 || >=24`. Volta pins 24.22.1, so CI is fine.
- typescript-eslint v8 changed `recommended` (for example `no-unused-vars` options,
  `no-unused-expressions`, `no-require-imports`). Expect a few new findings in `src/` and `jest.config.js`.
  Result: only the new ESLint 10 rule `preserve-caught-error` reported 7 findings in `main.ts` / `vaultcli.ts`.
  Fixed by passing `{ cause: error }` to the rethrown errors; the messages stay the same.
- **ts-jest and TS 6:** the installed `ts-jest@29.4.6` declares the peer `typescript >=4.3 <6`. Expect a peer
  warning from yarn and possibly a version warning from ts-jest. Also, ts-jest forces `module: CommonJS`, which
  does not combine with `moduleResolution: "bundler"`, and its fallback to `node10` resolution is deprecated in
  TS 6. If this breaks the tests, give ts-jest its own compiler options in `jest.config.js`
  (e.g. `tsconfig: { module: "CommonJS", moduleResolution: "node16" }` or `isolatedModules`/transpile-only)
  instead of weakening the main `tsconfig.json`. The Vitest switch (next ticket) removes this problem for good.
  Result: the tests failed with TS5107 (`node10` deprecated). `jest.config.js` now uses the `transform` syntax
  with `tsconfig: { module: "Node16", moduleResolution: "Node16", esModuleInterop: true }`. The yarn peer warning
  for ts-jest remains until the Vitest switch.
- **ncc and TS 6:** `@vercel/ncc@0.38` loads the project's own `typescript` package via its bundled `ts-loader`.
  Run `yarn build` before and after the update and diff `dist/main.d.ts` (exported API must be identical) and
  check that `dist/index.js` still runs (the `run` script: `yarn run run`). ncc does not clean `dist/` (an old
  `sagctl.d.ts` is still lying around), so delete `dist/` before each build. Also compare
  `npm pack --dry-run` before and after; the file list must be the same.
- Prettier 3 may reformat a few lines in `src/`. Keep that in a separate commit so the review stays readable.
  `--experimental-cli` needs Prettier `>=3.6`.
- After changing dependencies, run `yarn dedupe` so old `@typescript-eslint@5` / `eslint@8` leftovers leave `yarn.lock`.
