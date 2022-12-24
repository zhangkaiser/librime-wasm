/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/api/base.ts":
/*!*************************!*\
  !*** ./src/api/base.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BaseEventManager": () => (/* binding */ BaseEventManager),
/* harmony export */   "EventListener": () => (/* binding */ EventListener)
/* harmony export */ });
class EventListener {
    static getEventListener(manager, eventName) {
        if (eventName in manager) {
            return manager[eventName].bind(manager);
        }
        throw new Error(`Not found ${eventName} function.`);
    }
    static getPoint(namespaces) {
        let currentPoint = globalThis;
        namespaces.split(".").forEach((name) => {
            if (name in currentPoint) {
                currentPoint = currentPoint[name];
            }
            else {
                throw new Error("Namespace error!");
            }
        });
        return currentPoint;
    }
    static registerListener(namespace, eventName, manager) {
        if (IMEConfig.envName === "chromeos"
            && Reflect.has(namespace, eventName)
            && Reflect.has(manager, eventName)) {
            let endPoint = namespace[eventName];
            if (Reflect.has(endPoint, 'addListener')) {
                let listener = manager[eventName].bind(manager);
                endPoint.addListener(listener);
                let dispose = () => {
                    endPoint.removeListener(listener);
                };
                return { dispose };
            }
        }
        throw new Error(`${eventName} listener registration fatal.`);
    }
    static registerEventListener(eventName, manager) {
        let listener = manager[eventName].bind(manager);
        manager.addEventListener(eventName, listener);
        let dispose = () => {
            manager.removeEventListener(eventName, listener);
        };
        return { dispose };
    }
    static getListener(manager, eventName) {
        if (Reflect.has(manager, eventName) && typeof manager[eventName] === 'function') {
            return manager[eventName].bind(manager);
        }
        throw new Error("Registe");
    }
}
class BaseEventManager extends EventTarget {
    constructor() {
        super(...arguments);
        this._events = {};
    }
    set events(lists) {
        lists.forEach((item) => {
            if (!item)
                return;
            this._events[item[0]] = item[1];
        });
    }
    addListeners(namespace, eventsList, manager) {
        this.events = eventsList.map((eventName) => {
            if (!Reflect.has(manager, eventName))
                return undefined;
            let eventManager = EventListener.registerListener(namespace, eventName, manager);
            return [eventName, eventManager];
        });
    }
    addEventListeners(eventsList, manager) {
        this.events = eventsList.map((eventName) => {
            if (!Reflect.has(manager, eventName))
                return undefined;
            let eventManager = EventListener.registerEventListener(eventName, manager);
            return [eventName, eventManager];
        });
    }
    static dispose(disposable) {
        disposable.dispose();
    }
}


/***/ }),

/***/ "./src/api/chromeos/config.ts":
/*!************************************!*\
  !*** ./src/api/chromeos/config.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ setChromeOSConfig)
/* harmony export */ });
/* harmony import */ var _states__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./states */ "./src/api/chromeos/states.ts");

function setChromeOSConfig() {
    globalThis.IMEConfig = {
        envName: "chromeos",
        menuItems: [],
        ime: chrome.input.ime,
        runtime: chrome.runtime,
        getGlobalState: _states__WEBPACK_IMPORTED_MODULE_0__.getGlobalState,
        saveGlobalState: _states__WEBPACK_IMPORTED_MODULE_0__.saveGlobalState,
        onInstalled() {
            chrome.runtime.openOptionsPage(console.log);
            return true;
        }
    };
}


/***/ }),

/***/ "./src/api/chromeos/states.ts":
/*!************************************!*\
  !*** ./src/api/chromeos/states.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getGlobalState": () => (/* binding */ getGlobalState),
/* harmony export */   "saveGlobalState": () => (/* binding */ saveGlobalState)
/* harmony export */ });
const STORAGE_KEY = "global_state";
let states = {};
function getGlobalState() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(STORAGE_KEY, (res) => {
            if (STORAGE_KEY in res) {
                resolve(res[STORAGE_KEY]);
            }
            else {
                resolve(undefined);
            }
        });
    });
}
function saveGlobalState(states) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({
            [STORAGE_KEY]: states
        }, () => {
            resolve(true);
        });
    });
}


/***/ }),

