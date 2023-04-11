/* eslint-env node */

module.exports = {
  root: false,
  plugins: ["import"],
  rules: {
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/explicit-member-accessibility": "error",
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "import/no-self-import": "error"
  }
};
