import { ESLINT_PLUGIN_RULE_TYPE } from "./eslint/eslint-types";
import type { IESLintPluginRule, TESLintConfigRuleValue } from "./eslint/eslint-types";

class Rule {
  name: string;
  prefix: string;
  source?: IESLintPluginRule;
  config: TESLintConfigRuleValue = ["off"];
  isConfigured = false;

  constructor(name: string, source?: IESLintPluginRule | null, prefix = "") {
    this.name = name;
    if (source) this.source = source;
    this.prefix = prefix === "builtin" ? "" : prefix;
  }

  get key() {
    return `${this.prefix}${this.prefix ? "/" : ""}${this.name}`;
  }

  get type() {
    return this.source?.meta.type ?? ESLINT_PLUGIN_RULE_TYPE.PROBLEM;
  }

  get description() {
    return this.source?.meta.docs?.description ?? "";
  }

  get schema() {
    return this.source?.meta.schema;
  }

  get isFixable() {
    return Boolean(this.source?.meta.fixable);
  }

  setConfig(config: TESLintConfigRuleValue) {
    this.config = config;
    this.isConfigured = true;
  }
}

export { Rule };
