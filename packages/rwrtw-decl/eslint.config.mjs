import baseConfig from "../../eslint.config.mjs"

export default [
  ...baseConfig,
  {
    ignores: ["**/out-tsc", "src/ui-compiler/**"],
  },
]
