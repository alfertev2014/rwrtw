import { defineConfig } from "eslint/config"
import baseConfig from "../../eslint.config.mjs"

export default defineConfig([
  ...baseConfig,
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: ["{projectRoot}/eslint.config.{js,cjs,mjs}"],
        },
      ],
    },
    languageOptions: {
      parser: await import("jsonc-eslint-parser"),
    },
  },
])
