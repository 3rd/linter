import { readdirSync } from "fs";
import { resolve } from "path";

const getFilesDeep = (path: string) => {
  const files: string[] = [];
  const directories: string[] = [];

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      directories.push(resolve(path, entry.name));
    }

    if (!entry.isFile()) continue;

    files.push(resolve(path, entry.name));
  }

  for (const directory of directories) {
    files.push(...getFilesDeep(directory));
  }

  return files;
};

export { getFilesDeep };
