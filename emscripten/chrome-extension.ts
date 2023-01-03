import { Controller } from "./controller";

var post_run: any;

function main() {
  let controller = new Controller();
  controller.registerRuntimeDeps();
  controller.registerChromeMessageEvent();
  controller.registerChromeIMEEvent();
  
  post_run = () => {
    controller.registerWorkerListener();
  }
}


main();