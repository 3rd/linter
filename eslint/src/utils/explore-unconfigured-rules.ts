import picocolors from "picocolors";
import type Project from "../Project";

const { yellow, gray, green, magenta, bold } = picocolors;

const wrap = (text: string) => text.replace(/(?![^\n]{1,64}$)([^\n]{1,64})\s/g, "$1\n");

const explore = (project: Project) => {
  for (const [_, currentModule] of project.modules.entries()) {
    const unconfiguredRules = Object.values(Object.fromEntries(currentModule.rules)).filter((rule) => {
      if (currentModule.name !== "base" && rule.prefix === "") return false;
      return !rule.isConfigured;
    });

    if (currentModule.config.overrides) {
      for (const override of currentModule.config.overrides) {
        if (override.rules) {
          for (const [ruleName] of Object.entries(override.rules)) {
            const index = unconfiguredRules.findIndex((rule) => rule.key === ruleName);
            if (index !== -1) {
              unconfiguredRules.splice(index, 1);
            }
          }
        }
      }
    }

    console.log(
      `> Module ${currentModule.name}: ${unconfiguredRules.length} unconfigured rules out of ${currentModule.rules.size}`
    );

    if (!currentModule.shouldBeExplored) {
      console.log("Skipping exploration...");
      continue;
    }

    for (const rule of unconfiguredRules) {
      console.log(`${gray("==========================")}`);
      console.log(`${bold(yellow(rule.key))}`);
      console.log(`${gray("--------------------------")}`);
      console.log(`${green(wrap(rule.description))}`);
      if (rule.source?.meta.docs?.url) {
        console.log(`${magenta(rule.source.meta.docs.url)}`);
      }
      console.log(`${gray("--------------------------")}`);
      // console.log(`${cyan(wrap(JSON.stringify(rule.schema, null, 2)))}`);
    }

    if (unconfiguredRules.length > 0) {
      process.exit(0);
    }
  }
};

export { explore };
