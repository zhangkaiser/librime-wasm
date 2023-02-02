import { render, html } from "lit";
import type { OptionsPage } from "src/options-page";

import "src/options-page";

async function main() {
  let container = document.getElementById("container");
  render(html`
  <options-page id="options"></options-page>
  `, container!);

  let options = document.getElementById("options") as OptionsPage;

  let worker = new Worker("./worker/pthread.js");
  options.setWorker(worker);
}

main();
