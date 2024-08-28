import { defineConfig } from "rollup";
import ts from "rollup-plugin-ts"
import terser from '@rollup/plugin-terser'

export default defineConfig({
  input: "src/index.ts",
  output: {
    file: "lib/index.js",
    format: "es",
  },
  plugins: [
    ts({
      browserslist: false,
    }),
    terser()
  ]
})
