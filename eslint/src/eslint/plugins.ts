import { resolve } from "path";
import type { IESLintPlugin } from "./eslint-types";
import { LINTER_CONFIG_DIR } from "../env";
import { Rule } from "../Rule";
import { readYAML } from "../utils";
import { getBuiltinRulesPlugin } from "./eslint-builtin";

const plugins = (
  readYAML(resolve(LINTER_CONFIG_DIR, "plugins.yml")) as ({ name: string; prefix: string } | string)[]
).reduce<Record<string, { name: string; prefix: string; rules: Rule[] }>>((acc, curr) => {
  const plugin = {
    name: "",
    prefix: "",
    rules: [],
  } as { name: string; prefix: string; rules: Rule[] };

  if (typeof curr === "string") {
    plugin.name = curr;
    plugin.prefix = curr;
  } else {
    plugin.name = curr.name;
    plugin.prefix = curr.prefix;
  }

  const pluginModule =
    plugin.name === "builtin" ? getBuiltinRulesPlugin() : (require(plugin.name) as unknown as IESLintPlugin);
  if (pluginModule.rules) {
    for (const [k, v] of Object.entries(pluginModule.rules)) {
      const rule = new Rule(k, v, plugin.prefix);
      plugin.rules.push(rule);
    }
  }

  acc[plugin.name] = plugin;
  return acc;
}, {});

export { plugins };
