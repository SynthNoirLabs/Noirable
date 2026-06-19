import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Code style rules from docs/DEVELOPMENT.md
      // "warn" to allow incremental cleanup (11 pre-existing violations in src/)
      eqeqeq: ["warn", "always"],
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "error",
      // "warn" to allow incremental cleanup of existing console.log usage
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // "warn" to allow incremental cleanup (1 pre-existing violation in CustomCodeSandbox.tsx)
      "import/no-default-export": "warn",
    },
  },
  {
    // Override: allow default exports in Next.js special files and config files
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/route.ts",
      "src/app/**/not-found.tsx",
      "src/app/**/error.tsx",
      "*.config.*",
      "next.config.ts",
      "playwright.config.ts",
      "vitest.config.ts",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
]);

export default eslintConfig;
