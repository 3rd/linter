import { resolve } from "path";
import { spawn } from "child_process";
import { ChildProcessWithoutNullStreams } from "child_process";
import * as esbuild from "esbuild";

const DEFINE = { DEBUG: true };
let child: ChildProcessWithoutNullStreams | null = null;

const run = () => {
  const command = "node";
  const args = [resolve(__dirname, "../dist/main.js")];
  if (child) {
    child.stdin.end();
    child.kill();
  }
  child = spawn(command, args, { env: { ...process.env, EXPLORE: "1" } });
  child.stdout.on("data", (data) => console.log(data.toString().trim()));
  child.stderr.on("data", (data) => console.error(data.toString().trim()));
  child.on("close", (code) => console.log(`[WATCH] Exit: ${code}`));
};

const plugin: esbuild.Plugin = {
  name: "on-rebuild",
  setup(build) {
    let buildCount = 0;
    build.onEnd(() => {
      console.log(`[WATCH] Build #${++buildCount}`);
      run();
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
  external: ["eslint"],
  minify: false,
  define: Object.entries(DEFINE).reduce((acc, [k, v]) => {
    acc[k] = JSON.stringify(v);
    return acc;
  }, {} as Record<string, string>),
  plugins: [plugin],
};

const main = async () => {
  const ctx = await esbuild.context(config);
  await ctx.watch();
};
main();
