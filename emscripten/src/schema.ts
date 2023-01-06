import { getExtensionPackageFiles, getFileList } from "src/api/extension/file";

interface ISchemaData { 
  lists: [
    /** schema id*/ string, 
    /** schema name */ string, 
    /** schema deps */ string[]
  ][];
}

let _schemaData: Promise<ISchemaData>;
let _schemaEntries: Promise<FileEntry[]>;

export class Schema {
  writeFiles: [string, (FileEntry | File)[]][] = [];
  schemaDeps = new Set<FileEntry>();
  defaultSettingFile?: File;
  
  getSchemaData() {
    if (!_schemaData) {
      _schemaData = fetch("./data/schema.json").then((res) => res.json());
    }
    return _schemaData;
  }

  getSchemeEntries() {
    if (!_schemaEntries) {
      _schemaEntries = getExtensionPackageFiles("./data/schema");
    }
    return _schemaEntries;
  }

  setDefaultFile(names: string | string[]) {
    return fetch("./data/default.yaml").then((res) => res.text())
      .then((text) => {
        if (typeof names === "string") names = [names];
        let nameStr = names.map((name) => `- schema: ${name}`).join("\n  ");
        return text.replace("- schema: double_pinyin_pyjj", nameStr);
      }).then((text) => {
        this.defaultSettingFile = new File([text], "default.yaml");
      });
  }

  async setRequiredFiles() {
    let entries = await getExtensionPackageFiles("./data/opencc");
    let fileList = await getFileList(entries);
    this.writeFiles.push(["data/user/opencc", fileList]);

    entries = await getExtensionPackageFiles([
      "./data/installation.yaml",
      "./data/user.yaml"
    ]);
    fileList = await getFileList(entries);
  
    this.writeFiles.push(["data/user", fileList]);
  }

  async setSchemaDepsFiles(name: string, deps: string[]) {
    let schemaEntries = await this.getSchemeEntries();
    let lists = [name, ...deps];
    schemaEntries.filter(
      (fileEntry) => (lists.indexOf(fileEntry.name.split(".")[0]) > -1)
    ).forEach((fileEntry) => this.schemaDeps.add(fileEntry));
  }

  async runSchemaCreating() {
    let lists = [];
    this.writeFiles.forEach(() => {

    })

  }
}