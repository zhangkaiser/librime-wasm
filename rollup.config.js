
import rollupTypescript from "@rollup/plugin-typescript";

export default {
  input: "emscripten/chrome-extension.ts",
  output: [
    {
      file: "out/index.mjs",
      format: "es"
    },
    {
      file: "out/index.js",
      format: "cjs"
    }
  ],
  plugins: [
    rollupTypescript()
  ]
}