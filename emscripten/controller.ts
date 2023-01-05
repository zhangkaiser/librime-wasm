import { DecoderModule } from "src/interfaces";
import { IMEHandler, IMEHandlerKeyUnion } from "src/imehandler";
import { IMessageObjectType } from "src/api/common/message";
import { Disposable } from "src/api/common/disposable";
import { registerEventDisposable } from "src/api/extension/event";

const fdSyncDepsID = "fd.syncData";

export class Controller extends Disposable {
  
  isChrome  = Reflect.has(globalThis, "chrome") && Reflect.has(chrome, "runtime");
  isChromeIME = this.isChrome && Reflect.has(chrome, "input");

  loadedPromise?: Promise<void>;
  inited: boolean = false;

  mountIDBFS() {
    addRunDependency(fdSyncDepsID);
    FS.mkdir("data");
    FS.mount(IDBFS, {}, "data");
    FS.syncfs(true, (err) => {
      if (err) return console.error(err);
      this.inited = true;
      removeRunDependency(fdSyncDepsID);
    })
  }

  print(...args: any[]) {
    console.log(...args);
  }

  printErr(...args: any[]) {
    console.info(...args);
  }

  registerRuntimeDeps() {
    globalThis.imeHandler = new IMEHandler;
    if (DecoderModule) {
      DecoderModule['onRuntimeInitialized'] = () => {
        this.loadedPromise = Promise.resolve();
      }
      DecoderModule['print'] = (...args) => this.print(...args);
      DecoderModule['printErr'] = (...args) => this.printErr(args);
      if (!DecoderModule['preRun']) DecoderModule['preRun'] = [];

      DecoderModule['preRun'].unshift(this.mountIDBFS.bind(this));
    }
  }

  registerChromeMessageEvent() {
    if (!this.isChrome) return ;

    this.setCurrentEventName("onConnectExternal");
    this.disposable = registerEventDisposable(
      chrome.runtime.onConnectExternal, 
      this.handleChromeExternalConnect.bind(this)
    );
    this.disposable = registerEventDisposable(
      chrome.runtime.onConnect, 
      this.handleChromeConnect.bind(this)
    );

    this.setCurrentEventName("onMessage");
    this.disposable = registerEventDisposable(
      chrome.runtime.onMessage,
      this.handleChromeMessage.bind(this)
    );
  }

  registerWorkerListener() {
    if (!DecoderModule || DecoderModule['ENVIRONMENT_IS_PTHREAD']) return;
    if (!ENVIRONMENT_IS_WORKER) return;
    if (typeof postMessage !== "function") return; 
    imeHandler.mainWorker = true;

    this.printErr = (...args) => 
      postMessage({ data: { type: "printErr", value: args }});

    this.print = (...args) => 
      postMessage({ data: {type: "print", value: args }});
    
    imeHandler.port = {
      postMessage,
    }

    onmessage = (ev) => {
      let { data } = ev.data as IMessageObjectType;
      let {type, value} = data;
      if (type in imeHandler) {

        let result = imeHandler[type](...value);
        if (typeof result === "object" && 'then' in result) {
          result.then((res: any) => {
            postMessage({data: { type, value:  [res]}});
          });
        } else {
          postMessage({data: { type, value:  [result]}});
        }
      }
    }
  }

  registerChromeIMEEvent() {
    if (!this.isChromeIME) return;
  }

  handleChromeExternalConnect(port: chrome.runtime.Port) {
    imeHandler.port = port;
    port.onMessage.addListener((msg, port) => {
      let { type, value } = msg.data;
      if (type in imeHandler) {
        imeHandler[type](...value);
      }
    });
  }

  handleChromeMessage(res: IMessageObjectType, sender: chrome.runtime.MessageSender, response: (data: IMessageObjectType) => void) {

  }

  handleChromeConnect(port: chrome.runtime.Port) {

  }

  onInstalled() {
    chrome.runtime.openOptionsPage();
  }

}

