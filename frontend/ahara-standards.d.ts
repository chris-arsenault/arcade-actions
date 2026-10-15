declare module "@ahara/standards/eslint-rules" {
  import type { Rule } from "eslint";
  export const maxJsxProps: Rule.RuleModule;
  export const noInlineStyles: Rule.RuleModule;
  export const noDirectFetch: Rule.RuleModule;
  export const noDirectStoreImport: Rule.RuleModule;
  export const noEscapeHatches: Rule.RuleModule;
  export const noManualAsyncState: Rule.RuleModule;
  export const noManualViewHeader: Rule.RuleModule;
  export const noManualExpandState: Rule.RuleModule;
  export const noRawUndefinedUnion: Rule.RuleModule;
  export const noNonVitestTesting: Rule.RuleModule;
  export const noJsFileExtension: Rule.RuleModule;
}
