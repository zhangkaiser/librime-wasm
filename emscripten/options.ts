import { IMessageObjectType } from "src/api/common/message";
import { convertToPortInstance } from "src/api/common/port";
import { getPrintWithTextareaElement } from "src/api/emscripten/io";
import { IMEHandler } from "src/imehandler";

function registerFileHandler(imeHandler: IMEHandler) {
  let filePickerIDs = ['addSourceDataFiles', 'addBuiltDataDir'];

  filePickerIDs.forEach((pickerID) => {
    let pickerElement = document.getElementById(pickerID) as HTMLInputElement;
    pickerElement?.addEventListener("change", (ev) => {
      
      let files = (ev as any).target.files;
      if (pickerID === "addSourceDataFiles") {
        imeHandler.writeToSharedData(files);
      } else if (pickerID === "addBuiltDataDir") {
        imeHandler.writeToData(files);
      }
    });
  });
}


async function main() {

  let worker = new Worker("./worker/pthread.js");
  let imeHandler = convertToPortInstance(IMEHandler as any, worker, [
    "writeToSharedData",
    "writeToData"
  ]) as InstanceType<typeof IMEHandler>;

  registerFileHandler(imeHandler);
  
  let infos = document.getElementById("infos") as HTMLTextAreaElement;
  let printErr = getPrintWithTextareaElement(infos);

  worker.onmessage = (ev) => {
    let  { data } = ev.data as IMessageObjectType;
    let { type, value } = data;
    if (type === "printErr") {
      printErr(...value);
    } else if (type === "update_state") {

    }
  } 
}

main();
