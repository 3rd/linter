import { omit } from "lodash";
import { plugins as eslintPlugins } from "./eslint/plugins";
import { Rule } from "./Rule";
import type { IESLintConfig, TESLintConfigRuleValue } from "./eslint/eslint-types";

type TModuleConfig = IESLintConfig & {
  match?: Record<string, boolean>;
  enabled?: boolean;
  explore?: boolean;
};

class Module {
  name: string;
  enabled: boolean;
  config: TModuleConfig;
  rules = new Map<string, Rule>();

  constructor(name: string, config: TModuleConfig = {}) {
    this.name = name;
    this.enabled = config.enabled ?? true;
    this.config = config;

    if (config.plugins) {
      for (const pluginName of config.plugins) {
        const plugin = eslintPlugins[pluginName];
        if (!plugin) throw new Error(`Unknown plugin: ${pluginName}`);
        for (const rule of plugin.rules) this.addRule(rule);
      }
    }

    if (config.rules) {
      for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
        const rule = this.rules.get(ruleName);
        if (!rule) throw new Error(`[module:${name}] Can't find rule: ${ruleName}`);
        rule.setConfig(ruleConfig);
        this.rules.set(ruleName, rule);
      }
    }
  }

  get shouldBeExplored() {
    return Boolean(this.config.explore);
  }

  addRule(rule: Rule) {
    if (this.rules.has(rule.key)) {
      throw new Error(`Error: Module "${this.name}" has already registered rule "${rule.key}".`);
    }

    this.rules.set(rule.key, rule);
  }

  getConfig() {
    return {
      ...omit(this.config, "enabled", "match", "explore"),
      plugins: (this.config.plugins ?? []).filter((name) => name !== "builtin"),
      rules: Object.entries(Object.fromEntries(this.rules)).reduce<Record<string, TESLintConfigRuleValue>>(
        (acc, [key, rule]) => {
          acc[key] = rule.config;
          return acc;
        },
        {}
      ),
    } as IESLintConfig;
  }
}

export type { TModuleConfig };
export { Module };