/***/ "./src/api/decoder.ts":
/*!****************************!*\
  !*** ./src/api/decoder.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecoderItemManager": () => (/* binding */ DecoderItemManager)
/* harmony export */ });
/* harmony import */ var src_model_enums__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/model/enums */ "./src/model/enums.ts");
/* harmony import */ var _setglobalconfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./setglobalconfig */ "./src/api/setglobalconfig.ts");
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _DecoderItemManager_port, _DecoderItemManager_main, _DecoderItemManager_permissions, _DecoderItemManager_shortcuts;


class DecoderItemManager {
    constructor(extID, config) {
        this.extID = extID;
        _DecoderItemManager_port.set(this, void 0);
        _DecoderItemManager_main.set(this, false);
        _DecoderItemManager_permissions.set(this, []);
        _DecoderItemManager_shortcuts.set(this, []);
        this.reconnectTimeoutID = 0;
        this.config = config;
    }
    get main() {
        return __classPrivateFieldGet(this, _DecoderItemManager_main, "f");
    }
    get permissions() {
        return __classPrivateFieldGet(this, _DecoderItemManager_permissions, "f");
    }
    get shortcuts() {
        return __classPrivateFieldGet(this, _DecoderItemManager_shortcuts, "f");
    }
    set config(data) {
        __classPrivateFieldSet(this, _DecoderItemManager_main, data[0], "f");
        __classPrivateFieldSet(this, _DecoderItemManager_permissions, data[1], "f");
        __classPrivateFieldSet(this, _DecoderItemManager_shortcuts, data[2], "f");
    }
    dispose() {
        clearTimeout(this.reconnectTimeoutID);
        __classPrivateFieldGet(this, _DecoderItemManager_port, "f")?.disconnect();
    }
    connect() {
        __classPrivateFieldSet(this, _DecoderItemManager_port, _setglobalconfig__WEBPACK_IMPORTED_MODULE_0__.imeConfig.runtime.connect(this.extID), "f");
        this.messageCb = this.onMessage.bind(this);
        __classPrivateFieldGet(this, _DecoderItemManager_port, "f").onMessage.addListener(this.messageCb);
        __classPrivateFieldGet(this, _DecoderItemManager_port, "f").onDisconnect.addListener(() => {
            __classPrivateFieldSet(this, _DecoderItemManager_port, undefined, "f");
        });
        this.addReconnectTimeout();
    }
    addReconnectTimeout() {
        this.reconnectTimeoutID = setTimeout(() => this.connect(), DecoderItemManager.RECONNECT_TIME);
    }
    onMessage(msg, port) {
        if (this.onmessage) {
            this.onmessage(msg, this);
        }
    }
    handleEvent(eventName, value) {
        if (__classPrivateFieldGet(this, _DecoderItemManager_permissions, "f")?.indexOf(eventName)) {
            if (eventName === "onKeyEvent") {
                let keyEvent = value[1];
                let requestId = value[2];
                if (keyEvent.type == src_model_enums__WEBPACK_IMPORTED_MODULE_1__.EventType.KEYDOWN) {
                    this.postMessage({
                        data: {
                            type: eventName,
                            value
                        }
                    });
                }
                _setglobalconfig__WEBPACK_IMPORTED_MODULE_0__.imeConfig.ime.keyEventHandled({ requestId, response: true });
            }
            this.postMessage({
                data: {
                    type: eventName,
                    value
                }
            });
            return true;
        }
        else {
            return false;
        }
    }
    postMessage(msg) {
        if (!__classPrivateFieldGet(this, _DecoderItemManager_port, "f"))
            this.connect();
        try {
            __classPrivateFieldGet(this, _DecoderItemManager_port, "f")?.postMessage(msg);
        }
        catch (e) {
            throw new Error(`Extension connect failed with ${this.extID}.`);
        }
    }
}
_DecoderItemManager_port = new WeakMap(), _DecoderItemManager_main = new WeakMap(), _DecoderItemManager_permissions = new WeakMap(), _DecoderItemManager_shortcuts = new WeakMap();
DecoderItemManager.RECONNECT_TIME = 3 * 60 * 1000;


/***/ }),

/***/ "./src/api/eventdispatcher.ts":
/*!************************************!*\
  !*** ./src/api/eventdispatcher.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IMEEventDispatcher": () => (/* binding */ IMEEventDispatcher)
