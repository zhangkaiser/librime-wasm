
declare module globalThis {
  var Module: EmscriptenModule;
  var imeHandler: any;
  var ENVIRONMENT_IS_WEB: boolean;
  var ENVIRONMENT_IS_WORKER: boolean;
  var ENVIRONMENT_IS_NODE: boolean;
  var ENVIRONMENT_IS_SHELL: boolean;
}