import { resolve } from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import * as esbuild from "esbuild";

let explorerProcess: ChildProcessWithoutNullStreams | null = null;

const restartExplorer = () => {
  const command = "node";
  const args = [resolve(__dirname, "../dist/main.js")];

  if (explorerProcess) {
    explorerProcess.stdin.end();
    explorerProcess.kill();
  }

  explorerProcess = spawn(command, args, { env: { ...process.env, EXPLORE: "1" } });
  explorerProcess.stdout.on("data", (data) => console.log(data.toString().trim()));
  explorerProcess.stderr.on("data", (data) => console.error(data.toString().trim()));
  explorerProcess.on("close", (code) => console.log(`[WATCH] Exit: ${code}`));
};

const restartExplorerPlugin: esbuild.Plugin = {
  name: "on-rebuild",
  setup(build) {
    let buildCount = 0;

    build.onEnd(() => {
      console.log(`[WATCH] Build #${++buildCount}`);
      restartExplorer();
    });
  },
};

const config: esbuild.BuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  target: ["node16.11.0"],
  format: "cjs",
  external: ["eslint", "typescript"],
  minify: false,
  define: { DEBUG: "true" },
  plugins: [restartExplorerPlugin],
};

const watchConfig = async () => {
  const ctx = await esbuild.context(config);
  await ctx.watch();
};

watchConfig();
