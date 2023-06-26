import path from "path";

const LINTER_ROOT = path.resolve(__dirname, "../");
const LINTER_CONFIG_DIR = `${LINTER_ROOT}/config`;
const LINTER_NODE_MODULES_DIR = `${LINTER_ROOT}/node_modules`;

const isDev = process.env.NODE_ENV === "development";

export { LINTER_ROOT, LINTER_NODE_MODULES_DIR, LINTER_CONFIG_DIR, isDev };
