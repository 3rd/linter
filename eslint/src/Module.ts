import { omit } from "lodash";
import type { IESLintConfig } from "./eslint/eslint-types";
import { plugins as eslintPlugins } from "./eslint/plugins";
import { Rule } from "./Rule";

type TModuleConfig = IESLintConfig & {
  match?: string | string[];
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

        for (const rule of plugin.rules) {
          this.addRule(new Rule(rule.name, rule.source, rule.prefix));
        }
      }
    }

    if (config.rules) {
      for (const [ruleName, ruleConfig] of Object.entries(config.rules)) {
        const rule = this.rules.get(ruleName);
        if (!rule) throw new Error(`[module:${name}] Can't find rule: ${ruleName}`);

        rule.setConfig(ruleConfig);
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
      ...omit(this.config, "enabled", "match", "explore", "rules"),
      plugins: (this.config.plugins ?? []).filter((name) => name !== "builtin"),
    };
  }
}

export type { TModuleConfig };
export { Module };
