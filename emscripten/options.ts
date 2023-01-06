
import { LitElement, html, render } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { IMessageObjectType } from "src/api/common/message";
import { convertToPortInstance } from "src/api/common/port";
import { getPrintWithTextareaElement } from "src/api/emscripten/io";
import { IMEHandler } from "src/imehandler";
import { Schema } from "src/schema";

import style from "./css/pages.css";


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

  let btns = ["build", "sync"];
  btns.forEach((btnID) => {
    let btnElement = document.getElementById(btnID);
    btnElement?.addEventListener("click", (ev) => {
      if (btnID === "build") {
        imeHandler.updateData();
      } else if (btnID === "sync") {
        imeHandler.flushCache();
      }
    })
  })
}

@customElement("options-page")
class OptionsPage extends LitElement {

  static style = style;
  
  @state()
  lists: [string, string, string[]][] = [];

  choosedSchemas: Record<number, [string, string, string[]]> = {};

  schema: Schema;

  constructor() {
    super();
    this.schema = new Schema();

    this.schema.getSchemaData().then((data) => {
      this.lists = data.lists;
    });

  }

  onClickSchema(ev: Event) {
    let target = ev.target as HTMLInputElement;
    let { id, checked } = target;
    let index = +(id.split("-")[1]);
    if (checked) this.choosedSchemas[index] = this.lists[index];
    else if (this.choosedSchemas[index]) delete this.choosedSchemas[index];
  }

  async createSchemasFromBuiltin() {
    if (!Object.keys(this.choosedSchemas).length) return alert("没有选择方案。");
    await this.schema.setRequiredFiles();
    let names = [];
    for (let index in this.choosedSchemas) {
      let schemaItem = this.choosedSchemas[index];
      await this.schema.setSchemaDepsFiles(schemaItem[0], schemaItem[2]);
      names.push(schemaItem[0]);
    }
    await this.schema.setDefaultFile(names);

    this.schema.runSchemaCreating();
  }

  schemaLists() {
    return html`
<div>
  <section>
    <h3>选择内置的输入方案</h3>
    <div calss="">
        ${this.lists.forEach((item, index) => html`
          <div>
            <span>
              <input type="checkbox" @click=${this.onClickSchema} id="schema-${index}"></input>
              <span>${item[1]}</span>
            </span>
          </div>
        `)}
        <div>
          <button @click=${this.createSchemasFromBuiltin}></button>
        </div>
    </div>
  </section>
</div>
    `;
  }

  addCustomBuild() {
    return html`
      <div class="fix">
        <span>
          <span>添加原始文件（未构建的文件）</span>
          <input id="addSourceDataFiles" type="file" accept=".yaml,.txt" multiple />
        </span>
        <div class="desc">

        </div>
      </div>
    `;
  }

  updateYamlFile() {
    return html`
      <div>
      更新构建的文件（例如:default.yaml, default.custom.yaml...）
      </div>
    `;
  }

  commitUpdate() {
    return html`
    `
  }

  render() {
    return html`

    `;
  }
}

let container = document.getElementById("container");

async function main() {
  render(html`
  <options-page id=""></options-page>
  `, container!);


  let worker = new Worker("./worker/pthread.js");
  let imeHandler = convertToPortInstance(IMEHandler as any, worker, [
    "writeToSharedData",
    "writeToData",
    "updateData",
    "flushCache"
  ]) as InstanceType<typeof IMEHandler>;

  registerFileHandler(imeHandler);
  
  let infos = document.getElementById("infos") as HTMLTextAreaElement;
  let printErr = getPrintWithTextareaElement(infos);

  worker.onmessage = (ev) => {
    let  { data } = ev.data as IMessageObjectType;
    let { type, value } = data;
    if (type === "printErr") {
      printErr(...value);
    } else if (type === "updateData") {
      if (value[0]) alert("Update success.");
      else alert("Update failture.");
    } else if (type === "flushCache") {
      alert("Save success");
    }
  } 
}

main();
