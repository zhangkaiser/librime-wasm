
export function getFilenameByPath(path: string) {
  let paths = path.split('/').filter((p) => !!p);
  return paths[-1];
}

export function getBlobFile(fs: typeof FS, path: string): Blob {
  let data = fs.readFile(path);
  return new Blob([data.buffer]);
}

export function getFileFile(fs: typeof FS, path: string): File {
  let data = fs.readFile(path);
  return new File([data.buffer], getFilenameByPath(path));
}

export function getDataURLByFileReader(blob: Blob): Promise<{url: string}> {

  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onloadend = (ev) => {
      let result = ev.target?.result
      if (!result) reject("Not loaded result.");
      resolve({
        url: result as string
      });
    }
    fileReader.onerror = reject;
    fileReader.readAsDataURL(blob);
  })
}

export async function downloadFileUseChromeDownloadAPI(fs: typeof FS, path: string) { 
  let file = getFileFile(fs, path);

  let data = await getDataURLByFileReader(file);

  chrome.downloads.download({
    url: data['url'],
    filename: file.name
  });  
}

export async function downloadFileUseChromeTabsAPI(fs: typeof FS, path: string) {
  let blob = getBlobFile(fs, path);
  let data = await getDataURLByFileReader(blob);

  chrome.tabs.create({
    url: data['url']
  });
}

export function writeFileFromFile(fs: typeof FS,file: File, path = "", isRelative = false) {
  
  return file.arrayBuffer().then((buffer) => {

    let basePath = "";
    if (isRelative) {
      basePath = path;
      path = path + "/" + file.name;
    } else {
      path = (path ? path + "/" : "") + (file.webkitRelativePath ? file.webkitRelativePath : file.name);
      basePath = path.replace(file.name, "");
    }
    
    try {
      (fs as any).createPath("/", basePath, true, true);
      let bufferView = new DataView(buffer);
      fs.writeFile(path, bufferView);
      return true;
    } catch(e) {
      return false;
    }
  });
}

export function writeFileFromFileList(fs: typeof FS, files: FileList, path: string = "", relative: boolean = true) {
    
  let promises = [];
  for (let file of files) {
    promises.push(writeFileFromFile(FS, file, path));
  }

  return Promise.all(promises);
}