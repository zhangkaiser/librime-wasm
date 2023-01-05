import { Disposable } from "src/api/common/disposable";

let port = chrome.runtime.connect();
Disposable.dispose(controller, "onConnectExternal");
controller.handleChromeExternalConnect(port);
