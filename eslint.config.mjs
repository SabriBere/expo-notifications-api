import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      eqeqeq: "error",
      "no-var": "error",
      "no-console": "off",
      "require-await": "warn",
      "no-unused-vars": "warn",
      "no-inline-comments": "off",
      "no-duplicate-imports": "warn",
      "array-callback-return": "off",
    },
  },
  {
    name: "prettier",
    ...prettier,
  },
];
