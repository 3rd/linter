import picocolors from "picocolors";
import type { Module } from "../Module";
import type { Project } from "../Project";

const { yellow, gray, green, magenta, bold } = picocolors;

const wrapDescription = (text: string) => text.replace(/(?![^\n]{1,64}$)([^\n]{1,64})\s/g, "$1\n");

const getUnconfiguredRules = (module: Module) => {
  const unconfiguredRules = Object.values(Object.fromEntries(module.rules)).filter((rule) => {
    const isBuiltinRuleOutsideBase = module.name !== "base" && rule.prefix === "";
    if (isBuiltinRuleOutsideBase) return false;

    return !rule.isConfigured;
  });

  const overriddenRules = new Set<string>();

  for (const override of module.config.overrides ?? []) {
    if (!override.rules) continue;

    for (const ruleName of Object.keys(override.rules)) {
      overriddenRules.add(ruleName);
    }
  }

  return unconfiguredRules.filter((rule) => !overriddenRules.has(rule.key));
};

const explore = (project: Project) => {
  for (const currentModule of project.modules) {
    const unconfiguredRules = getUnconfiguredRules(currentModule);

    console.log(
      `> Module ${currentModule.name}: ${unconfiguredRules.length} unconfigured rules out of ${currentModule.rules.size}`,
    );

    if (!currentModule.shouldBeExplored) {
      console.log("Skipping exploration...");

      continue;
    }

    for (const rule of unconfiguredRules) {
      console.log(`${gray("==========================")}`);
      console.log(`${bold(yellow(rule.key))}`);
      console.log(`${gray("--------------------------")}`);
      console.log(`${green(wrapDescription(rule.description))}`);

      if (rule.source?.meta.docs?.url) {
        console.log(`${magenta(rule.source.meta.docs.url)}`);
      }

      console.log(`${gray("--------------------------")}`);
      // console.log(`${cyan(wrapDescription(JSON.stringify(rule.schema, null, 2)))}`);
    }

    if (unconfiguredRules.length > 0) {
      process.exit(0);
    }
  }
};

export { explore };
