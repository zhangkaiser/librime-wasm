import { DecoderModule } from "src/interfaces";
import { IMEHandler } from "src/imehandler";
import { IMessageObjectType } from "src/api/common/message";
import { Disposable } from "src/api/common/disposable";
import { registerEventDisposable } from "src/api/extension/event";

export class Controller extends Disposable {

  registerRuntimeDeps() {
    globalThis.imeHandler = new IMEHandler;

    DecoderModule['onRuntimeInitialized'] = () => {
      imeHandler.decoder = new DecoderModule['Decoder'](false, false);
    }
  }

  registerChromeMessageEvent() {
    
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

  registerChromeIMEEvent() {

  }

  handleChromeExternalConnect(port: chrome.runtime.Port) {

  }

  handleChromeMessage(res: IMessageObjectType, sender: chrome.runtime.MessageSender, response: (data: IMessageObjectType) => void) {

  }

  handleChromeConnect(port: chrome.runtime.Port) {

  }

}

