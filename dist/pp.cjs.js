#!/usr/bin/env node
'use strict';

var commander = require('commander');
var tslib = require('tslib');
var path = require('path');
var os = require('os');
var fs = require('fs-extra');
var ini = require('ini');
var chalk = require('chalk');
var uuid = require('uuid');
var download = require('download-git-repo');
var ejs = require('ejs');
var Table = require('cli-table3');
var inquirer = require('inquirer');
var types = require('util/types');
var fetch = require('node-fetch');
var qs = require('qs');
var ora = require('ora');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var ini__default = /*#__PURE__*/_interopDefaultLegacy(ini);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var uuid__default = /*#__PURE__*/_interopDefaultLegacy(uuid);
var download__default = /*#__PURE__*/_interopDefaultLegacy(download);
var ejs__default = /*#__PURE__*/_interopDefaultLegacy(ejs);
var Table__default = /*#__PURE__*/_interopDefaultLegacy(Table);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var qs__default = /*#__PURE__*/_interopDefaultLegacy(qs);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);

var config = {
    dir: path__default["default"].join(os__default["default"].homedir(), '.pp'),
    configPath: path__default["default"].join(os__default["default"].homedir(), '.pp', '.pprc'),
    listPath: path__default["default"].join(os__default["default"].homedir(), '.pp', '.listrc')
};

try {
    fs__default["default"].ensureDirSync(config.dir);
    fs__default["default"].ensureFileSync(config.configPath);
    fs__default["default"].ensureFileSync(config.listPath);
}
catch (e) {
    throw e;
}

function readFileModifyTime(path) {
    var stat = fs__default["default"].statSync(path);
    return stat.mtimeMs;
}
function readFileCreateTime(path) {
    var stat = fs__default["default"].statSync(path);
    return stat.birthtimeMs;
}
function writeErrorFile(content, path) {
    if (path === void 0) { path = "pp.error.log"; }
    if (typeof content == 'string')
        syncWriteFile(path, content);
    if (typeof content == "object" && content.toString)
        syncWriteFile(path, content.toString());
    if (typeof content == "object" && content.toLocaleString)
        syncWriteFile(path, content.toLocaleString());
}
function syncWriteFile(path, content, encoding) {
    if (encoding === void 0) { encoding = "utf-8"; }
    return fs__default["default"].writeFileSync(path, content, encoding);
}
function readIniFile(path, encoding) {
    if (encoding === void 0) { encoding = "utf-8"; }
    return ini__default["default"].parse(fs__default["default"].readFileSync(path, encoding));
}
function writeIniFile(path, data) {
    fs__default["default"].writeFileSync(path, ini__default["default"].stringify(data));
}
function dateTimeFormat(date, fmt) {
    if (fmt === void 0) { fmt = 'yyyy-MM-dd HH:mm:ss'; }
    if (!date) {
        return '';
    }
    if (typeof date === 'string') {
        date = date.replace('T', ' ').replace('Z', '');
        date = new Date(date.replace(/-/g, '/'));
    }
    if (typeof date === 'number') {
        date = new Date(date);
    }
    var o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        'S': date.getMilliseconds()
    };
    var week = {
        '0': '\u65e5',
        '1': '\u4e00',
        '2': '\u4e8c',
        '3': '\u4e09',
        '4': '\u56db',
        '5': '\u4e94',
        '6': '\u516d'
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + '']);
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
}

var dataPath = config.listPath;
var Lists = readIniFile(dataPath);
var Data = (function () {
    function Data() {
    }
    Data.getInstance = function () {
        if (!Data.instance) {
            Data.instance = new Data();
        }
        return Data.instance;
    };
    Data.prototype.getData = function () {
        if (!Lists) {
            Lists = {};
        }
        return Lists;
    };
    Data.prototype.sync = function () {
        writeIniFile(dataPath, Lists);
    };
    Data.prototype.remove = function (name) {
        var data = this.getData();
        if (data[name]) {
            delete data[name];
            this.sync();
            return true;
        }
        return false;
    };
    Data.prototype.findOne = function (name) {
        var data = this.getData();
        return data[name];
    };
    Data.prototype.modifyUrl = function (name, opts) {
        var data = this.findOne(name);
        Object.keys(opts).forEach(function (v) {
            if (opts[v] != undefined) {
                data[v] = opts[v];
            }
        });
        this.sync();
    };
    Data.prototype.addUrl = function (opts) {
        var data = this.getData();
        if (!data[opts.name]) {
            var _data = Object.assign({}, opts);
            delete _data.name;
            data[opts.name] = _data;
        }
        this.sync();
    };
    return Data;
}());

