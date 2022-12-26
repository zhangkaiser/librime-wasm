
// function initFS() {
//   let depsId = "fs initFS";
//   FS.mkdir("/build");
//   FS.mount(IDBFS, {root: "."}, "/build");
//   Module.addRunDependency(depsId);
//   FS.syncfs(true, (err) => {
//     if (err) reject(err);
//     try {
//       FS.stat("/build/installation.yaml");
//       FS.symlink("/build/installation.yaml", "/installation.yaml");
//       FS.symlink("/build/user.yaml", "/user.yaml");
//       FS.symlink("/build/luna_pinyin.userdb", "/luna_pinyin.userdb");
//       // FS.symlink("/build/cangjie5.userdb", "/cangjie5.userdb");
//     } catch(e) {
//       console.log("No install.");
//     }
//     Module.removeRunDependency(depsId);

//   });
  
// }


Module['onRuntimeInitialized'] = function() {
  console.log("onRuntimeInitialized");
  imeHandler.decoder = new Module['Decoder'](false, false);

}


const keyNormalMapping = {
  Esc: "Escape",
  Backspace: "BackSpace",
  " ": "space",
  Ctrl: "Control",
  ControlLeft: "Control_L",
  ControlRight: "Control_R",
  ShiftLeft: "Shift_L",
  ShiftRight: "Shift_R",
  AltLeft: "Alt_L",
  AltRight: "Alt_R",
  "`": "grave",
  Enter: "Return"
}


class IMEHandler {
  port = undefined;
  decoder = undefined;
  
  contextID = -1;
  engineID = "";
  candidates = [];
  candidatesSize = 0;

  visible = false;
  shiftLock = false;
  _lastKeyIsShift = false;


  onActivate(engineID) {
    this.engineID = engineID;
  }

  onFocus(context) {
    this.contextID = context.contextID;
    this.hide();
    this.clearComposition();
  }

  checkDecoder() {
    if (!this.decoder) {
      this.decoder = new Module.decoder();
    }
  }

  handleShiftKey(keyEvent) {
    if (keyEvent.shiftKey) {
      if (keyEvent.key === "Shift") {
        this._lastKeyIsShift = true;
      } else if (this._lastKeyIsShift) {
        this._lastKeyIsShift = false;
      }
      if (/^[A-Z]$/.test(keyEvent.key)) {
        this._lastKeyIsShift = false;
        return true;
      }
    }
    return false;
  }

  getKeyString(keyEvent) {
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
    
    key += Reflect.has(keyNormalMapping, keyEvent.key) ? keyNormalMapping[keyEvent.key] : keyEvent.key;
    
    return key;
  }

  onKeyEvent(engineID, keyEvent, requestId) {
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
      
      let response = this.decoder.processKey(key);
      this.handleResponse(requestId, !!response);

    } else {
      if (keyEvent.key === "Shift" && this._lastKeyIsShift) {
        this.shiftLock = !this.shiftLock;
      }

      this.handleResponse(requestId, false);
    }
  }

  onDeactivate() {
    this.decoder.delete();
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

  commitText(text) {
    this.visible = false;
    this.handleMethod("commitText", [{
      contextID: this.contextID,
      text
    }]);
  }

  setComposition(obj) {
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

  setCandidateWindowProperties(obj) {
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

  addCandidate(candidate, annotation) {
    
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

  handleMethod(type, value) {
    if (!this.port) return;
    this.port.postMessage({
      data: {
        type,
        value
      }
    })
  }

  handleResponse(requestId, response) {
    this.handleMethod("keyEventHandled", [
      requestId,
      response
    ]);

    if (response) {
      this.decoder.notifyUpdate();
    }
  }

  onNotification(type, value) {
    console.log(type, value);
  }

}

globalThis.imeHandler = new IMEHandler();

chrome.runtime.onConnectExternal.addListener((port) => {
  imeHandler.port = port;
  
  port.onMessage.addListener((msg, port) => {
    let {type, value} = msg.data;
    if (type in imeHandler) {
      imeHandler[type](...value);
    }
  })
})

// globalThis.refreshFS = () => {
  
//   try {
//     FS.stat("/build/installation.yaml");
//   } catch(e) {
//     console.error("Not found installation.yaml!");
//     ["installation.yaml", "user.yaml", "luna_pinyin.userdb", /**"cangjie5.userdb"*/].forEach((item) => {
//       FS.symlink(`/${item}`, `/build/${item}`)
//     });
//   }
//   FS.syncfs(false, () => {});
// }

// window.onclose = function() {
//   refreshFS();
// }

// Module.preRun.push(initFS);