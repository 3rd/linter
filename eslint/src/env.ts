import path from "path";

const LINTER_ROOT = path.resolve(__dirname, "../");
const LINTER_CONFIG_DIR = `${LINTER_ROOT}/config`;
const LINTER_NODE_MODULES_DIR = `${LINTER_ROOT}/node_modules`;

const isDev = process.env.NODE_ENV === "development";

export { isDev, LINTER_CONFIG_DIR, LINTER_NODE_MODULES_DIR, LINTER_ROOT };
