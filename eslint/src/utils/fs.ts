import { readdirSync } from "fs";
import { resolve } from "path";

type TLSEntry = {
  name: string;
  path: string;
};

const getFilesDeep = (path: string) => {
  const entries = readdirSync(path, { withFileTypes: true }).reduce<{ dirs: TLSEntry[]; files: TLSEntry[] }>(
    (acc, curr) => {
      if (curr.isDirectory()) {
        acc.dirs.push({
          name: curr.name,
          path: resolve(path, curr.name),
        });
      }
      if (curr.isFile()) {
        acc.files.push({
          name: curr.name,
          path: resolve(path, curr.name),
        });
      }
      return acc;
    },
    {
      dirs: [],
      files: [],
    }
  );

  const files: string[] = [];
  files.push(...entries.files.map((entry) => entry.path));
  for (const directory of entries.dirs) {
    files.push(...getFilesDeep(directory.path));
  }

  return files;
};

export { getFilesDeep };
