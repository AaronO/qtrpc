await Bun.build({
  entrypoints: ["./src/index.ts"],
  external: ["@trpc/*"],
  outdir: "./dist",
});