/* harmony export */ });
class IMEEventDispatcher {
    constructor(lifecycle) {
        this.lifecycle = lifecycle;
        this.decoders = [];
    }
    add(decoder) {
        if (decoder.main) {
            this.mainDecoder = decoder;
            decoder.onmessage = (msg, manager) => {
                let { type, value } = msg.data;
                let subDecoders = this.decoders.filter(decoder => decoder.handleEvent(type, value));
                if (subDecoders.length === 0 && !this.lifecycle.handleIMEEvent(type, value)) {
                    throw new Error(`Not found IME event handler of ${type}.`);
                }
            };
        }
        else {
            this.decoders.push(decoder);
            decoder.onmessage = (msg, manager) => {
                let { type, value } = msg.data;
                if (!this.lifecycle.handleIMEEvent(type, value)) {
                    throw new Error(`Not found IME event handler of ${type}`);
                }
            };
        }
    }
    connects() {
        this.decoders.forEach((port) => {
            port.connect();
        });
    }
    dispatch(name, value) {
        if (!this.mainDecoder)
            throw new Error("Must be have main decoder.");
        this.mainDecoder.postMessage({
            data: {
                type: name,
                value
            }
        });
        this.decoders.forEach((decoder) => {
            decoder.handleEvent(name, value);
        });
    }
    disposes() {
        this.decoders.forEach((port) => {
            port.dispose();
        });
    }
}


/***/ }),

/***/ "./src/api/imelifecycle.ts":
/*!*********************************!*\
  !*** ./src/api/imelifecycle.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecoderLifecycle": () => (/* binding */ DecoderLifecycle),
/* harmony export */   "IMELifecycle": () => (/* binding */ IMELifecycle)
/* harmony export */ });
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base */ "./src/api/base.ts");
/* harmony import */ var _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./setglobalconfig */ "./src/api/setglobalconfig.ts");


const imeEventList = [
    "onActivate",
    "onAssistiveWindowButtonClicked",
    "onBlur",
    "onCandidateClicked",
    "onDeactivated",
    "onFocus",
    "onInputContextUpdate",
    "onKeyEvent",
    "onMenuItemActivated",
    "onReset",
    "onSurroundingTextChanged"
];
const imeMethodList = [
    "clearComposition",
    "commitText",
    "deleteSurroundingText",
    "hideInputView",
    "keyEventHandled",
    "sendKeyEvents",
    "setAssistiveWindowButtonHighlighted",
    "setAssistiveWindowProperties",
    "setCandidates",
    "setCandidateWindowProperties",
    "setComposition",
    "setCursorPosition",
    "setMenuItems",
    "updateMenuItems"
];
class IMELifecycle extends _base__WEBPACK_IMPORTED_MODULE_0__.BaseEventManager {
    constructor() {
        super();
        imeEventList.forEach((item) => {
            if (Reflect.has(this, item))
                return;
            this[item] = (...args) => {
                this.dispatchIMEEvent(item, args);
            };
        });
        imeMethodList.forEach((item) => {
            if (Reflect.has(this, item))
                return;
            if (!Reflect.has(_setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.ime, item))
                return;
            this[item] = (...args) => {
                _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.ime[item](...args);
            };
        });
    }
    dispatchIMEEvent(eventName, args) {
        this.eventDispatcher?.dispatch(eventName, args);
    }
    handleIMEEvent(eventName, args) {
        if (eventName in this) {
            this[eventName](...args);
            return true;
        }
        return false;
    }
    registerListeners() {
        this.addListeners(_setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.ime, imeEventList, this);
    }
    onActivate(engineID) {
        this._engineID = engineID;
        this.eventDispatcher?.connects();
        this.dispatchIMEEvent("onActivate", [engineID]);
    }
    onFocus(context) {
        this._contextID = context.contextID;
        this.dispatchIMEEvent("onFocus", [context]);
    }
    onDeactivated() {
        this.eventDispatcher?.disposes();
    }
    onKeyEvent(engineID, keyEvent, requestId) {
        this.dispatchIMEEvent("onKeyEvent", [engineID, keyEvent, requestId]);
    }
}
class DecoderLifecycle {
    onActivate(engineID) {
    }
    onAssistiveWindowButtonClicked(details) {
    }
    onBlur(contextID) {
    }
    onCandidateClicked(engineID, candidatesID, button) {
    }
    onDeactivated(engineID) {
    }
    onFocus(context) {
    }
    onInputContextUpdate(context) {
    }
    onKeyEvent(engineID, keyData, requestId) {
    }
    onMenuItemActivated(engineID, name) {
    }
    onReset(engineID) {
    }
    onSurroundingTextChanged(engineID, surroundingInfo) {
    }
}


