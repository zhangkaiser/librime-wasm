
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
    input: {
      "options":"emscripten/options.ts",
      "background": "emscripten/mv3-background.ts",
      "mv3-main": "emscripten/mv3-main.ts"
    },
    output: {
      format: "es",
      dir: "out",
      entryFileNames: "[name].js"
    },
    plugins: [
      rollupTypescript()
    ]
  },
]