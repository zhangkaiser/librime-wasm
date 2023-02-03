
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { IMessageObjectType } from "src/api/common/message";
import { convertToPortInstance } from "src/api/common/port";
import { getPrintWithTextareaElement } from "src/api/emscripten/io";
import { IMEHandler } from "./imehandler";
import { BuiltinSchema } from "./schema";
import { getTempStrArr } from "src/utils/template-strings-array";

import styles from "../css/pages.css";

@customElement("options-page")
export class OptionsPage extends LitElement {
  #terminalElem?: HTMLTextAreaElement;

  static styles = css(getTempStrArr(styles));
  
  @state({
    hasChanged(value, oldValue) {
      return true;
    }
  }) lists: [string, string, string[]][] = [];
  @state()
  imeWasRunning = false;

  choosedSchemas: Record<number, [string, string, string[]]> = {};

  builtinSchema: BuiltinSchema;

  imeHandler: IMEHandler = new IMEHandler;

  constructor() {
    super();

    this.builtinSchema = new BuiltinSchema();

    this.builtinSchema.getSchemaData().then((data) => {
      this.lists = data.lists;
    });

  }

  stopWorker() {
    // pass.
  }

  setWorker(worker: Worker) {
    this.registerIMEHandler(worker);

    this.stopWorker = () => worker.terminate();

    worker.onmessage = (ev) => {
      let  { data } = ev.data as IMessageObjectType;
      let { type, value } = data;
  
      switch (type) {
        case "printErr":
          this.printLog(...value);
          break;
        case "updateData":
          if (value[0]) this.printLog("方案构建成功");
          else this.printLog("方案更新失败！建议使用本地已构建的文件进行配置输入方案。");
          break;
        case "flushCache":
          alert("方案已部署成功，扩展将进行重启，可以切换到输入法测试是否成功。");
          setTimeout(() => {
            chrome.runtime.reload();
          }, 2000);
          break;
        case "writeToSharedData":
          this.imeHandler.updateData();
          break;
        case "writeFiles":
        case "writeToBuild":
        case "writeToUserDB":
          type
          console.info("文件部署成功");
          break;
      }
    }
  }

  registerIMEHandler(worker: Worker) {
    this.imeHandler = convertToPortInstance(IMEHandler as any, worker, [
      "writeToSharedData",
      "writeToData",
      "updateData",
      "flushCache",
      "writeFiles",
      "writeToBuild",
      "writeToUserDB"
    ]) as InstanceType<typeof IMEHandler>;
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
        this.imeHandler.writeToSharedData(files);
        break;
      case "addBuiltDataFiles":
      case "addYamlDataFiles":
        this.imeHandler.writeToBuild(files);
        break;
    }
  }

  onBtnClick(ev: Event) {
    let target = ev.target as HTMLButtonElement;
    let {id} = target;

    switch(id) {
      case "cancel":
        this.stopWorker();
        break;
      case "save":
        this.imeHandler.flushCache();
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
      await this.builtinSchema.setSchemaDepsFiles(schemaItem[0], schemaItem[2]);
      names.push(schemaItem[0]);
    }

    let defaultFile = await this.builtinSchema.getDefaultFile(names);
    this.imeHandler.writeToBuild([defaultFile] as any as FileList);

    let requiredFiles = await this.builtinSchema.getRequiredFiles();

    requiredFiles.forEach((files) => {
      this.imeHandler.writeFiles(files[0], files[1] as any as FileList);
    });

    let schemaDepFiles = await this.builtinSchema.getSchemaDepFiles();
    this.imeHandler.writeFiles(schemaDepFiles[0] as string, schemaDepFiles[1] as any as FileList);
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

  clickCategory(e: Event) {
    let target = e.currentTarget as HTMLDivElement;
    let nextElement = target.nextElementSibling as HTMLTableSectionElement;
    if (nextElement && nextElement.tagName === "SECTION") {
      nextElement.hidden = !nextElement.hidden;
    }
  }

  bulitinSchemasUI() {
    return html`
<div class="category-bg">
  <div class="category-title" @click=${this.clickCategory}>
    <p class="">内置输入方案</p>
  </div>
  <section>
    <div>
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

  customSchemeUI() {
    return html`
<div class="category-bg">
  <div class="category-title" @click=${this.clickCategory}>
    <p class="">自定义构建方案</p>
  </div>
  <section>
    <div class="showlog" @click=${this.showLog}>
      <input type="checkbox" />
      <span>展示构建记录</span>
      <div id="terminal"></div>
    </div>
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

  updateFileUI() {
    return html`

    `;
  }

  commitUpdate() {
    return html`
    `
  }

  getTerminalElem() {
    if (!this.#terminalElem) {  
      let textarea = document.createElement("textarea") as HTMLTextAreaElement;
      textarea.rows = 10;
      textarea.className = "info";
      this.#terminalElem = textarea;
      this.printLog = getPrintWithTextareaElement(textarea);
    }

    return this.#terminalElem;
  }

  get terminal() {
    return this.shadowRoot!.getElementById("terminal");
  }

  #showingLog = false;

  showLog() {
    this.#showingLog = !this.#showingLog;
    if (this.#showingLog) this.terminal?.appendChild(this.getTerminalElem());
    else this.terminal?.removeChild(this.getTerminalElem());
  }


  printLog(...args: string[]) {
    console.log(...args);
  }

  render() {
    return html`
    ${this.imeIgnore()}
    <div class="build-schema">
      ${this.bulitinSchemasUI()}
      ${this.customSchemeUI()}
      ${this.updateFileUI()}
    </div>

    <div class="btn-bg">
      <button class="btn-1" id="save" @click=${this.onBtnClick}>确定此次修改</button>
    </div>
    `;
  }
}