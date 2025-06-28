/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { JSONSchema7 } from "json-schema";

enum ESLINT_PLUGIN_RULE_TYPE {
  LAYOUT = "layout",
  PROBLEM = "problem",
  SUGGESTION = "suggestion",
}

interface IESLintPluginRule {
  meta: {
    type?: ESLINT_PLUGIN_RULE_TYPE;
    docs?: {
      description?: string;
      category?: string;
      recommended?: boolean;
      url?: string;
    };
    fixable?: "code" | "whitespace";
    hasSuggestions?: boolean;
    deprecated?: boolean;
    schema?: JSONSchema7;
  };
}

interface IESLintPlugin {
  rules?: Record<string, IESLintPluginRule>;
}

type TESLintConfigEnvValue =
  | "browser"
  | "commonjs"
  | "es2017"
  | "es2020"
  | "es2021"
  | "es6"
  | "jest"
  | "node"
  | "serviceworker"
  | "webextensions"
  | "worker";
type TESLintConfigRuleValue =
  | "error"
  | "off"
  | "warn"
  | ["error" | "off" | "warn" | 0 | 1 | 2, ...unknown[]]
  | 0
  | 1
  | 2;
interface IESLintConfig {
  root?: boolean;
  parser?: string;
  parserOptions?: {
    ecmaVersion?: "latest" | number;
    sourceType?: "module" | "script";
    ecmaFeatures?: {
      globalReturn?: boolean;
      impliedStrict?: boolean;
      jsx?: boolean;
    };
    // @typescript-eslint/parser
    project?: string[] | string;
    jsxPragma?: string;
    jsxFragmentName?: string;
    lib?: string[];
    tsconfigRootDir?: string;
    projectFolderIgnoreList?: string[];
    extraFileExtensions?: string[];
  };
  env?: Record<TESLintConfigEnvValue, true>;
  extends?: string[] | string;
  plugins?: string[];
  rules?: Record<string, TESLintConfigRuleValue>;
  settings?: Record<string, unknown>;
  ignorePatterns?: string[];
  overrides?: (Partial<IESLintConfig> & {
    files?: string[];
  })[];
}

export type { IESLintConfig, IESLintPlugin, IESLintPluginRule, TESLintConfigEnvValue, TESLintConfigRuleValue };
export { ESLINT_PLUGIN_RULE_TYPE };
