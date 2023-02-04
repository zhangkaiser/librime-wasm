<meta charset="UTF-8">

RIME WASM: Rime Input Method Engine For Chrome OS/Web runtime environment with Emscripten.
===

Example: [https://zhime.pinquapp.com/](https://zhime.pinquapp.com/)

当前支持状态：

  - Chrome OS测试版本已经发布到[https://github.com/zhangkaiser/zhime/releases/tag/0.0.1](https://github.com/zhangkaiser/zhime/releases/tag/0.0.1)中，可进行安装测试。
  - 内置了`几个输入法常用的方案`，可以进行简单快速部署词库。
  - 添加了简单地文件管理支持，可以轻松部署本地输入法方案和用户词库。

## 使用说明

- `Ctrl+ ~`快捷键 -> 输入法方案的切换（简／繁体切换、方案切换）。
- `Shift`按键 -> 中英文切换。
- 不支持使用`lua`语言的插件功能 -> 在构建时，方案配置文件中含有`lua字段`则无法完成构建。

## 构建说明

- 使用`node+emscripten`进行开发
- 构建之前需要先配置`package.json`中的`set:env`属性值(emscripten安装依赖位置)。
- librime需要的`第三方静态库`和所依赖的`头文件`已经生成完成，可以直接用于构建。

```shell

npm install
npm run librime # 用来构建`librime.a`静态库文件
npm run build # 用来构建`librime`运行时依赖文件
```

## 更多构建/开发参考

- [https://github.com/ztl8702/librime](https://github.com/ztl8702/librime) 本仓库的构建主要参考了此项目
- [https://github.com/LibreService/my_rime](https://github.com/LibreService/my_rime) 

