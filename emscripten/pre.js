
function initFS() {
  let depsId = "fs initFS";
  FS.mkdir("/build");
  FS.mount(IDBFS, {root: "."}, "/build");
  Module.addRunDependency(depsId);
  FS.syncfs(true, (err) => {
    if (err) reject(err);
    try {
      FS.stat("/build/installation.yaml");
      FS.symlink("/build/installation.yaml", "/installation.yaml");
      FS.symlink("/build/user.yaml", "/user.yaml");
      FS.symlink("/build/luna_pinyin.userdb", "/luna_pinyin.userdb");
      // FS.symlink("/build/cangjie5.userdb", "/cangjie5.userdb");
    } catch(e) {
      console.log("No install.");
    }
    Module.removeRunDependency(depsId);

  });
  
}

globalThis.rimeNotificationHandler =  function(type, value) {
  if (Module['rimeNotificationHandler']) {
    Module['rimeNotificationHandler'](type, value);
  } else {
    console.error("No notification handler.", type, value);
  }
}

globalThis.refreshFS = () => {
  
  try {
    FS.stat("/build/installation.yaml");
  } catch(e) {
    console.error("Not found installation.yaml!");
    ["installation.yaml", "user.yaml", "luna_pinyin.userdb", /**"cangjie5.userdb"*/].forEach((item) => {
      FS.symlink(`/${item}`, `/build/${item}`)
    });
  }
  FS.syncfs(false, () => {});
}

window.onclose = function() {
  refreshFS();
}

Module.preRun.push(initFS);