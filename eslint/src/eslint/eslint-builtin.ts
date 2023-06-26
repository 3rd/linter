import type { IESLintPlugin } from "./eslint-types";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const getBuiltinRulesPlugin = () =>
  ({ rules: Object.fromEntries(require("../../node_modules/eslint/lib/rules")) } as IESLintPlugin);

export { getBuiltinRulesPlugin };
