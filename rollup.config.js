import * as fs from "fs";
import * as path from "path";
import rollupTypescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";

function resolveCSS() {
  return {
    name: "resovleCSS",
    resolveId(source, importer) {
      if (source.endsWith(".css")) {
        return path.resolve(path.dirname(importer), source);        
      }
      return null;
    },
    load(id) {
      if (id.endsWith(".css")) {
        let cssContent = fs.readFileSync(id);
        return `
          export default \`${cssContent}\`;
        `;
      }
      return null;
    }
  }
}

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
      entryFileNames: "[name].js",
      manualChunks: {
        lit: ['lit']
      }
    },
    plugins: [
      rollupTypescript(),
      resolveCSS(),
      nodeResolve(),
    ]
  },
]