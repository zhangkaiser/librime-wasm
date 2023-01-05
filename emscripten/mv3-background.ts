import { IMessageObjectType } from "src/api/common/message";
import { registerEventDisposable } from "src/api/extension/event";
import { Controller } from "./controller";

let controller = new Controller;

let openStatus = false;

registerEventDisposable(chrome.runtime.onInstalled, controller.onInstalled);

registerEventDisposable(chrome.runtime.onConnectExternal, (port) => {
  if (openStatus) return;
  chrome.tabs.create({
    active: false,
    url: "./main.html"
  }, (tabs) => {
    console.log(tabs);
    port.disconnect();
  });
});

registerEventDisposable(chrome.runtime.onMessage, (msg: IMessageObjectType, sender, response) => {
  let {type, value} = msg.data;
  if (type == "close") openStatus = false;
})