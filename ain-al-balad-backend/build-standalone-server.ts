import { build } from "bun";
import { join } from "node:path";
import { readdirSync } from "node:fs";

// 1. Get all files from your build folder recursively
const getFiles = (dir: string): string[] => {
  const files = readdirSync(dir, { recursive: true }) as string[];
  //console.log(files);
  return files
    .filter((f) => !f.endsWith("/") && f !== ".DS_Store")
    .map((f) => join(dir, f));
};

const assets = getFiles("./build");

// 2. Run the build
const result = await build({
  entrypoints: ["./src/server.ts"],
  outdir: "./out",
  target: "bun",
  naming: "[name].[ext]",
  // This tells Bun: "These files are important, don't ignore them!"
  external: assets,
});

if (!result.success) {
  console.error("Build failed", result.logs);
  process.exit(1);
}

// 3. Trigger the compilation
const proc = Bun.spawn([
  "bun",
  "build",
  "./src/server.ts",
  "--compile",
  "--outfile",
  "server",
  "--target",
  "bun",
]);

await proc.exited;
console.log("✅ Single-file executable 'server' created with assets!");