/***/ }),

/***/ "./src/api/runtime.ts":
/*!****************************!*\
  !*** ./src/api/runtime.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecoderRuntimeManager": () => (/* binding */ DecoderRuntimeManager),
/* harmony export */   "UIRuntimeManager": () => (/* binding */ UIRuntimeManager),
/* harmony export */   "runtimeEventList": () => (/* binding */ runtimeEventList)
/* harmony export */ });
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base */ "./src/api/base.ts");
/* harmony import */ var _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./setglobalconfig */ "./src/api/setglobalconfig.ts");


const runtimeEventList = [
    "onConnect",
    "onConnectExternal",
    "onInstalled",
    "onMessage",
    "onMessageExternal",
    "onBrowserUpdateAvailable",
    "onRestartRequired",
    "onStartup",
    "onSuspend",
    "onSuspendCanceled",
    "onUpdateAvailable"
];
class BaseRuntimeManager extends _base__WEBPACK_IMPORTED_MODULE_0__.BaseEventManager {
    constructor() {
        super();
    }
    registerListeners() {
        this.addListeners(_setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.runtime, runtimeEventList, this);
    }
    sendMessage(msg) {
        msg.extID
            ? _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.runtime.sendMessage(msg.extID, msg.data, msg.cb)
            : _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.runtime.sendMessage(msg.data, msg.cb);
    }
}
class UIRuntimeManager extends BaseRuntimeManager {
    constructor() {
        super();
    }
    onInstalled() {
        console.log("onInstalled");
        if (_setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.onInstalled) {
            _setglobalconfig__WEBPACK_IMPORTED_MODULE_1__.imeConfig.onInstalled();
        }
    }
    onMessage(message, sender, sendResponse) {
    }
    onMessageExternal(message, sender, sendResponse) {
    }
    onConnect() {
    }
}
class DecoderRuntimeManager extends BaseRuntimeManager {
    constructor() {
        super();
    }
    onInstalled() {
    }
    onConnect() {
    }
    onConnectExternal() {
    }
    onMessage() {
    }
}


/***/ }),

/***/ "./src/api/setglobalconfig.ts":
/*!************************************!*\
  !*** ./src/api/setglobalconfig.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "imeConfig": () => (/* binding */ imeConfig)
/* harmony export */ });
/* harmony import */ var src_api_chromeos_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/api/chromeos/config */ "./src/api/chromeos/config.ts");



if (true) {
    (0,src_api_chromeos_config__WEBPACK_IMPORTED_MODULE_0__["default"])();
}
else {}
const imeConfig = globalThis.IMEConfig;


/***/ }),

/***/ "./src/model/enums.ts":
/*!****************************!*\
  !*** ./src/model/enums.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Decoders": () => (/* binding */ Decoders),
