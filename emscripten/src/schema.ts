import { getExtensionPackageFiles, getFileList as getExtFileList } from "src/api/extension/file";
import { getFileList as getWebFileList } from "src/api/common/files";
interface ISchemaData { 
  lists: [
    /** schema id*/ string, 
    /** schema name */ string, 
    /** schema deps */ string[]
  ][];
}

let _schemaData: Promise<ISchemaData>;
let _schemaEntries: Promise<FileEntry[]>;

let isChromeExt = typeof chrome == "object" && Reflect.has(chrome, "runtime");

export class BuiltinSchema {
  requiredFiles: [string, File[]][] = [];
  schemaDepFiles = new Set<FileEntry | string>();
  
  getSchemaData() {
    if (!_schemaData) {
      _schemaData = fetch("./data/schema.json").then((res) => res.json());
    }
    return _schemaData;
  }

  getDefaultFile(names: string | string[]) {
    return fetch("./data/default.yaml").then((res) => res.text())
      .then((text) => {
        if (typeof names === "string") names = [names];
        let nameStr = names.map((name) => `- schema: ${name}`).join("\n  ");
        return text.replace("- schema: double_pinyin_pyjj", nameStr);
      }).then((text) => {
        return new File([text], "default.yaml");
      });
  }

  async getRequiredFiles() {
    let fileList = isChromeExt 
      ? await getExtFileList(await getExtensionPackageFiles("./data/opencc"))
      : await getWebFileList(await fetch("./data/openccEntries.json")
        .then(res => res.json())
        .then((entries) => entries.map((filename: string) => "./data/opencc/" + filename)));
      
    this.requiredFiles.push(["data/user/opencc", fileList]);

    let userDepsList = ["./data/installation.yaml", "./data/user.yaml"];

    fileList = isChromeExt 
      ? await getExtFileList(await getExtensionPackageFiles(userDepsList))
      : await getWebFileList(userDepsList);
  
    this.requiredFiles.push(["data/user", fileList]);

    return this.requiredFiles;
  }


  async setSchemaDepsFiles(name: string, deps: string[]) {
    let lists = [name, ...deps];

    let depFiles;
    if (isChromeExt) {
      let schemaEntries = await getExtensionPackageFiles("./data/schema");
      let newSchemaEntries = schemaEntries.filter(
        (fileEntry) => lists.indexOf(fileEntry.name.split(".")[0]) > -1
      );
      newSchemaEntries.forEach((fileEntry) => {
        this.schemaDepFiles.add(fileEntry);
      });

    } else {
      let fileList: string[] = await fetch("./data/schemaEntries.json").then(res => res.json());
      let newFileList = fileList.filter(
        (filename) => lists.indexOf(filename.split(".")[0]) > -1
      );
      newFileList.forEach((filename) => this.schemaDepFiles.add("./data/schema/" + filename));

    }

  }

  async getSchemaDepFiles() {
    let depFiles = isChromeExt ? await getExtFileList([...this.schemaDepFiles] as FileEntry[])
      : await getWebFileList([...this.schemaDepFiles] as string[]);
    
      return ["data/build", depFiles];
  }

}