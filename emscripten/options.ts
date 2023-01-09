
import { LitElement, html, render } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { IMessageObjectType } from "src/api/common/message";
import { convertToPortInstance } from "src/api/common/port";
import { getPrintWithTextareaElement } from "src/api/emscripten/io";
import { IMEHandler, IMEHandlerInstance } from "src/imehandler";
import { Schema } from "src/schema";

import styles from "./css/pages.css";

declare global {
  var stopWorker: Function;
}

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

  static styles = styles;
  
  @state({
    hasChanged(value, oldValue) {
      return true;
    }
})
  lists: [string, string, string[]][] = [];
  @state()
  imeWasRunning = false;

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

  onFilePickerChange(ev: Event) {
    let target = ev.target as HTMLInputElement;
    let {id, files} = target;

    if (!files) return alert("上传文件为空");

    switch(id) {
      case "addSourceDataFiles":
        (imeHandler as IMEHandlerInstance).writeToSharedData(files);
        break;
      case "addBuiltDataFiles":
      case "addYamlDataFiles":
        (imeHandler as IMEHandlerInstance).writeToBuild(files);
        break;
    }
  }

  onBtnClick(ev: Event) {
    let target = ev.target as HTMLButtonElement;
    let {id} = target;

    switch(id) {
      case "cancel":
        stopWorker();
        break;
      case "save":
        imeHandler.flushCache();
    }
  }

  onRefresh(ev: Event) {
    location.reload();
  }

  async createSchemasFromBuiltin() {
    if (!Object.keys(this.choosedSchemas).length) return alert("没有选择方案。");
    let names = [];
    for (let index in this.choosedSchemas) {
      let schemaItem = this.choosedSchemas[index];
      await this.schema.setSchemaDepsFiles(schemaItem[0], schemaItem[2]);
      names.push(schemaItem[0]);
    }
    await this.schema.setDefaultFile(names);

    this.schema.runSchemaCreating();
  }

  imeIgnore() {
    return html`
<div class="">
  <div>
    <span>
      <p style="color: red;">需要先关闭RIME的其他页面/切换到其它输入法后并刷新此页面才能配置成功，否则无法成功配置输入法功能。</p>
    </span>
  </div>
</div>
`;
  }

  schemaLists() {
    return html`
<div>
  <section>
    <h3>选择内置的输入方案</h3>
    <div class="">
        ${this.lists.map((item, index) => html`
          <div>
            <span>
              <input type="checkbox" @click=${this.onClickSchema} id="schema-${index}"></input>
              <span>${item[1]}</span>
            </span>
          </div> 
        `)}
        <div>
          <button @click=${this.createSchemasFromBuiltin}>部署方案</button>
        </div>
    </div>
  </section>
</div>
    `;
  }

  customSchemeFile() {
    return html`
<div>
  <section>
    <h3>自定义内容</h3>
    <div class="chunk">
    ${this.addCustomBuild()}
    </div>
    <div class="chunk">
    ${this.addBuiltData()}
    </div>
    <div class="chunk">
    ${this.updateYamlFile()}
    </div>
  </section>
</div>
    `;
  }

  addCustomBuild() {
    return html`
      <div class="fix">
        <span>
          <span class="controlled-setting-with-label">添加原始文件（未构建的文件）</span>
          <input @change=${this.onFilePickerChange} id="addSourceDataFiles" type="file" accept=".yaml,.txt" multiple />
        </span>
        <div class="desc">可以选择未构建的方案进行构建（在构建大型词库文件时可能耗时较长，建议使用已构建好的文件进行部署。），需要把所需要所有文件一起选择上传(主要包含.yaml, .txt两类文件)</div>
      </div>
    `;
  }

  updateYamlFile() {
    return html`
      <div>
        <span class="controlled-setting-with-label">
          <span>修改yaml/bin文件：</span>
          <input @change=${this.onFilePickerChange} id="addYamlDataFiles" type="file" accept=".yaml" multiple />
        </span>
        <div class="desc">例如:luna_pinyin.schema.yaml,default.yaml, luna_pinyin.[table|reverse|prism].bin已构建的配置项文件(文件已__build_info开头的文件夹)，暂不支持已custom.yaml结尾的文件，建议先把custom.yaml文件合并到已构建的schema.yaml文件中</div>
      </div>
    `;
  }

  addBuiltData() {
    return html`
      <div>
        <span class="controlled-setting-with-label">
          <span>上传已构建的文件夹:</span>
          <input @change=${this.onFilePickerChange} type="file" id="addBuiltData" webkitdirectory multiple></input>
        </span>
        <div class="desc">
          包含已构建的字库二进制文件(.bin文件)和已构建的用户配置项文件(.yaml文件并且文件已__build_info开头(包含已构建的default.yaml))，两类格式的文件都应该放在同一目录下并选择目录进行上传。
        </div>
      </div>
    `
  }

  commitUpdate() {
    return html`
    `
  }

  render() {
    return html`
    ${this.imeIgnore()}
    ${this.schemaLists()}
    ${this.customSchemeFile()}

    <div class="">
      <button id="cancel" @click=${this.onBtnClick}>停止构建</button>
      <button id="save" @click=${this.onBtnClick}>同步此次修改</button>
    </div>
    `;
  }
}

let container = document.getElementById("container");

async function main() {
  render(html`
  <options-page id=""></options-page>
  <textarea id="infos" rows="24"></textarea>
  `, container!);


  let worker = new Worker("./worker/pthread.js");

  globalThis.stopWorker = () => {
    worker.terminate();
    alert("已停止构建，如需要重新构建请刷新页面后进行配置");
  }

  globalThis.imeHandler = convertToPortInstance(IMEHandler as any, worker, [
    "writeToSharedData",
    "writeToData",
    "updateData",
    "flushCache",
    "writeFiles",
    "writeToBuild",
    "writeToUserDB"
  ]) as InstanceType<typeof IMEHandler>;

  registerFileHandler(imeHandler);
  
  let infos = document.getElementById("infos") as HTMLTextAreaElement;
  let printErr = getPrintWithTextareaElement(infos);

  worker.onmessage = (ev) => {
    let  { data } = ev.data as IMessageObjectType;
    let { type, value } = data;

    switch (type) {
      case "printErr":
        printErr(...value);
        break;
      case "updateData":
        if (value[0]) alert("构建已完成，请点击`同步此次修改`按钮");
        else alert("构建失败！建议使用本地已构建的文件进行配置输入方案。");
        break;
      case "flushCache":
        alert("方案已部署成功，扩展将进行重启，可以切换到输入法测试是否成功。");
        setTimeout(() => {
          chrome.runtime.reload();
        }, 2000);
        break;
      case "writeToSharedData":
        imeHandler.updateData();
        break;
      case "writeFiles":
      case "writeToBuild":
      case "writeToUserDB":
        alert("文件部署成功，请点击`同步此次修改`按钮。");
        break;
    }
  }
}

main();