/* harmony export */   "EventType": () => (/* binding */ EventType),
/* harmony export */   "GlobalState": () => (/* binding */ GlobalState),
/* harmony export */   "InputToolCode": () => (/* binding */ InputToolCode),
/* harmony export */   "Key": () => (/* binding */ Key),
/* harmony export */   "KeyboardLayouts": () => (/* binding */ KeyboardLayouts),
/* harmony export */   "MessageKey": () => (/* binding */ MessageKey),
/* harmony export */   "MessageType": () => (/* binding */ MessageType),
/* harmony export */   "Modifier": () => (/* binding */ Modifier),
/* harmony export */   "PinyinStateID": () => (/* binding */ PinyinStateID),
/* harmony export */   "PredictEngine": () => (/* binding */ PredictEngine),
/* harmony export */   "ShuangpinStateID": () => (/* binding */ ShuangpinStateID),
/* harmony export */   "StateID": () => (/* binding */ StateID),
/* harmony export */   "Status": () => (/* binding */ Status),
/* harmony export */   "TransID": () => (/* binding */ TransID)
/* harmony export */ });
var EventType;
(function (EventType) {
    EventType["KEYDOWN"] = "keydown";
    EventType["KEYUP"] = "keyup";
    EventType["COMMIT"] = "commit";
    EventType["MODELUPDATED"] = "update";
    EventType["CLOSING"] = "close";
    EventType["OPENING"] = "open";
    EventType["UPDATESTATE"] = "updatestate";
    EventType["IMERESPONSE"] = "get_ime_response";
})(EventType || (EventType = {}));
var Key;
(function (Key) {
    Key["UP"] = "Up";
    Key["DOWN"] = "Down";
    Key["PAGE_UP"] = "Page_up";
    Key["PAGE_DOWN"] = "Page_down";
    Key["SPACE"] = " ";
    Key["ENTER"] = "Enter";
    Key["BACKSPACE"] = "Backspace";
    Key["ESC"] = "Esc";
    Key["LEFT"] = "Left";
    Key["RIGHT"] = "Right";
    Key["INVALID"] = "\uFFFD";
})(Key || (Key = {}));
var Modifier;
(function (Modifier) {
    Modifier["SHIFT"] = "Shift";
    Modifier["CTRL"] = "Control";
    Modifier["ALT"] = "Alt";
})(Modifier || (Modifier = {}));
var KeyboardLayouts;
(function (KeyboardLayouts) {
    KeyboardLayouts["STANDARD"] = "Default";
    KeyboardLayouts["GINYIEH"] = "Gin Yieh";
    KeyboardLayouts["ETEN"] = "Eten";
    KeyboardLayouts["IBM"] = "IBM";
    KeyboardLayouts["HSU"] = "Hsu";
    KeyboardLayouts["ETEN26"] = "Eten 26";
})(KeyboardLayouts || (KeyboardLayouts = {}));
;
var Status;
(function (Status) {
    Status[Status["INIT"] = 0] = "INIT";
    Status[Status["FETCHING"] = 1] = "FETCHING";
    Status[Status["FETCHED"] = 2] = "FETCHED";
    Status[Status["SELECT"] = 3] = "SELECT";
})(Status || (Status = {}));
var StateID;
(function (StateID) {
    StateID["LANG"] = "lang";
    StateID["SBC"] = "sbc";
    StateID["PUNC"] = "punc";
    StateID["TRADITIONAL"] = "traditional";
    StateID["PREDICTOR"] = "predictor";
})(StateID || (StateID = {}));
var PinyinStateID;
(function (PinyinStateID) {
    PinyinStateID["VERTICAL"] = "enableVertical";
    PinyinStateID["PREDICT_ENGINE"] = "predictEngine";
})(PinyinStateID || (PinyinStateID = {}));
var ShuangpinStateID;
(function (ShuangpinStateID) {
    ShuangpinStateID["SOLUTION"] = "shuangpinSolution";
})(ShuangpinStateID || (ShuangpinStateID = {}));
var TransID;
(function (TransID) {
    TransID[TransID["BACK"] = 0] = "BACK";
    TransID[TransID["TEXT"] = 1] = "TEXT";
    TransID[TransID["INSTANT"] = 2] = "INSTANT";
})(TransID || (TransID = {}));
var MessageKey;
(function (MessageKey) {
    MessageKey["SOURCE"] = "source";
    MessageKey["HIGHLIGHT"] = "highlight";
    MessageKey["APPEND"] = "append";
    MessageKey["DELETE"] = "delete";
    MessageKey["REVERT"] = "revert";
    MessageKey["CLEAR"] = "clear";
    MessageKey["IME"] = "ime";
    MessageKey["SELECT_HIGHLIGHT"] = "select_highlight";
    MessageKey["SELECT"] = "select";
    MessageKey["COMMIT"] = "commit";
    MessageKey["MULTI"] = "multi";
    MessageKey["FUZZY_PAIRS"] = "fuzzy_pairs";
    MessageKey["USER_DICT"] = "user_dict";
    MessageKey["COMMIT_MARK"] = "|";
})(MessageKey || (MessageKey = {}));
var InputToolCode;
(function (InputToolCode) {
    InputToolCode["WASM_PINYIN"] = "zh-wasm-pinyin";
    InputToolCode["WASM_SHUANGPIN"] = "zh-wasm-shuangpin";
    InputToolCode["JS_PINYIN"] = "zh-js-pinyin";
    InputToolCode["JS_SHUANGPIN"] = "zh-js-shuangpin";
})(InputToolCode || (InputToolCode = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["UPDATE_STATE"] = 1] = "UPDATE_STATE";
    MessageType[MessageType["INSTALLED"] = 2] = "INSTALLED";
    MessageType[MessageType["DECODE"] = 3] = "DECODE";
    MessageType[MessageType["IMERESPONSE"] = 4] = "IMERESPONSE";
    MessageType[MessageType["ADD_USER_COMMITS"] = 5] = "ADD_USER_COMMITS";
    MessageType[MessageType["ENABLE_USER_DICT"] = 6] = "ENABLE_USER_DICT";
    MessageType["GET_STATES"] = "get_states";
    MessageType["GET_CONFIG"] = "get_config";
    MessageType["IME_REFRESH"] = "refresh";
    MessageType["CLEAR"] = "clear";
    MessageType["VISIBILITY"] = "visibility";
    MessageType["TOGGLE_LANGUAGE_STATE"] = "lang_state";
})(MessageType || (MessageType = {}));
var Decoders;
(function (Decoders) {
    Decoders[Decoders["WASM"] = 0] = "WASM";
    Decoders[Decoders["JS"] = 1] = "JS";
    Decoders[Decoders["ONLINE"] = 2] = "ONLINE";
})(Decoders || (Decoders = {}));
var PredictEngine;
(function (PredictEngine) {
    PredictEngine[PredictEngine["BAIDU"] = 0] = "BAIDU";
    PredictEngine[PredictEngine["GOOGLE"] = 1] = "GOOGLE";
    PredictEngine[PredictEngine["GOOGLE_CN"] = 2] = "GOOGLE_CN";
})(PredictEngine || (PredictEngine = {}));
var GlobalState;
(function (GlobalState) {
    GlobalState["remoteExtId"] = "connectExtId";
})(GlobalState || (GlobalState = {}));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/entries/ime-ui.ts ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var src_api_imelifecycle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/api/imelifecycle */ "./src/api/imelifecycle.ts");
/* harmony import */ var src_api_eventdispatcher__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/api/eventdispatcher */ "./src/api/eventdispatcher.ts");
/* harmony import */ var src_api_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/api/runtime */ "./src/api/runtime.ts");
/* harmony import */ var src_api_setglobalconfig__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/api/setglobalconfig */ "./src/api/setglobalconfig.ts");
/* harmony import */ var src_api_decoder__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/api/decoder */ "./src/api/decoder.ts");





