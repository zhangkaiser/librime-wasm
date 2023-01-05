import { IMessageObjectType } from "src/api/common/message"

window.onclose = () => {
  let msg: IMessageObjectType = {
    data: {
      type: "close",
      value: []
    }
  }
  chrome.runtime.sendMessage(msg);
}