var configPath = config.configPath;
var configData = readIniFile(configPath);
var Config = (function () {
    function Config() {
    }
    Config.getInstance = function () {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    };
    Config.prototype.getData = function () {
        if (!configData) {
            configData = {};
        }
        return configData;
    };
    Config.prototype.sync = function () {
        writeIniFile(configPath, configData);
    };
    Config.prototype.setGitee = function (data) {
        var config = this.getData();
        config.gitee = data;
        this.sync();
    };
    Config.prototype.reomveGitee = function () {
        var config = this.getData();
        delete config.gitee;
        this.sync();
    };
    Config.prototype.getGitee = function () {
        var config = this.getData();
        if (!config.gitee)
            config.gitee = {};
        return config.gitee;
    };
    return Config;
}());

function walkDir(dir, cb) {
    function _walk(_dir) {
        if (_dir === void 0) { _dir = '.'; }
        var statInfo = fs__default["default"].statSync(dir + path__default["default"].sep + _dir);
        if (statInfo.isDirectory()) {
            var paths = fs__default["default"].readdirSync(path__default["default"].resolve(dir + path__default["default"].sep + _dir));
            for (var i = 0; i < paths.length; i++) {
                _walk(_dir + path__default["default"].sep + paths[i]);
            }
        }
        else if (statInfo.isFile()) {
            cb && cb(_dir);
        }
        return true;
    }
    return _walk();
}
function isExist(file) {
    var result;
    try {
        fs__default["default"].accessSync(file, fs__default["default"].constants.F_OK | fs__default["default"].constants.R_OK | fs__default["default"].constants.W_OK);
        result = true;
    }
    catch (err) {
        result = false;
    }
    return result;
}
var exclude = ['.png', '.jpg', '.jpeg', '.zip', '.rar', '.webp'];
function writefile(fromDir, toDir, opts, force, isEjs) {
    if (opts === void 0) { opts = {}; }
    if (force === void 0) { force = false; }
    if (isEjs === void 0) { isEjs = true; }
    if (!fromDir) {
        console.log(chalk__default["default"].red("缺少模板目录"));
        return;
    }
    if (!toDir) {
        console.log(chalk__default["default"].red("缺少目标目录"));
        return;
    }
    if (isExist(toDir) && !force) {
        console.log(chalk__default["default"].red("安全起见，不覆写已存在的目录"));
        return;
    }
    var errorFile = [];
    var errors = [];
    walkDir(fromDir, function (file) {
        var fromRes = path__default["default"].resolve(fromDir, file);
        var toRes = path__default["default"].resolve(toDir, file);
        fs__default["default"].ensureFileSync(toRes);
        var originRoot = fs__default["default"].readFileSync(fromRes, {
            encoding: "utf8",
        });
        try {
            var ext = path__default["default"].parse(fromRes).ext;
            if (exclude.includes(ext) || !isEjs) {
                fs__default["default"].copyFileSync(fromRes, toRes);
            }
            else {
                if (Object.keys(opts).length) {
                    var html = ejs__default["default"].render(originRoot, opts);
                    fs__default["default"].writeFileSync(toRes, html);
                }
                else {
                    fs__default["default"].writeFileSync(toRes, originRoot);
                }
            }
        }
        catch (e) {
            errorFile.push(toRes);
            errors.push(e);
        }
    });
    console.log(chalk__default["default"].green("写入完成"));
    if (errorFile.length) {
        console.log(chalk__default["default"].red('以下文件写入失败:'));
        var errorInfo_1 = '错误如下：\n\n';
        errorFile.forEach(function (errFile, index) {
            console.log(chalk__default["default"].red(errFile));
            errorInfo_1 += "=========================" + '\n';
            errorInfo_1 += errFile + '\n\n';
            errorInfo_1 += errors[index].toString() + '\n';
            errorInfo_1 += "=========================" + '\n';
        });
        var errorPath = path__default["default"].resolve(toDir, "./.pp.error.log");
        writeErrorFile(errorInfo_1, errorPath);
        console.log(chalk__default["default"].red("详情请查看: " + errorPath));
    }
}

