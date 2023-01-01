
export interface IDecoder {
  processKey(keyEvent: string): boolean;
  notifyUpdate(): void;
  delete(): void;
  triggerMethod(method_id: number): boolean;
  executeCommand(line: string): boolean;
  decode(source: string): boolean;
}

interface IDecoderConstructor {
  new (enabledThread: false, isSetup: false): IDecoder;
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
  commitText(text: string): void;
  setComposition(obj: IComposition): void;
  setCandidateWindowProperties(obj: IWindowProperties): void;
  addCandidate(text: string, comment: string): void;
  clearComposition(): void;
  hide(): void;
  onNotification(type: string, value: string): void;
}


interface IDecoderModule extends EmscriptenModule {
  Decoder: IDecoderConstructor;
  addRunDependency(id: string): void;
  removeRunDependency(id: string): void;
}

export const DecoderModule = Module as IDecoderModule;
