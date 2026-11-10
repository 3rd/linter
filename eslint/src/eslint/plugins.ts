import { resolve } from "path";
import type { IESLintPlugin } from "./eslint-types";
import { LINTER_CONFIG_DIR } from "../env";
import { Rule } from "../Rule";
import { readYAML } from "../utils";
import { getBuiltinRulesPlugin } from "./eslint-builtin";

interface RegisteredPlugin {
  name: string;
  prefix: string;
  rules: Rule[];
}

type PluginConfig = Pick<RegisteredPlugin, "name" | "prefix"> | string;

const loadPlugin = (config: PluginConfig) => {
  const { name, prefix } = typeof config === "string" ? { name: config, prefix: config } : config;
  const rules: Rule[] = [];

  const pluginModule =
    name === "builtin" ? getBuiltinRulesPlugin() : (require(name) as unknown as IESLintPlugin);
  if (pluginModule.rules) {
    for (const [ruleName, source] of Object.entries(pluginModule.rules)) {
      rules.push(new Rule(ruleName, source, prefix));
    }
  }

  return { name, prefix, rules };
};

const pluginConfigs = readYAML(resolve(LINTER_CONFIG_DIR, "plugins.yml")) as PluginConfig[];
const plugins = pluginConfigs.reduce<Record<string, RegisteredPlugin>>((pluginsByName, config) => {
  const plugin = loadPlugin(config);
  pluginsByName[plugin.name] = plugin;

  return pluginsByName;
}, {});

export { plugins };
