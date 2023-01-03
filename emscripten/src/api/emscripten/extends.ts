
/// <reference types="@types/emscripten" />

export interface EmscriptenMoreModule extends EmscriptenModule {
  addRunDependency(id: string): void;
  removeRunDependency(id: string): void;
  ENVIRONMENT_IS_PTHREAD: boolean;
}