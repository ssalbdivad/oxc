// Assembles `@ark/oxfmt`: the oxfmt npm package (JS dist + bin) with the native bindings
// for every platform in `PLATFORMS` placed next to the napi-rs loader in `dist/`,
// which requires `./oxfmt.<platform>.node` before falling back to `@oxfmt/binding-<platform>`.
//
// Run after `pnpm run build-js` in `apps/oxfmt` with all `.node` files in `apps/oxfmt/src-js`:
//   node .github/scripts/ark-oxfmt-package.ts <out dir> [--prerelease <n>] [--allow-missing]
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PLATFORMS = ["linux-x64-gnu", "darwin-arm64", "win32-x64-msvc"];

const args = process.argv.slice(2);
const outDir = args[0] && !args[0].startsWith("--") ? resolve(args[0]) : undefined;
if (!outDir) throw new Error("usage: ark-oxfmt-package.ts <out dir> [--prerelease <n>]");
const flagValue = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const prerelease = flagValue("--prerelease") ?? "0";
const allowMissing = args.includes("--allow-missing");

const root = resolve(import.meta.dirname, "../..");
const distDir = join(root, "apps/oxfmt/dist");
const upstream = JSON.parse(readFileSync(join(root, "npm/oxfmt/package.json"), "utf8"));

const missing = PLATFORMS.filter((p) => !existsSync(join(distDir, `oxfmt.${p}.node`)));
if (missing.length > 0 && !allowMissing) {
  throw new Error(`missing native bindings in ${distDir}: ${missing.join(", ")}`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "bin"), { recursive: true });
cpSync(distDir, join(outDir, "dist"), { recursive: true });
cpSync(join(root, "npm/oxfmt/bin/oxfmt"), join(outDir, "bin/oxfmt"));
chmodSync(join(outDir, "bin/oxfmt"), 0o755);
cpSync(join(root, "npm/oxfmt/configuration_schema.json"), join(outDir, "configuration_schema.json"));
cpSync(join(root, "LICENSE"), join(outDir, "LICENSE"));

const { napi: _napi, preferUnplugged: _preferUnplugged, ...rest } = upstream;
const pkg = {
  ...rest,
  name: "@ark/oxfmt",
  version: `${upstream.version}-ternaries.${prerelease}`,
  description:
    "Fork of oxfmt adding Prettier's experimentalTernaries, pending oxc-project/oxc#14914. " +
    `Native bindings included for ${PLATFORMS.join(", ")}.`,
  homepage: "https://github.com/ssalbdivad/oxc/tree/experimental-ternaries",
  bugs: "https://github.com/ssalbdivad/oxc/issues",
  repository: {
    type: "git",
    url: "git+https://github.com/ssalbdivad/oxc",
    directory: "npm/oxfmt",
  },
  files: ["bin/oxfmt", "configuration_schema.json", "dist", "LICENSE", "README.md"],
  os: ["linux", "darwin", "win32"],
  publishConfig: { access: "public" },
};
writeFileSync(join(outDir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);

writeFileSync(
  join(outDir, "README.md"),
  `# @ark/oxfmt

A fork of [oxfmt](https://oxc.rs/docs/guide/usage/formatter) ${upstream.version} that supports
Prettier's \`experimentalTernaries\` option, pending
[oxc-project/oxc#14914](https://github.com/oxc-project/oxc/issues/14914).

Built from the \`experimental-ternaries\` branch of https://github.com/ssalbdivad/oxc.
Native bindings are included for ${PLATFORMS.join(", ")} only.

\`\`\`json
// .oxfmtrc.json
{ "experimentalTernaries": true }
\`\`\`

Use it exactly like \`oxfmt\`: the binary is also named \`oxfmt\`.
`,
);

console.log(`Wrote ${pkg.name}@${pkg.version} to ${outDir}`);
if (missing.length > 0) console.log(`(missing bindings: ${missing.join(", ")})`);