class IMEUIManager {
    constructor(globalState) {
        this.globalState = globalState;
        this.runtimeManager = new src_api_runtime__WEBPACK_IMPORTED_MODULE_0__.UIRuntimeManager();
        this.imeLifecycleManager = new src_api_imelifecycle__WEBPACK_IMPORTED_MODULE_1__.IMELifecycle();
        this.imeEventDispatcher = new src_api_eventdispatcher__WEBPACK_IMPORTED_MODULE_2__.IMEEventDispatcher(this.imeLifecycleManager);
        this.imeLifecycleManager.eventDispatcher = this.imeEventDispatcher;
    }
    async initialize() {
        this.runtimeManager.registerListeners();
        this.imeLifecycleManager.registerListeners();
        this.registerConnection();
    }
    registerUserInputEvent() {
    }
    registerConnection() {
        if (this.globalState && 'decoders' in this.globalState) {
            this.globalState.decoders.forEach((item) => {
                let itemManager = new src_api_decoder__WEBPACK_IMPORTED_MODULE_3__.DecoderItemManager(item[0], item[1]);
                this.imeEventDispatcher.add(itemManager);
            });
        }
    }
}
async function main() {
    let globalState = await src_api_setglobalconfig__WEBPACK_IMPORTED_MODULE_4__.imeConfig.getGlobalState();
    let uiManager = new IMEUIManager(globalState);
    await uiManager.initialize();
}
main();

})();

/******/ })()
;
//# sourceMappingURL=background.js.map