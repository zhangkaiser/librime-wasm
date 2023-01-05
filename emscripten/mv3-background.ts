import { IMessageObjectType } from "src/api/common/message";
import { registerEventDisposable } from "src/api/extension/event";
import { Controller } from "./controller";

let controller = new Controller;

let openStatus = false;

let imePort: chrome.runtime.Port | undefined = undefined;
let pagePort: chrome.runtime.Port | undefined = undefined;

registerEventDisposable(chrome.runtime.onInstalled, controller.onInstalled);

registerEventDisposable(chrome.runtime.onConnectExternal, (port) => {
  imePort = port;
  imePort.onMessage.addListener(
    (msg, port) => pagePort?.postMessage(msg)
  );
  if (openStatus) return;
  chrome.tabs.create(
    { active: true, url: "./main.html"}, 
    (tabs) => openStatus = true);
});

registerEventDisposable(chrome.runtime.onConnect, (port) => {
  pagePort = port;
  openStatus = true;

  port.onDisconnect.addListener(() => {
    openStatus = false;
    imePort?.disconnect();
  });
  port.onMessage.addListener(
    (msg, port) => imePort?.postMessage(msg)
  );
});