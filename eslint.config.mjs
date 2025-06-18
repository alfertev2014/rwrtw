import nx from "@nx/eslint-plugin"
import tseslint from "typescript-eslint"

export default tseslint.config([
  ...nx.configs["flat/base"],
  ...nx.configs["flat/javascript"],
  ...nx.configs["flat/typescript"],
  {
    ignores: ["**/dist"],
  },
  {
    extends: [...tseslint.configs.strictTypeChecked],
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
          banTransitiveDependencies: true,
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    // Override or add rules here
    rules: {},
  },
])
