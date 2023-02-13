
import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { IMessageObjectType } from "src/api/common/message";
import { convertToPortInstance } from "src/api/common/port";
import { getPrintWithTextareaElement } from "src/api/emscripten/io";
import { getTempStrArr } from "src/utils/template-strings-array";
import { getFilenameByPath } from "src/api/emscripten/files";

import { IMEHandler } from "./imehandler";
import { BuiltinSchema } from "./schema";

import styles from "../css/pages.css";

@customElement("options-page")
export class OptionsPage extends LitElement {
  #terminalElem?: HTMLTextAreaElement;

  static styles = css(getTempStrArr([styles]));
  
  @state({
    hasChanged(value, oldValue) {
      return true;
    }
  }) lists: [string, string, string[]][] = [];
  @state() imeWasRunning = false;
  @state() buildFiles: string[] = [];

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

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.showLog();
  }

  setWorker(worker: Worker) {
    this.registerIMEHandler(worker);

    this.stopWorker = () => worker.terminate();

    worker.addEventListener("message", async (ev) =>{
      let  { data } = ev.data as IMessageObjectType;
      let { type, value } = data;
  
      switch (type) {
        case "printErr":
          this.printLog(...value);
          break;
        case "updateData":
          if (value[0]) this.printLog("方案构建成功，点击`保存并更新页面`按钮，就可以正常使用啦~");
          else this.printLog("方案更新失败，建议使用本地已构建的文件进行配置输入方案。");
          break;
        case "flushCache":
          this.printLog("方案已部署成功，页面将进行重启，请手动测试是否部署成功。");
          setTimeout(() => {
            typeof chrome === "object" && Reflect.has(chrome, "runtime") && Reflect.has(chrome.runtime, "reload") 
              ? chrome.runtime.reload()
              : this.refresh();
          }, 1000);
          alert("页面将重启");

          break;
        case "writeToSharedData":
          this.printLog("写入文件成功，开始添加构建依赖文件。");
          await this.setRequiredFiles();
          this.printLog("开始构建文件，请等待");
          this.imeHandler.updateData();
          break;
        case "writeToData":
          break;
        case "writeFiles":
        case "writeToBuild":
        case "writeToUserDB":
          console.info(type, "文件写入成功");
          break;
        case "readBuiltFile":
          this.buildFiles = (value[0] as string[]).filter((file) => ['.', '..'].indexOf(file) === -1);
          break;
        case "downloadFile":
          if (!value.length) return;
          this.printLog("正在下载文件");
          let a = document.createElement("a");
          a.hidden = true;
          a.href = value[0].url;
          a.download = getFilenameByPath(value[0].filepath);
          this.shadowRoot!.appendChild(a);
          a.click();
          break;
      }

    });
  }

  registerIMEHandler(worker: Worker) {
    this.imeHandler = convertToPortInstance(IMEHandler as any, worker, [
      "writeToSharedData",
      "writeToData",
      "updateData",
      "flushCache",
      "writeFiles",
      "writeToBuild",
      "writeToUserDB",
      "readBuiltFile",
      "downloadFile"
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
    this.printLog("正在写入文件，请稍等");
    switch(id) {
      case "addSourceDataFilesFromDirectory":
      case "addSourceDataFiles":
        this.imeHandler.writeToSharedData(files);
        break;
      case "addBuiltDataFilesFromDirectory":
        this.imeHandler.writeToData(files);
        break;
      case "updateSchemaFiles":
      case "addYamlDataFiles":
        this.imeHandler.writeToBuild(files);
        break;
      case "updateUserDataFilesFromDirectory":
        this.imeHandler.writeToUserDB(files);
        break;
    }
  }

  onBtnClick(ev: Event) {
    let target = ev.target as HTMLButtonElement;
    let {id} = target;

    switch(id) {
      case "cancel":
        this.stopWorker();
        alert("构建已停止，请刷新页面后再操作。");
        break;
      case "save":
        this.printLog("正在保存文件...");
        this.imeHandler.flushCache();
    }
  }

  refresh() {
    location.reload();
  }

  showLoading() {
    window.document.body.style.cursor = "wait";
  }

  hideLoading() {
    window.document.body.style.cursor = "default";
  }

  async setRequiredFiles() {

    this.printLog("加载静态数据文件,请等待");
    let requiredFiles = await this.builtinSchema.getRequiredFiles();

    requiredFiles.forEach((files) => {
      this.imeHandler.writeFiles(files[0], files[1] as any as FileList);
    });
    this.printLog("静态数据文件加载成功");

    return true;
  }

  async createSchemasFromBuiltin() {
    if (!Object.keys(this.choosedSchemas).length) return alert("请选择方案!");
    this.showLoading();
    this.printLog("加载依赖文件中");
    let names = [];
    for (let index in this.choosedSchemas) {
      let schemaItem = this.choosedSchemas[index];
      await this.builtinSchema.setSchemaDepsFiles(schemaItem[0], schemaItem[2]);
      names.push(schemaItem[0]);
    }
    this.printLog("加载default.yaml文件,请等待");
    let defaultFile = await this.builtinSchema.getDefaultFile(names);
    this.imeHandler.writeToBuild([defaultFile] as any as FileList);
    this.printLog("default.yaml文件加载成功");
    
    await this.setRequiredFiles();

    this.printLog("加载方案依赖文件,请等待");
    let schemaDepFiles = await this.builtinSchema.getSchemaDepFiles();
    this.imeHandler.writeFiles(schemaDepFiles[0] as string, schemaDepFiles[1] as any as FileList);
    this.printLog("方案文件加载成功");
    this.printLog("依赖文件部署成功, 点击`保存并更新页面`按钮，就可以正常使用啦~");
    this.hideLoading();
  }

  imeIgnore() {
    return html`
<div class="">
  <div>
    <span>
      <p style="color: red;font-size: 14px;">在ChromeOS中部署方案时，请先关闭当前打开依赖页面，并切换到其它输入法，然后再打开此配置项页面进行配置，否则可能无法成功配置。</p>
      <p style="color: red;font-size: 14px;">方案构建/上传成功之后请务必点击顶部的"保存并更新页面"按钮(并可在顶部黑框中查看方案部署状态)</p>
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
    <p class="">选择内置输入方案</p>
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
          <button class="btn-1" @click=${this.createSchemasFromBuiltin}>部署方案</button>
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
  <section hidden>
    <div class="chunk">
    ${this.addCustomBuild()}
    </div>
    <div class="chunk">
    ${this.addBuiltData()}
    </div>
  </section>
</div>
    `;
  }

  addCustomBuild() {
    return html`
      <div class="fix">
        <span>
          <span class="controlled-setting-with-label">使用原始文件（未构建的文件）进行构建</span>
        </span>
        <div class="">
          <button class="btn-2" type="button">
            <span>选择文件夹</span>
            <input class="hide-input" @change=${this.onFilePickerChange} type="file" id="addSourceDataFilesFromDirectory" webkitdirectory multiple>
          </button>
          <button class="btn-2" type="button">
            <span>选择文件</span>
            <input class="hide-input" @change=${this.onFilePickerChange} id="addSourceDataFiles" type="file" accept=".yaml,.txt" multiple >
          </button>
        </div>
        <div class="desc">
          <p>1. 使用未构建的方案进行构建时需要注意，构建大型词库文件耗时较长，建议使用已构建好的文件进行部署。</p>
          <p>2. 原始文件(主要包含.yaml词库依赖配置文件, .txt两类文件)。</p>
          <p>3. 不支持使用“lua”扩展的功能，所以需要注意schema.yaml配置文件中不要包含“lua”相关配置项。</p>
        </div>
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
          <span>使用已构建的文件部署:</span>
          
        </span>
        <div class="">
          <button class="btn-2" type="button">
            <span>选择文件夹</span>
            <input class="hide-input" @change=${this.onFilePickerChange} type="file" id="addBuiltDataFilesFromDirectory" webkitdirectory multiple>
          </button>
        </div>
        <div class="desc">
          <p>1. 文件格式说明：所选择的文件夹中,需要包含两个文件夹（build,user）</p>
          <p>2. build文件夹：包含所有已构建的文件方案（.bin二进制文件,*.schema.yaml方案配置文件,defualt.yaml配置文件）</p>
          <p>3. user文件夹：包含用户数据文件（方案的数据库文件夹，installation.yaml，user.yaml, opencc数据文件夹，用户自定义配置文件）</p>
          <a href="https://github.com/zhangkaiser/librime-wasm/tree/builtdata-example">查看案例</a>
        </div>
      </div>
    `
  }

  showFileList() {
    this.imeHandler.readBuiltFile();
  }

  downloadBuildFile(e: Event) {
    let target = e.target as HTMLButtonElement;
    let { id } = target;
    this.imeHandler.downloadFile("/data/build/" + id);
  }

  manageFileUI() {
    return html`
<div class="category-bg">
  <div class="category-title" @click=${this.clickCategory}>
    <p class="">文件管理</p>
  </div>
  <section hidden>
    <div class="">
      <button class="btn-2" type="button">
        <span>修改用户方案数据库</span>
        <input class="hide-input" @change=${this.onFilePickerChange} type="file" id="updateUserDataFilesFromDirectory" webkitdirectory multiple>
      </button>
      <button class="btn-2">
        <span>修改方案配置文件</span>
        <input class="hide-input" @change=${this.onFilePickerChange} type="file" id="updateSchemaFiles" accept=".yaml,.bin" multiple>
      </button>
    </div>
    <div class="desc">
      <p>1. 修改用户方案数据库：可以选择相关方案的leveldb数据库文件夹userdb、opencc文件夹。</p>
      <p>2. 修改方案配置文件：可以选择已构建的方案配置文件(default.yaml, luna_pinyin.schema.yaml等)、方案的二进制文件(.bin)</p>
    </div>
    <div class="showlog">
      <button @click=${this.showFileList}>查看已部署文件列表</button>
      <div class="file-list">
        ${this.buildFiles.map((filename) => html`
          <div class="file-item">
            <div class="file-1">- ${filename}</div>
            <button @click=${this.downloadBuildFile} .id=${filename} calss="btn-3">下载</button>
          </div>
        `)}
      </div>
    </div>
  </section>
</div>
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
    <div>
      <div class="showlog" @click=${this.showLog}>
        <!--<input type="checkbox" />-->
        <span>构建记录</span>
      </div>
      <div id="terminal"></div>

      <div class="btn-bg">
        <button class="btn-1" id="save" @click=${this.onBtnClick}>保存并更新页面</button>
        <button class="btn-1" id="cancel" @click=${this.onBtnClick}>停止构建</button>
      </div>
    </div>
    <div class="build-schema">
      ${this.bulitinSchemasUI()}
      ${this.customSchemeUI()}
      ${this.manageFileUI()}
    </div>
    `;
  }
}