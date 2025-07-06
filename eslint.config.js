//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  ...tanstackConfig,
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
];
