
async function initFS() {
  let depsId = "fs initFS";
  FS.mkdir("/build");
  FS.mount(IDBFS, {root: "."}, "/build");
  Module.addRunDependency(depsId);
  await (new Promise((resolve) => {
    FS.syncfs(true, (err) => {
      if (err) return console.error(err);
      try {
        FS.stat("/build/installation.yaml");
        FS.symlink("/build/installation.yaml", "/installation.yaml");
        FS.symlink("/build/user.yaml", "/user.yaml");
        FS.symlink("/build/luna_pinyin.userdb", "/luna_pinyin.userdb");
        FS.symlink("/build/cangjie5.userdb", "/cangjie5.userdb");
      } catch(e) {
        console.log("No install.");
      }
      
      resolve(true);
    });
  }));
  Module.removeRunDependency(depsId);
}

globalThis.refreshFS = () => {
  
  try {
    FS.stat("/build/installation.yaml");
  } catch(e) {
    console.error("Not found installation.yaml!");
    ["installation.yaml", "user.yaml", "luna_pinyin.userdb", "cangjie5.userdb"].forEach((item) => {
      FS.symlink(`/${item}`, `/build/${item}`)
    });
  }
  FS.syncfs(false, () => {});
}

Module['onRuntimeInitialized'] = function() {
  console.log("[Debug]: inited");
  try {
    FS.stat("/build/installation.yaml");
    FS.rename("/build/installation.yaml", "/installation.yaml");
    FS.rename("/build/user.yaml", "/user.yaml");
    FS.rename("/build/luna_pinyin.userdb", "/luna_pinyin.userdb");
    FS.rename("/build/cangjie5.userdb", "/cangjie5.userdb");
  } catch(e) {
    console.log("Not install.");
  }
}

window.onclose = function() {
  refreshFS();
}

Module.preRun.push(initFS);