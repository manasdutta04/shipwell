import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  // Bundle @shipwell/core into the output so it's self-contained
  noExternal: ["@shipwell/core"],
  // Keep actual npm packages as external — they'll be installed as dependencies
  external: [
    "@anthropic-ai/sdk",
    "chalk",
    "commander",
    "ora",
    "glob",
    "ignore",
    "simple-git",
  ],
});
