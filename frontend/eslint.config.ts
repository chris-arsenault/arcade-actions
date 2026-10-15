import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import sonar from "eslint-plugin-sonarjs";
import prettier from "eslint-config-prettier";
import * as ahara from "@ahara/standards/eslint-rules";
import { defineConfig } from "eslint/config";
import type { Linter } from "eslint";

const sonarRules = (sonar.configs?.recommended as { rules: Linter.RulesRecord }).rules;

export default defineConfig(
  { ignores: ["node_modules/**", "dist/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      ahara: {
        rules: {
          "max-jsx-props": ahara.maxJsxProps,
          "no-inline-styles": ahara.noInlineStyles,
          "no-direct-fetch": ahara.noDirectFetch,
          "no-direct-store-import": ahara.noDirectStoreImport,
          "no-escape-hatches": ahara.noEscapeHatches,
          "no-manual-async-state": ahara.noManualAsyncState,
          "no-manual-view-header": ahara.noManualViewHeader,
          "no-manual-expand-state": ahara.noManualExpandState,
          "no-raw-undefined-union": ahara.noRawUndefinedUnion,
          "no-non-vitest-testing": ahara.noNonVitestTesting,
          "no-js-file-extension": ahara.noJsFileExtension,
        },
      },
    },
    rules: {
      complexity: ["error", 10],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 75, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 4],
      "ahara/max-jsx-props": "warn",
      "ahara/no-inline-styles": "error",
      "ahara/no-direct-fetch": "error",
      "ahara/no-direct-store-import": "warn",
      "ahara/no-escape-hatches": "error",
      "ahara/no-manual-async-state": "warn",
      "ahara/no-manual-view-header": "warn",
      "ahara/no-manual-expand-state": "warn",
      "ahara/no-raw-undefined-union": "warn",
      "ahara/no-non-vitest-testing": "error",
      "ahara/no-js-file-extension": "error",
    },
  },
  { plugins: { sonarjs: sonar }, rules: sonarRules },
  prettier
);
