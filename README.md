<meta charset="UTF-8">

RIME WASM: Rime Input Method Engine For Chrome OS/Web WASM Env with Emscripten.
===

当前支持状态描述：
  可在Chrome OS MV2下正常使用。
  Chrome OS MV3下由于RIME API中使用了`线程`当前在`Service Worker`的特性中会触发内存堆栈错误（已添加一个简单的逻辑来解决这个问题：是打开一个页面来运行RIME的依赖进行交互）。
  Web应用程序在所有情况下都可以正常使用。
  RIME原始用户自定义解决方案/已经构建长期使用的词库都可以支持到位（使用`lua脚本`转换的功能无法使用/完成构建）。
  


