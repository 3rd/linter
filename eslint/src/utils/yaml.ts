import { readFileSync } from "fs";
import yaml from "yaml";

const readYAML = (path: string) => {
  const text = readFileSync(path, "utf8");
  return yaml.parse(text) as unknown;
};

export { readYAML };
