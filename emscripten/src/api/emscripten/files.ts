
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