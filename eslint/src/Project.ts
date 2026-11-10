import { findUpSync } from "find-up";
import { existsSync, readFileSync, statSync } from "fs";
import { cloneDeep } from "lodash";
import { parse as parsePath, resolve } from "path";
import { packageDirectorySync } from "pkg-dir";
import type { PackageJson } from "type-fest";
import { readConfigFile, sys } from "typescript";
import type { IESLintConfig } from "./eslint/eslint-types";
import type { TModuleConfig } from "./Module";
import { LINTER_CONFIG_DIR } from "./env";
import { Module } from "./Module";
import { getFilesDeep, merge, readYAML } from "./utils";

enum DEPENDENCY_TYPE {
  DEVELOPMENT = "DEVELOPMENT",
  NORMAL = "NORMAL",
  PEER = "PEER",
}

interface IProjectDependency {
  name: string;
  type: DEPENDENCY_TYPE;
  version: string;
  path: string;
}

const getPackageDependencies = (dependencies: PackageJson["dependencies"], type: DEPENDENCY_TYPE, root: string) => {
  return Object.entries(dependencies ?? {}).map(([name, version]) => ({
    name,
    version: version ?? "",
    type,
    path: resolve(root, "node_modules", name),
  }));
};

class Project {
  root: string;
  modules: Module[] = [];
  dependencies: IProjectDependency[] = [];
  packageJson: PackageJson = {};

  constructor(root: string) {
    this.root = root;
    this.load();
  }

  static resolveFromPath(path: string) {
    const root = packageDirectorySync({ cwd: path }) ?? path;

    return new Project(root);
  }

  getRoots() {
    const roots: string[] = [];
    let currentRoot = this.root;

    while (true) {
      const packageJsonDir = packageDirectorySync({ cwd: currentRoot });
      if (!packageJsonDir) break;

      roots.push(packageJsonDir);
      currentRoot = resolve(packageJsonDir, "..");
    }

    return roots;
  }

  get context(): Record<string, boolean> {
    return {
      "react-native": this.hasDependency("react-native"),
      "react-web": this.hasDependency("react") && !this.hasDependency("react-native"),
      browser: !this.packageJson.engines?.node,
      jest: this.hasDependency("jest"),
      next: this.hasDependency("next"),
      node: Boolean(this.packageJson.engines?.node),
      react: this.hasDependency("react"),
      svelte: this.hasDependency("svelte"),
      typescript: this.hasPath("tsconfig.json") || this.hasDependency("typescript"),
      vue: this.hasDependency("vue"),
      astro: this.hasDependency("astro"),
    };
  }

  load() {
    this.loadDependencies();
    this.loadModules();
  }

  private loadDependencies() {
    const roots = this.getRoots();
    const dependencies: IProjectDependency[] = [];

    if (roots.length > 0) {
      this.packageJson = JSON.parse(readFileSync(resolve(roots[0], "package.json"), "utf8")) as PackageJson;
    }

    for (const root of roots) {
      const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as PackageJson;
      dependencies.push(
        ...getPackageDependencies(packageJson.dependencies, DEPENDENCY_TYPE.NORMAL, root),
        ...getPackageDependencies(packageJson.devDependencies, DEPENDENCY_TYPE.DEVELOPMENT, root),
        ...getPackageDependencies(packageJson.peerDependencies, DEPENDENCY_TYPE.PEER, root),
      );
    }

    this.dependencies = dependencies;
  }

  private loadModules() {
    this.modules = getFilesDeep(resolve(LINTER_CONFIG_DIR, "modules"))
      .filter((modulePath) => !modulePath.includes(".disabled"))
      .map((modulePath) => {
        const { name } = parsePath(modulePath);

        return new Module(name, readYAML(modulePath) as TModuleConfig);
      })
      .filter((module) => this.matchesModule(module));
  }

  private matchesModule(module: Module) {
    if (!module.enabled) return false;
    if (process.env.EXPLORE) return true;
    if (!module.config.match) return true;

    const matchRules = Array.isArray(module.config.match) ? module.config.match : [module.config.match];

    for (const matchRule of matchRules) {
      if (!this.context[matchRule]) return false;
    }

    return true;
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

  hasTypeScriptProjectReferences() {
    if (!this.hasFile("tsconfig.json")) return false;

    const result = readConfigFile(resolve(this.root, "tsconfig.json"), sys.readFile);
    if (result.error) return false;

    const config: unknown = result.config;
    const hasReferencesField = typeof config === "object" && config !== null && "references" in config;
    if (!hasReferencesField) return false;

    return Array.isArray(config.references) && config.references.length > 0;
  }

  private getMergedConfig() {
    let config: IESLintConfig = {};

    for (const module of this.modules) {
      const { rules: previousRules, ...configWithoutRules } = config;
      const rules = { ...previousRules };

      for (const [ruleName, rule] of module.rules) {
        const shouldPreserveEarlierSetting = !rule.isConfigured && Object.hasOwn(rules, ruleName);
        if (shouldPreserveEarlierSetting) continue;

        rules[ruleName] = cloneDeep(rule.config);
      }

      config = merge(configWithoutRules, module.getConfig()) as IESLintConfig;
      config.rules = rules;
    }

    const localConfigPath = findUpSync("eslinter.yml");
    if (localConfigPath) {
      const localConfig = readYAML(localConfigPath) as IESLintConfig;
      if (localConfig?.rules) {
        if (!config.rules) {
          config.rules = {};
        }

        for (const [rule, value] of Object.entries(localConfig.rules)) {
          config.rules[rule] = value;
        }
      }

      if (localConfig?.overrides) {
        config.overrides = [...(config.overrides ?? []), ...localConfig.overrides];
      }
    }

    return config;
  }

  getConfig() {
    const config = this.getMergedConfig();

    if (this.hasFile("tsconfig.app.json")) {
      const overrides = config.overrides ?? [];
      for (const override of overrides) {
        if (override.parserOptions?.project === true) {
          override.parserOptions.project = "tsconfig.app.json";
        }
      }

      config.overrides = overrides;
    } else if (this.hasTypeScriptProjectReferences()) {
      for (const override of config.overrides ?? []) {
        const parserOptions = override.parserOptions;
        if (parserOptions?.project !== true) continue;
        if (parserOptions.projectService === false) continue;

        delete parserOptions.project;
        parserOptions.projectService = true;
        parserOptions.tsconfigRootDir = this.root;
      }
    }

    if (this.context.typescript && !this.hasFile("tsconfig.json")) {
      const tsconfigPath = findUpSync("tsconfig.app.json") ?? findUpSync("tsconfig.json");
      const tsconfigFile = tsconfigPath?.split("/").pop() ?? null;

      if (tsconfigPath) {
        const overrides = config.overrides ?? [];
        for (const override of overrides) {
          if (override.parserOptions?.project === "tsconfig.json") {
            override.parserOptions = {
              ...override.parserOptions,
              tsconfigRootDir: tsconfigPath.replace("tsconfig.json", ""),
              ...(!tsconfigFile || tsconfigFile === "tsconfig.json" ? {} : { project: tsconfigFile }),
            };
          }
        }

        config.overrides = overrides;
      }
    }

    return config;
  }
}

export { Project };
