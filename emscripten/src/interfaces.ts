import { EmscriptenMoreModule } from "src/api/emscripten/extends";

export interface IDecoder {
  processKey(keyEvent: string): boolean;
  initizlize(is_setup: boolean): boolean;
  notifyUpdate(): void;
  delete(): void;
  triggerMethod(method_id: number): boolean;
  executeCommand(line: string): boolean;
  decode(source: string): boolean;
  update(): boolean;
}

interface IDecoderConstructor {
  new (): IDecoder;
  prototype: IDecoder;
}

export interface IComposition {
    preedit: string;
    start: number;
    end: string;
    cursor: string;
}

export interface IWindowProperties {
  selectKeys: string;
  pageSize: number;
  pageNo: number;
  isLastPage: number;
  hightlighed: number,
  candidatesSize: number
}

export interface IIMEHandler {
  
  /** Invoke method from WASM. */
  commitText(text: string): void;
  setComposition(obj: IComposition): void;
  setCandidateWindowProperties(obj: IWindowProperties): void;
  addCandidate(text: string, comment: string): void;
  clearComposition(): void;
  hide(): void;
  onNotification(type: string, value: string): void;
}


interface IDecoderModule extends EmscriptenMoreModule {
  Decoder: IDecoderConstructor;
}

export enum trigger_method_id {
  setup,
  start_maintenance,
  is_maintenance_mode,
  join_maintenance_thread,
  deployer_initialize,
  prebuild,
  deploy
}

export const DecoderModule = typeof Module !== "undefined" ? Module as IDecoderModule : undefined;
