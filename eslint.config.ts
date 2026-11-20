import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import skipFormatting from "eslint-config-prettier/flat";
import pluginImportX from "eslint-plugin-import-x";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    globalIgnores(["dist/", ".yarn/"]),

    {
        name: "app/typescript",
        files: ["**/*.{ts,mts}"],
        extends: [js.configs.recommended, tseslint.configs.recommended],
        languageOptions: { ecmaVersion: "latest", globals: globals.node },
        rules: {
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/explicit-member-accessibility": "error"
        }
    },

    {
        name: "app/imports",
        files: ["**/*.{ts,mts,js,mjs}"],
        plugins: {
            "import-x": pluginImportX
        },
        rules: {
            "import-x/first": "error",
            "import-x/newline-after-import": "error",
            "import-x/no-duplicates": "error",
            "import-x/no-self-import": "error"
        }
    },

    {
        // jest loads its config as CommonJS
        name: "app/jest-config",
        files: ["jest.config.js"],
        extends: [js.configs.recommended],
        languageOptions: { ecmaVersion: "latest", sourceType: "commonjs", globals: globals.node }
    },

    skipFormatting
);
