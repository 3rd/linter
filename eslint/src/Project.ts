import { parse as parsePath, resolve } from "path";
import { existsSync, readFileSync, statSync } from "fs";
import { packageDirectorySync } from "pkg-dir";
import type { PackageJson } from "type-fest";
import { findUpSync } from "find-up";
import { LINTER_CONFIG_DIR } from "./env";
import { getFilesDeep, merge, readYAML } from "./utils";
import { Module } from "./Module";
import type { IESLintConfig } from "./eslint/eslint-types";
import type { TModuleConfig } from "./Module";

enum DEPENDENCY_TYPE {
  NORMAL = "NORMAL",
  DEVELOPMENT = "DEVELOPMENT",
  PEER = "PEER",
}

interface IProjectDependency {
  name: string;
  type: DEPENDENCY_TYPE;
  version: string;
  path: string;
}

class Project {
  root: string;
  modules: Module[] = [];
  dependencies: IProjectDependency[] = [];
  packageJson: PackageJson = {} as PackageJson;

  constructor(root: string) {
    this.root = root;
    this.load();
  }

  static resolveFromPath(path: string) {
    const root = packageDirectorySync({ cwd: path }) ?? path;
    return new Project(root);
  }

  getRoots(): string[] {
    const roots: string[] = [];
    let currentRoot = this.root;
    let packageJsonFound = true;

    while (packageJsonFound) {
      const packageJsonDir = packageDirectorySync({ cwd: currentRoot });

      if (packageJsonDir) {
        roots.push(packageJsonDir);
        currentRoot = resolve(packageJsonDir, "..");
      } else {
        packageJsonFound = false;
      }
    }

    return roots;
  }

  get context(): Record<string, boolean> {
    return {
      "react-native": this.hasDependency("react-native"),
      "react-web": this.hasDependency("react") && !this.hasDependency("react-native"),
      browser: !this.packageJson.engines?.node,
      graphql: this.hasDependency("graphql"),
      jest: this.hasDependency("jest"),
      next: this.hasDependency("next"),
      node: Boolean(this.packageJson.engines?.node),
      react: this.hasDependency("react"),
      svelte: this.hasDependency("svelte"),
      typescript: this.hasPath("tsconfig.json") || this.hasDependency("typescript"),
      vue: this.hasDependency("vue"),
    };
  }

  load() {
    const roots = this.getRoots();
    const dependencies: IProjectDependency[] = [];

    if (roots.length > 0) {
      this.packageJson = JSON.parse(readFileSync(resolve(roots[0], "package.json"), "utf8")) as PackageJson;
    }

    for (const root of roots) {
      const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as PackageJson;
      dependencies.push(
        ...Object.entries(packageJson.dependencies ?? {}).map(([k, v]) => ({
          name: k,
          version: v ?? "",
          type: DEPENDENCY_TYPE.NORMAL,
          path: resolve(root, "node_modules", k),
        })),
        ...Object.entries(packageJson.devDependencies ?? {}).map(([k, v]) => ({
          name: k,
          version: v ?? "",
          type: DEPENDENCY_TYPE.DEVELOPMENT,
          path: resolve(root, "node_modules", k),
        })),
        ...Object.entries(packageJson.peerDependencies ?? {}).map(([k, v]) => ({
          name: k,
          version: v ?? "",
          type: DEPENDENCY_TYPE.PEER,
          path: resolve(root, "node_modules", k),
        })),
      );
    }
    this.dependencies = dependencies;

    this.modules = getFilesDeep(resolve(LINTER_CONFIG_DIR, "modules"))
      .filter((modulePath) => !modulePath.includes(".disabled"))
      .map((modulePath) => {
        const { name } = parsePath(modulePath);
        return new Module(name, readYAML(modulePath) as TModuleConfig);
      })
      .filter((module) => {
        if (!module.enabled) return false;
        if (process.env.EXPLORE) return true;
        if (!module.config.match) return true;
        for (const matchRule of Array.isArray(module.config.match) ?
          module.config.match
        : [module.config.match]) {
          if (!this.context[matchRule as string]) return false;
        }
        return true;
      });
  }

  findDependency(name: string, type?: DEPENDENCY_TYPE) {
    return this.dependencies.find((dependency) => {
      if (type && dependency.type !== type) return false;
      return dependency.name === name;
    });
  }

  hasDependency(name: string, type?: DEPENDENCY_TYPE) {
    return Boolean(this.findDependency(name, type));
  }

  hasPath(path: string) {
    return existsSync(resolve(this.root, path));
  }

  hasDirectory(path: string) {
    if (!this.hasPath(path)) return false;
    return statSync(resolve(this.root, path)).isDirectory();
  }

  hasFile(path: string) {
    if (!this.hasPath(path)) return false;
    return statSync(resolve(this.root, path)).isFile();
  }

  getConfig() {
    let config: IESLintConfig = {
      extends: [],
    };
    for (const module of this.modules) {
      config = merge(config, module.getConfig()) as IESLintConfig;
    }

    // load project-local rule overrides
    try {
      const localConfigPath = findUpSync("eslinter.yml");
      if (localConfigPath) {
        const localConfig = readYAML(localConfigPath) as IESLintConfig;

        if (localConfig.rules) {
          if (!config.rules) config.rules = {};
          for (const [rule, value] of Object.entries(localConfig.rules)) {
            config.rules[rule] = value;
          }
        }
      }
    } catch {}

    // parserOptions.project - handle tsconfig.json in upper project
    if (this.context.typescript && !this.hasFile("tsconfig.json")) {
      const tsconfigPath = findUpSync("tsconfig.json");
      if (tsconfigPath) {
        const overrides = config.overrides ?? [];
        for (const override of overrides) {
          if (override.parserOptions?.project === "tsconfig.json") {
            override.parserOptions = {
              ...override.parserOptions,
              // project: tsconfigPath,
              tsconfigRootDir: tsconfigPath.replace("tsconfig.json", ""),
            };
          }
        }
        config.overrides = overrides;
      }
    }

    // oxlint
    config.extends = [
      ...(Array.isArray(config.extends) ? config.extends : [config.extends!]),
      "plugin:oxlint/all",
    ];
    for (const override of config.overrides ?? []) {
      const patched: string[] = [];
      if (typeof override.extends === "string") {
        patched.push(override.extends);
      }
      if (Array.isArray(override.extends)) {
        for (const extend of override.extends) {
          patched.push(extend);
        }
      }
      patched.push("plugin:oxlint/all");
      override.extends = patched;
    }

    return config;
  }
}

export { Project };
