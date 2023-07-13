import path from "path";
import fs from "fs";
import Project from "./Project";
import { LINTER_ROOT } from "./env";
import { explore } from "./utils/explore-unconfigured-rules";

const projectRoot = process.env.ESLINTER_DIR ?? process.cwd();
const configPath = path.resolve(LINTER_ROOT, "output", `${Buffer.from(projectRoot).toString("base64")}.json`);

if (require.main === module) {
  // require("./utils/modulePatch");
  // const Project = require("./Project").default;
  const project = Project.resolveFromPath(projectRoot);

  if (process.env.EXPLORE) {
    // const { explore } = require("./utils/explore-unconfigured-rules");
    explore(project);
  } else {
    const config = project.getConfig();
    // console.log(config.overrides);
  }
} else if (fs.existsSync(configPath)) {
  module.exports = require(configPath);
} else {
  // require("./utils/modulePatch");
  const project = Project.resolveFromPath(projectRoot);
  const config = project.getConfig();

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  module.exports = config;
}
