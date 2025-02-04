// @ts-check

import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierConfig from "eslint-config-prettier"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    ignores: [
      "**/__test__/**",
      "**/eslint.config.js",
      "dist",
      "**/webpack.config.js",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
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
