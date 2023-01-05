import { Controller } from "./controller";


declare global {
  var controller: Controller;
}
var controller = new Controller();;

var post_run: any;

function main() {
  controller.registerRuntimeDeps();
  controller.registerChromeMessageEvent();
  controller.registerChromeIMEEvent();
  
  post_run = () => {
    controller.registerWorkerListener();
  }
}


main();