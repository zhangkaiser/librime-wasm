import { DecoderModule, IComposition, IDecoder, IIMEHandler, IWindowProperties } from "./interfaces";
import { kNormalKeyMap } from "./consts";
import { isDir } from "./api/common/files";
import { writeFileFromFile, writeFileFromFileList } from "./api/emscripten/files";

export class IMEHandler implements IIMEHandler {
  port?: chrome.runtime.Port;
  
  decoder?: IDecoder;
  
  contextID = -1;
  engineID = "";
  candidates: chrome.input.ime.CandidateTemplate[] = [];
  candidatesSize = 0;

  visible = false;
  shiftLock = false;
  _lastKeyIsShift = false;


  onActivate(engineID: string) {
    this.engineID = engineID;
  }

  onFocus(context: chrome.input.ime.InputContext) {
    this.contextID = context.contextID;
    this.hide();
    this.clearComposition();
  }

  checkDecoder() {
    if (!this.decoder) {
      this.decoder = new DecoderModule.Decoder(false, false);
    }
  }

  handleShiftKey(keyEvent: chrome.input.ime.KeyboardEvent) {
    if (keyEvent.shiftKey) {
      
      if (keyEvent.key === "Shift") {
        this._lastKeyIsShift = true;
      } else {
        this._lastKeyIsShift = false;
      }

      if (/^[A-Z]$/.test(keyEvent.key)) return true;

    }

    return false;
  }

  getKeyString(keyEvent: chrome.input.ime.KeyboardEvent) {
    let key = "";
    
    if (keyEvent.ctrlKey && keyEvent.key != "Ctrl") {
      key += "Control+";
    }
    if (keyEvent.altKey && keyEvent.key != "Alt") {
      key += "Alt+";
    }
    if (keyEvent.shiftKey && keyEvent.key != "Shift" && key) {
      key += "Shift+";
    }
    
    key += Reflect.has(kNormalKeyMap, keyEvent.key) ? (kNormalKeyMap as any)[keyEvent.key] : keyEvent.key;
 
    return key;
  }

  onKeyEvent(engineID: string, keyEvent: chrome.input.ime.KeyboardEvent, requestId: number) {
    this.engineID = engineID;
    this.checkDecoder();

    if (keyEvent.type === "keydown") {
      if (this.handleShiftKey(keyEvent)) {
        return this.handleResponse(requestId, false);
      }

      if (this.shiftLock || keyEvent.capsLock) {
        return this.handleResponse(requestId, false);
      }

      if (keyEvent.ctrlKey && keyEvent.key == "Ctrl"
      || keyEvent.shiftKey && keyEvent.key == "Shift"
      || keyEvent.altKey && keyEvent.key == "Alt") {
        return this.handleResponse(requestId, false);
      }
      
      let key = this.getKeyString(keyEvent);
      
      let response = this.decoder!.processKey(key);
      this.handleResponse(requestId, !!response);
      if (response) this.decoder!.notifyUpdate();

    } else {
      if (keyEvent.key === "Shift" && this._lastKeyIsShift) {
        this.shiftLock = !this.shiftLock;
      }

      this.handleResponse(requestId, false);
    }
  }

  onDeactivate() {
    this.decoder?.delete();
    this.decoder = undefined;
    this.hide();
  }

  hide() {
    this.visible = false;

    this.handleMethod("setCandidateWindowProperties", [{
      engineID: this.engineID,
      properties: {
        visible: false
      }
    }]);
    this.handleMethod("hideInputView", []);
  }

  clearComposition() {
    this.handleMethod("clearComposition", [{contextID: this.contextID}]);
  }

  commitText(text: string) {
    this.visible = false;
    this.handleMethod("commitText", [{
      contextID: this.contextID,
      text
    }]);
  }

  setComposition(obj: IComposition) {
    this.handleMethod("setComposition", [
      {
        contextID: this.contextID,
        cursor: obj['cursor'],
        selectionStart: obj['start'],
        selectionEnd: obj['end'],
        text: obj['preedit']
      }
    ])
  }

  setCandidateWindowProperties(obj: IWindowProperties) {
    this.candidates = [];
    this.candidatesSize = obj['candidatesSize'];

    if (this.visible) return;
    if (this.candidatesSize == 0) return this.hide();
    this.handleMethod("setCandidateWindowProperties", [
      {
        engineID: this.engineID,
        properties: {
          visible: true,
          cursorVisible: true,
          vertical: true,
          pageSize: obj['pageSize']
        }
      }
    ])
    this.visible = true;
  }

  addCandidate(candidate: string, annotation: string) {
    
    let id = this.candidates.length + 1;
    this.candidates.push({
      candidate,
      id,
      annotation,
      label: "" + id
    });

    if (this.candidates.length === this.candidatesSize) {
      this.handleMethod("setCandidates", [{
        contextID: this.contextID,
        candidates: this.candidates
      }]);
    }
  }

  handleMethod(type: string, value: any) {
    if (!this.port) return;
    this.port?.postMessage({
      data: {
        type,
        value
      }
    })
  }

  handleResponse(requestId: number, response: boolean) {
    this.handleMethod("keyEventHandled", [
      requestId,
      response
    ]);
  }

  onNotification(type: string, value: string) {
    console.log(type, value);
  }

  writeToUserDB(files: FileList):Promise<boolean[]> | undefined {
    if (!isDir(files[0])) return;

    return writeFileFromFileList(FS, files, "data/user", false);
  }

  writeToSharedData(files: FileList) {
    return writeFileFromFileList(FS, files, "shared_data", false);
  }

  writeToBuild(files: FileList) {
    return writeFileFromFileList(FS, files, "data/build", false);
  }

}