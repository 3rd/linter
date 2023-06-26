import * as esbuild from "esbuild";

const DEFINE = {
  DEBUG: false,
};

const main = async () => {
  const config: esbuild.BuildOptions = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    outdir: "dist",
    platform: "node",
    target: ["node16.11.0"],
    format: "cjs",
    external: [],
    minify: false,
    metafile: true,
    define: Object.entries(DEFINE).reduce((acc, [k, v]) => {
      acc[k] = JSON.stringify(v);
      return acc;
    }, {} as Record<string, string>),
  };

  const result = await esbuild.build(config);
  if (!result.metafile) throw new Error("build failed");

  const text = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
  console.log(text);
};

main();
