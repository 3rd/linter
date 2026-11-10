import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { LINTER_ROOT } from "./env";
import { Project } from "./Project";
import { explore } from "./utils/explore-unconfigured-rules";

const projectRoot = process.env.ESLINTER_DIR ?? process.cwd();
const projectRootBase64 = Buffer.from(projectRoot).toString("base64");
const outputFileHash = createHash("md5").update(projectRootBase64).digest("hex");
const configPath = path.resolve(LINTER_ROOT, "output", `${outputFileHash}.json`);

if (require.main === module) {
  const project = Project.resolveFromPath(projectRoot);

  if (process.env.EXPLORE) {
    explore(project);
  } else {
    const config = project.getConfig();
    console.log(config);
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
