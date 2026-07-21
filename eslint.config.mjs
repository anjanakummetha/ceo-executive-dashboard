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
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19's set-state-in-effect rule fires on standard, correct patterns
      // used throughout the dashboard: fetch-on-mount (setLoading(true) at the top
      // of a useCallback invoked by an effect), hydration-safe client init reading
      // localStorage / the clock, and run-once latches. None are dependency loops.
      // Keep it as an advisory rather than a build-blocking error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
