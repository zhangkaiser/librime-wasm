import { Controller } from "./controller";

let isZhime = Reflect.has(chrome, "input") ? false : true;

async function main() {
  let controller = new Controller();
  controller.registerRuntimeDeps();
  controller.registerChromeMessageEvent();
  if (!isZhime) controller.registerChromeIMEEvent();
}

main();