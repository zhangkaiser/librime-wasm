
/// <reference types="@types/emscripten" />

export interface EmscriptenMoreModule extends EmscriptenModule {
  addRunDependency(id: string): void;
  removeRunDependency(id: string): void;
  ENVIRONMENT_IS_PTHREAD: boolean;
  ENVIRONMENT_IS_WEB: boolean;
  ENVIRONMENT_IS_WORKER: boolean;
  ENVIRONMENT_IS_NODE: boolean;
  ENVIRONMENT_IS_SHELL: boolean;
}