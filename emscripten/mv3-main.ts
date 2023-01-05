import { Disposable } from "src/api/common/disposable";

let port = chrome.runtime.connect();
Disposable.delete(controller, "onConnectExternal");
controller.handleChromeExternalConnect(port);
