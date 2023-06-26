import module from "module";
import { LINTER_ROOT } from "../env";
import { Project } from "../Project";

interface IModule {
  _findPath: (name: string, ...args: unknown[]) => string;
}

const eslinter = new Project(LINTER_ROOT);
const originalFindPath = (module as unknown as IModule)._findPath;

const patch = () => {
  (module as unknown as IModule)._findPath = (name: string, ...args: unknown[]) => {
    const isPackage = name.length > 0 && "./".includes(name[0]);
    const eslinterDependency = eslinter.dependencies.find((dep) => {
      return dep.name === name;
    });
    if (!isPackage || !eslinterDependency) return originalFindPath(name, ...args);
    return require.resolve(eslinterDependency.path);
  };
};

patch();