function onLogin(token) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var res;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, fetch__default["default"]("https://gitee.com/api/v5/user?access_token=" + token)];
                case 1: return [4, (_a.sent()).json()];
                case 2:
                    res = _a.sent();
                    if (res.message) {
                        console.log(res.message);
                        console.log(chalk__default["default"].red("无效私人令牌"));
                        return [2];
                    }
                    Config.getInstance().setGitee({
                        token: token,
                    });
                    console.log(chalk__default["default"].green("\u6709\u6548\u79C1\u4EBA\u4EE4\u724C\uFF0C\u6B22\u8FCE\u60A8: ".concat(res.name, "(").concat(res.login, ")")));
                    return [2];
            }
        });
    });
}
function onLogOut() {
    Config.getInstance().reomveGitee();
    console.log(chalk__default["default"].green("已清除gitee"));
}
function Whoami() {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var giteeConfig, token, res;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    giteeConfig = Config.getInstance().getGitee();
                    token = giteeConfig.token;
                    if (!token) return [3, 3];
                    console.log(chalk__default["default"].green("gitee token: ") + chalk__default["default"].greenBright(token));
                    return [4, fetch__default["default"]("https://gitee.com/api/v5/user?access_token=" + token)];
                case 1: return [4, (_a.sent()).json()];
                case 2:
                    res = _a.sent();
                    if (res.message) {
                        console.log(res.message);
                        console.log(chalk__default["default"].red("私人令牌已失效"));
                        return [2];
                    }
                    console.log(chalk__default["default"].green("\u6709\u6548\u79C1\u4EBA\u4EE4\u724C\uFF0C\u6B22\u8FCE\u60A8: ".concat(res.name, "(").concat(res.login, ")")));
                    return [3, 4];
                case 3:
                    console.log(chalk__default["default"].green("您尚未保存gitee token"));
                    _a.label = 4;
                case 4: return [2];
            }
        });
    });
}
function sync(opts) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var giteeConfig, token, params, requestInfo, spinner, gistList, ppConfig, ppId, localTime, localCreateTime, isJustCreate, data, data, createTime, data;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    giteeConfig = Config.getInstance().getGitee();
                    token = giteeConfig.token;
                    if (!token) {
                        console.log(chalk__default["default"].green("您尚未保存gitee token"));
                        return [2];
                    }
                    params = qs__default["default"].stringify({
                        access_token: token,
                    });
                    requestInfo = new fetch.Request("https://gitee.com/api/v5/gists?" + params, {
                        method: "GET",
                    });
                    spinner = ora__default["default"]("数据同步中，请稍后...").start();
                    return [4, fetch__default["default"](requestInfo)];
                case 1: return [4, (_a.sent()).json()];
                case 2:
                    gistList = _a.sent();
                    spinner.clear();
                    spinner.stop();
                    ppConfig = null;
                    ppId = "";
                    gistList.forEach(function (gist) {
                        if (gist.description === "pp" &&
                            gist.files &&
                            gist.files.templates &&
                            gist.files.templates.content) {
                            ppId = gist.id;
                            var file = JSON.parse(decodeURIComponent(gist.files.templates.content));
                            ppConfig = file;
                        }
                    });
                    localTime = readFileModifyTime(config.listPath);
                    localCreateTime = readFileCreateTime(config.listPath);
                    isJustCreate = localTime === localCreateTime;
                    if (opts.show) {
                        if (ppConfig) {
                            console.log("\u521B\u5EFA\u65F6\u95F4: " + dateTimeFormat(ppConfig["create_time"], "yyyy-MM-dd HH:mm:ss"));
                            console.log("\u6570\u636E\u5982\u4E0B: ");
                            console.log(ppConfig["data"] ? ppConfig["data"] : "暂无数据，请同步");
                        }
                        else {
                            console.log("远端暂无配置文件");
                        }
                        return [2];
                    }
                    if (!opts.delete) return [3, 6];
                    if (!ppId) return [3, 4];
                    return [4, DELETE(ppId)];
                case 3:
                    _a.sent();
                    console.log(chalk__default["default"].green("删除成功"));
                    return [3, 5];
                case 4:
                    console.log(chalk__default["default"].green("远端未找到配置文件"));
                    _a.label = 5;
                case 5: return [2];
                case 6:
                    if (!opts.force) return [3, 8];
                    data = ini__default["default"].stringify(Data.getInstance().getData());
                    return [4, POST(ppId, encodeURIComponent(JSON.stringify({
                            create_time: localTime,
                            data: data,
                        })))];
                case 7:
                    _a.sent();
                    console.log(chalk__default["default"].green("数据强制同步成功"));
                    return [2];
                case 8:
                    if (opts.pull || isJustCreate) {
                        if (ppConfig && ppConfig["create_time"]) {
                            data = ppConfig["data"];
                            syncWriteFile(config.listPath, data);
                            console.log(chalk__default["default"].green("拉取成功"));
                        }
                        else {
                            console.log(chalk__default["default"].green("远端未找到配置文件"));
                        }
                        return [2];
                    }
                    if (ppConfig && ppConfig["create_time"]) {
                        createTime = ppConfig["create_time"];
                        data = ppConfig["data"];
                        if (localTime > createTime) {
                            syncFile(ppId, localTime);
                        }
                        else if (localTime < createTime) {
                            syncWriteFile(config.listPath, data);
                            console.log(chalk__default["default"].green("本地数据同步成功"));
                        }
                        else {
                            console.log(chalk__default["default"].green("配置文件数据一致"));
                        }
                    }
                    else {
                        syncFile(ppId, localTime);
                    }
                    return [2];
            }
        });
    });
}
function syncFile(ppId, localTime) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var data, res;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = ini__default["default"].stringify(Data.getInstance().getData());
                    return [4, POST(ppId, encodeURIComponent(JSON.stringify({
                            create_time: localTime,
                            data: data,
                        })))];
                case 1: return [4, (_a.sent()).json()];
                case 2:
                    res = _a.sent();
                    if (res.message) {
                        console.log(res.message);
                    }
                    else {
                        console.log(chalk__default["default"].green("数据同步成功"));
                    }
                    return [2];
            }
        });
    });
}
function DELETE(id) {
    var giteeConfig = Config.getInstance().getGitee();
    var token = giteeConfig.token;
    var requestInfo = new fetch.Request("https://gitee.com/api/v5/gists/" + id, {
        method: "DELETE",
        body: qs__default["default"].stringify({
            access_token: token,
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    return fetch__default["default"](requestInfo);
}
function POST(id, data) {
    var giteeConfig = Config.getInstance().getGitee();
    var token = giteeConfig.token;
    var url = "https://gitee.com/api/v5/gists";
    var requestInfo = new fetch.Request(id ? url + "/" + id : url, {
        method: id ? "PATCH" : 'POST',
        body: qs__default["default"].stringify({
            access_token: token,
            files: {
                templates: {
                    content: data,
                },
            },
            description: "pp",
            public: false,
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    return fetch__default["default"](requestInfo);
}

function onList(opt) {
    var data = Data.getInstance().getData();
    var keys = Object.keys(data);
    if (!data || !keys.length) {
        console.log("暂无模板列表，请自行体添加");
        return;
    }
    var table = new Table__default["default"]({ head: (opt === null || opt === void 0 ? void 0 : opt.all) ? ["name", "描述", "标签", "分支", "远程"] : ["name", "描述", "标签", "分支"] });
    var msgs = [];
    keys.forEach(function (key) {
        var _a, _b;
        var value = data[key];
        if (opt === null || opt === void 0 ? void 0 : opt.tag) {
            if (!value.tag) {
                return;
            }
            var tagList = opt.tag.split(',');
            var tags_1 = value.tag.split(',');
            var filterTags = tagList.filter(function (v) { return tags_1.includes(v); });
            if (!filterTags.length) {
                return;
            }
        }
        if (opt === null || opt === void 0 ? void 0 : opt.all) {
            table.push((_a = {}, _a[key] = [value.desc, value.tag, value.branch, value.url], _a));
            msgs.push(key + (value.desc ? "(".concat(value.desc, ")") : "") + (value.tag ? "[".concat(value.tag, "]") : "") + (value.branch ? "{".concat(value.branch, "}") : "") + ": ".concat(value.url));
        }
        else {
            table.push((_b = {}, _b[key] = [value.desc, value.tag, value.branch], _b));
            msgs.push(key + (value.desc ? "(".concat(value.desc, ")") : "") + (value.tag ? "[".concat(value.tag, "]") : "") + (value.branch ? "{".concat(value.branch, "}") : ""));
        }
    });
    if (opt === null || opt === void 0 ? void 0 : opt.table) {
        console.log(table.toString());
    }
    else {
        console.log(msgs.join('\n'));
    }
}
function checkAsk(templateDir, vars) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var result, askPath, data, answers;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = {};
                    askPath = path__default["default"].resolve(templateDir, "./pp.ask.js");
                    if (!fs__default["default"].pathExistsSync(askPath)) return [3, 5];
                    data = require(askPath)(inquirer__default["default"]);
                    answers = {};
                    if (!data) {
                        throw 'pp.ask.js的输出不符合格式';
                    }
                    if (!types.isPromise(data)) return [3, 2];
                    return [4, data];
                case 1:
                    answers = _a.sent();
                    return [3, 4];
                case 2: return [4, inquirer__default["default"].prompt(data)];
                case 3:
                    answers = _a.sent();
                    _a.label = 4;
                case 4:
                    result = Object.assign(result, vars, answers);
                    _a.label = 5;
                case 5: return [2, result];
            }
        });
    });
}
function onAsk(templateDir) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var vars;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, checkAsk(templateDir, {})];
                case 1:
                    vars = _a.sent();
                    console.log(chalk__default["default"].red("Ask变量如下："));
                    console.log(vars);
                    return [2];
            }
        });
    });
}
function onCopy(templateDir, opts) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var vars;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isExist(templateDir)) {
                        console.log(chalk__default["default"].red("请提供模板目录"));
                        return [2];
                    }
                    if (isExist(opts.targetDir)) {
                        console.log(chalk__default["default"].red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹"));
                        return [2];
                    }
                    vars = {};
                    if (opts.p) {
                        try {
                            opts.p.split(',').forEach(function (v) {
                                var temp = v.split(":");
                                if (temp[0] != undefined && temp[1] != undefined) {
                                    vars[temp[0]] = temp[1];
                                }
                            });
                        }
                        catch (e) {
                            console.log(chalk__default["default"].red("您存储的变量解析出错了，请先检查"));
                        }
                    }
                    return [4, checkAsk(templateDir, vars)];
                case 1:
                    vars = _a.sent();
                    writefile(templateDir, opts.targetDir, vars);
                    return [2];
            }
        });
    });
}
function onClone(name, target, cc) {
    var item = Data.getInstance().findOne(name);
    if (!item) {
        console.log("\u8BF7\u5148\u6DFB\u52A0\u8BE5\u9879\u76EE");
        return;
    }
    var tempPath = path__default["default"].join(os__default["default"].tmpdir(), "pp-" + uuid__default["default"].v4());
    var to = target;
    var git_url = "direct:" + item.url;
    if (isExist(to)) {
        console.log(chalk__default["default"].red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹"));
        return;
    }
    var opts = {};
    if (item.p) {
        try {
            item.p.split(',').forEach(function (v) {
                var temp = v.split(":");
                if (temp[0] != undefined && temp[1] != undefined) {
                    opts[temp[0]] = temp[1];
                }
            });
        }
        catch (e) {
            console.log(chalk__default["default"].red("您存储的变量解析出错了，请先检查"));
        }
    }
    var branch = item.branch;
    download__default["default"](branch ? git_url + '#' + branch : git_url, tempPath, { clone: true }, function (err) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            var error_1;
            return tslib.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err)
                            throw err;
                        console.log("临时文件夹为:" + tempPath);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, checkAsk(tempPath, opts)];
                    case 2:
                        opts = _a.sent();
                        writefile(tempPath, to, opts, false, !cc.ignore);
                        fs__default["default"].removeSync(tempPath);
                        console.log(chalk__default["default"].green("已清除临时文件夹"));
                        console.log(chalk__default["default"].green("克隆成功"));
                        console.log("\ncd ".concat(to, " && npm install\n"));
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error(error_1);
                        fs__default["default"].removeSync(tempPath);
                        console.log(chalk__default["default"].green("已清除临时文件夹"));
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    });
}
function onRemove(name) {
    var status = Data.getInstance().remove(name);
    if (status) {
        console.log(chalk__default["default"].green("删除成功"));
    }
    else {
        console.error(chalk__default["default"].red("不存在该模板"));
    }
    console.log(chalk__default["default"].red("删除后请记得同步内容"));
}
function onModify(name, opt) {
    var http = /^(http|https)\:\/\//g;
    var git = /(git|root)\@/g;
    if (opt.url && !git.test(opt.url) && !http.test(opt.url)) {
        console.error(chalk__default["default"].red("请添加正确的Git仓库地址"));
        return;
    }
    Data.getInstance().modifyUrl(name, opt);
    console.log(chalk__default["default"].green("修改成功"));
    console.log(chalk__default["default"].red("修改后请记得同步内容"));
}
function onAdd(url, name, opt) {
    var http = /^(http|https)\:\/\//g;
    var git = /(git|root)\@/g;
    if (!git.test(url) && !http.test(url)) {
        console.error(chalk__default["default"].red("请添加正确的Git仓库地址"));
        return;
    }
    if (Data.getInstance().findOne(name)) {
        console.error(chalk__default["default"].red("已存在的name,请更换一个"));
        return;
    }
    Data.getInstance().addUrl(tslib.__assign(tslib.__assign({}, opt), { url: url, name: name }));
    console.log(chalk__default["default"].green("添加成功"));
    console.log(chalk__default["default"].red("添加后请记得同步内容"));
}
function onCheck() {
    console.log(ini__default["default"].stringify(Data.getInstance().getData()));
}

