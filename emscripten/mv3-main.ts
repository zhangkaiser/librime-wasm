import { Disposable } from "src/api/common/disposable";

Disposable.dispose(controller, "onConnectExternal");

setInterval(() => {
  let port = chrome.runtime.connect();
  controller.handleChromeExternalConnect(port);
}, 3 * 60 * 1000);

let port = chrome.runtime.connect();
controller.handleChromeExternalConnect(port);
