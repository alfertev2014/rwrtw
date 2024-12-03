// @ts-check

import js from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierConfig from "eslint-config-prettier"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    ignores: ["**/eslint.config.js", "**/jest.config.js", "dist"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.lib.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/__test__/**/*.ts", "**/*.test*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.jest.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
)