var program = new commander.Command();
program.version("0.0.17", "-v, --version").description("查看当前版本号");
program.helpOption("-h --help", "显示帮助信息");
program.showHelpAfterError("( pp -h 查看帮助信息)");
program.command("login <token>").description("本地保存Gitee的私人令牌").action(onLogin);
program.command("whoami").description("查看私人令牌").action(Whoami);
program.command("logout").description("删除私人令牌").action(onLogOut);
program.command("sync").option('-f --force', "强制同步").option('-d --delete', "删除远端").option('-s --show', "查看远端").option('-p --pull', "强制拉取远端").description("同步模板列表").action(sync);
program.command("list").alias('ls').option('-a --all').option('--table').option('-t --tag <tag>', "标签筛选").description("查看所有模板列表").action(onList);
program.command("check").description("查看配置文件").action(onCheck);
program
    .command("add <url> <name>")
    .option("-d --desc <desc>", "模板具体描述")
    .option("-t --tag <tag>", "模板标签")
    .option("-v --var <var>", "模板变量")
    .option("-b --branch <branch>", "仓库分支")
    .description("添加一个模板仓库")
    .action(onAdd);
program
    .command("m <name>")
    .option("-d --desc <desc>", "模板具体描述")
    .option("-t --tag <tag>", "模板标签")
    .option("-u --url <url>", "仓库地址")
    .option("-p --p <p>", "模板变量")
    .option("-b --branch <branch>", "仓库分支")
    .description("修改模板仓库")
    .action(onModify);
program
    .command("remove <name>")
    .description("删除一个模板仓库")
    .action(onRemove);
program.command("clone <name> <target>").option("-i --ignore", "是否不需要模板变量").description("克隆模板仓库").action(onClone);
program.command("copy <templateDir>")
    .requiredOption("-d --targetDir <targetDir>", "目标路径")
    .option("-p --p <p>", "模板变量")
    .description("简单文件夹克隆").action(onCopy);
program.command("ask <templateDir>")
    .description("测试ask规则").action(onAsk);
program.parse(process.argv);
//# sourceMappingURL=pp.cjs.js.map
