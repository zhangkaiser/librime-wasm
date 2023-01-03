import { DecoderModule } from "src/interfaces";
import { IMEHandler, IMEHandlerKeyUnion } from "src/imehandler";
import { IMessageObjectType } from "src/api/common/message";
import { Disposable } from "src/api/common/disposable";
import { registerEventDisposable } from "src/api/extension/event";

export class Controller extends Disposable {
  
  isChrome  = Reflect.has(globalThis, "chrome");
  isChromeIME = this.isChrome && Reflect.has(chrome, "input");

  loadedPromise?: Promise<void>;

  registerRuntimeDeps() {
    globalThis.imeHandler = new IMEHandler;
    
    DecoderModule['onRuntimeInitialized'] = () => {
      this.loadedPromise = Promise.resolve();
    }
  }

  registerChromeMessageEvent() {
    if (!chrome) return ;

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
    if (DecoderModule['ENVIRONMENT_IS_PTHREAD']) return;
    if (DecoderModule['ENVIRONMENT_IS_WORKER']) {
      imeHandler.mainWorker = false;
      imeHandler.port = {
        postMessage: globalThis.postMessage,
      }

      globalThis.onmessage = (ev) => {
        let { data } = ev.data as IMessageObjectType;
        let {type, value} = data;
        if (type in imeHandler) imeHandler[type](...value);
      }
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

