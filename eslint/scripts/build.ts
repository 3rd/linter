import * as esbuild from "esbuild";

const buildConfig = async () => {
  const config: esbuild.BuildOptions = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    outdir: "dist",
    platform: "node",
    target: ["node16.11.0"],
    format: "cjs",
    external: ["typescript"],
    minify: false,
    metafile: true,
    define: { DEBUG: "false" },
  };

  const result = await esbuild.build(config);
  if (!result.metafile) throw new Error("build failed");

  const text = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
  console.log(text);
};

buildConfig();
