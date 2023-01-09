<meta charset="UTF-8">

RIME WASM: Rime Input Method Engine For Chrome OS/Web WASM Env with Emscripten.
===

当前支持状态描述：
  - Chrome OS测试版本已经发布到[https://github.com/zhangkaiser/zhime/releases/tag/0.0.1](https://github.com/zhangkaiser/zhime/releases/tag/0.0.1)中，可进行安装测试。
  - 内置了`几个输入法方案`，可以进行简单部署词库。
  - 添加`自定义管理词库/方案`的文件管理功能，可以在`扩展选项页面`进行设置上传/更新/修改自己的输入方案和词库。
  - 可在Chrome OS MV2下正常使用。
  - Chrome OS MV3下由于RIME API中使用了`线程`当前在`Service Worker`的特性中会触发内存堆栈错误（已添加一个简单的逻辑来解决这个问题：是打开一个页面来运行RIME的依赖进行交互）。
  - Web应用程序在所有情况下都可以正常使用。
  - RIME原始用户自定义解决方案/已经构建长期使用的词库都可以支持到位（使用`lua脚本`转换的功能无法使用/完成构建）。