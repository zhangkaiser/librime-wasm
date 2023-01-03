import { DecoderModule } from "src/interfaces";
import { IMEHandler, IMEHandlerKeyUnion } from "src/imehandler";
import { IMessageObjectType } from "src/api/common/message";
import { Disposable } from "src/api/common/disposable";
import { registerEventDisposable } from "src/api/extension/event";

const fdSyncDepsID = "fd syncData";

export class Controller extends Disposable {
  
  isChrome  = Reflect.has(globalThis, "chrome");
  isChromeIME = this.isChrome && Reflect.has(chrome, "input");

  loadedPromise?: Promise<void>;
  inited: boolean = false;

  mountIDBFS() {
    FS.mkdir("data");
    FS.mount(IDBFS, {}, "data");
    FS.syncfs(true, (err) => {
      if (err) return console.error(err);
      this.inited = true;
      DecoderModule?.removeRunDependency(fdSyncDepsID);
    })
  }

  print(...args: any[]) {
    console.log(...args);
  }

  printErr(...args: any[]) {
    console.error(...args);
  }

  registerRuntimeDeps() {
    globalThis.imeHandler = new IMEHandler;
    if (DecoderModule) {
      DecoderModule.addRunDependency(fdSyncDepsID);
      DecoderModule['onRuntimeInitialized'] = () => {
        this.loadedPromise = Promise.resolve();
      }
      DecoderModule['print'] = (...args) => this.print(...args);
      DecoderModule['printErr'] = (...args) => this.printErr(args);
      this.mountIDBFS();
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
      if (type in imeHandler) imeHandler[type](...value);
    }
  }

  registerChromeIMEEvent() {
    if (!this.isChromeIME) return;
  }


  handleChromeExternalConnect(port: chrome.runtime.Port) {

  }

  handleChromeMessage(res: IMessageObjectType, sender: chrome.runtime.MessageSender, response: (data: IMessageObjectType) => void) {

  }

  handleChromeConnect(port: chrome.runtime.Port) {

  }

}

