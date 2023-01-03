
import rollupTypescript from "@rollup/plugin-typescript";

export default [
  {
    input: "emscripten/chrome-extension.ts",
    output: {
      file: "out/index.js",
      format: "es"
    },
    plugins: [
      rollupTypescript()
    ],
    treeshake: false
  },
  {
    input: "emscripten/options.ts",
    output: {
      file: "out/options.js",
      format: "es"
    },
    plugins: [
      rollupTypescript()
    ]
  },
]