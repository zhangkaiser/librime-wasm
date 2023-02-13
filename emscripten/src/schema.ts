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

let isChromeExt = typeof chrome == "object" && Reflect.has(chrome, "tabs");

export const builtinFileEntries = {
  schemaManifest: "./data/schema.json",
  defaultFile: "./data/default.yaml",
  installationFile: "./data/installation.yaml",
  userFile: "./data/user.yaml",
  openccDir: "./data/opencc",
  schemaDir: "./data/schema",
  openccManifest: "./data/openccEntries.json",
  schemasManifest: "./data/schemaEntries.json"
}

export function changeAssetsPath(dir: string) {
  for (let entryName in builtinFileEntries) {
    let entryPath = (builtinFileEntries as any)[entryName] as string;
    (builtinFileEntries as any)[entryName] = entryPath.replace("./", "./" + dir + "/");
  }
}

export class BuiltinSchema {
  requiredFiles: [string, File[]][] = [];
  schemaDepFiles = new Set<FileEntry | string>();
  
  getSchemaData() {
    if (!_schemaData) {
      _schemaData = fetch(builtinFileEntries.schemaManifest).then((res) => res.json());
    }
    return _schemaData;
  }

  getDefaultFile(names: string | string[]) {
    return fetch(builtinFileEntries.defaultFile).then((res) => res.text())
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
      ? await getExtFileList(await getExtensionPackageFiles(builtinFileEntries.openccDir))
      : await getWebFileList(await fetch(builtinFileEntries.openccManifest)
        .then(res => res.json())
        .then((entries) => entries.map((filename: string) => builtinFileEntries.openccDir + filename)));
      
    this.requiredFiles.push(["data/user/opencc", fileList]);

    let userDepsList = [builtinFileEntries.installationFile, builtinFileEntries.userFile];

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
      let schemaEntries = await getExtensionPackageFiles(builtinFileEntries.schemaDir);
      let newSchemaEntries = schemaEntries.filter(
        (fileEntry) => lists.indexOf(fileEntry.name.split(".")[0]) > -1
      );
      newSchemaEntries.forEach((fileEntry) => {
        this.schemaDepFiles.add(fileEntry);
      });
    } else {
      let fileList: string[] = await fetch(builtinFileEntries.schemasManifest).then(res => res.json());
      let newFileList = fileList.filter(
        (filename) => lists.indexOf(filename.split(".")[0]) > -1
      );
      newFileList.forEach((filename) => this.schemaDepFiles.add(builtinFileEntries.schemaDir + filename));
    }

  }

  async getSchemaDepFiles() {
    let depFiles = isChromeExt ? await getExtFileList([...this.schemaDepFiles] as FileEntry[])
      : await getWebFileList([...this.schemaDepFiles] as string[]);
    
    return ["data/build", depFiles];
  }

}