# 流程模型

Electron 继承了来自 Chromium 的多进程架构，这使得此框架在架构上非常相似于一个现代的网页浏览器

Electron 应用程序的结构非常相似。 作为应用开发者，你将控制两种类型的进程：主进程 和 渲染器进程。 这类似于上文所述的 Chrome 的浏览器和渲染器进程。

## 主进程
每个 Electron 应用都有一个单一的主进程，作为应用程序的入口点。 主进程在 Node.js 环境中运行，这意味着它具有 require 模块和使用所有 Node.js API 的能力。

### 窗口管理

主进程的首要目的是使用 BrowserWindow 模块创建和管理应用程序窗口

BrowserWindow 类的每个实例创建一个应用程序窗口，且在单独的渲染器进程中加载一个网页。 您可以在主进程中用 window 的 webContents 对象与网页内容进行交互。

由于 BrowserWindow 模块是一个 EventEmitter， 所以您也可以为各种用户事件 ( 例如，最小化 或 最大化您的窗口 ) 添加处理程序。

### 应用程序生命周期

### 原生 API
为了使 Electron 的功能不仅仅限于对网页内容的封装，主进程也添加了自定义的 API 来与用户的作业系统进行交互。 Electron 有着多种控制原生桌面功能的模块，例如菜单、对话框以及托盘图标。

## 渲染器进程
每个 Electron 应用都会为每个打开的 BrowserWindow ( 与每个网页嵌入 ) 生成一个单独的渲染器进程。 

1. 以一个 HTML 文件作为渲染器进程的入口点。
2. 使用层叠样式表 (Cascading Style Sheets, CSS) 对 UI 添加样式。
3. 通过 <script> 元素可添加可执行的 JavaScript 代码。
4. 此外，这也意味着渲染器无权直接访问 require 或其他 Node.js API。 为了在渲染器中直接包含 NPM 模块，您必须使用与在 web 开发时相同的打包工具 (例如 webpack 或 parcel)


### Preload 脚本

预加载（preload）脚本包含了那些执行于渲染器进程中，且先于网页内容开始加载的代码 。 这些脚本虽运行于渲染器的环境中，却因能访问 Node.js API 而拥有了更多的权限。

预加载脚本可以在 BrowserWindow 构造方法中的 webPreferences 选项里被附加到主进程。
main.js
const { BrowserWindow } = require('electron')
// ...
const win = new BrowserWindow({
  webPreferences: {
    preload: 'path/to/preload.js'
  }
})
// ...

因为预加载脚本与浏览器共享同一个全局 Window 接口，并且可以访问 Node.js API，所以它通过在全局 window 中暴露任意 API 来增强渲染器，以便你的网页内容使用。

尽管预加载脚本与其所附着的渲染器共享着同一个全局 window 对象，但您并不能在预加载脚本中直接将任何变量附加到 window 上，因为 contextIsolation 是默认启用的。

```javascript
preload.js
window.myAPI = {
  desktop: true
}

renderer.js
console.log(window.myAPI)  // => undefined
```

语境隔离（Context Isolation）意味着预加载脚本与渲染器的主要运行环境是隔离开来的，以避免泄漏任何具特权的 API 到您的网页内容代码中。

作为替代，请使用 contextBridge 模块来安全地实现这一目的：

```js
preload.js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
  desktop: true
})

renderer.js
console.log(window.myAPI)
// => { desktop: true }
```

此功能对两个主要目的來說非常有用：

通过向渲染器暴露 ipcRenderer 帮助程序，您可以使用进程间通信（IPC）从渲染器触发主进程的任务（反之亦然）。
如果您正在为远程 URL 上托管的现有 web 应用开发 Electron 封裝，则您可在渲染器的 window 全局变量上添加自定义的属性，好在 web 客户端用上仅适用于桌面应用的设计逻辑 。
实用进程
每个 Electron 应用程序都可以通过在主进程中使用 UtilityProcess API 生成多个子进程。 实用进程在 Node.js 环境中运行，这意味着它具有 require 模块和使用所有 Node.js API 的能力。 实用进程可用于托管例如不受信任的服务、CPU 密集型任务，以及以前那些托管在主进程中或者使用 Node.js child_process.fork API 生成的进程中的容易崩溃的组件。 实用进程与使用 Node.js child_process 模块生成的进程之间的主要区别是：实用进程可以使用 MessagePort 与渲染进程建立通信通道。 当 Electron 应用需要从主进程生成一个子进程时，您总是可以用 UtilityProcess API 替代 Node.js 的 child_process.fork API。