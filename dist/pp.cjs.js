#!/usr/bin/env node
'use strict';

var commander = require('commander');
var tslib = require('tslib');
var path = require('path');
var os = require('os');
var ini = require('ini');
var fs = require('fs-extra');
var chalk = require('chalk');
var uuid = require('uuid');
var download = require('download-git-repo');
var ejs = require('ejs');
var fetch = require('node-fetch');
var qs = require('qs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var ini__default = /*#__PURE__*/_interopDefaultLegacy(ini);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var uuid__default = /*#__PURE__*/_interopDefaultLegacy(uuid);
var download__default = /*#__PURE__*/_interopDefaultLegacy(download);
var ejs__default = /*#__PURE__*/_interopDefaultLegacy(ejs);
var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var qs__default = /*#__PURE__*/_interopDefaultLegacy(qs);

var config = {
    dir: path__default["default"].join(os__default["default"].homedir(), '.pp'),
    configPath: path__default["default"].join(os__default["default"].homedir(), '.pp', '.pprc'),
    listPath: path__default["default"].join(os__default["default"].homedir(), '.pp', '.listrc')
};

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
    Config.prototype.setGiteeToken = function (token) {
        var gitee = this.getGitee();
        gitee.token = token;
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

try {
    fs__default["default"].ensureDirSync(config.dir);
    fs__default["default"].ensureFileSync(config.configPath);
    fs__default["default"].ensureFileSync(config.listPath);
}
catch (e) {
    throw e;
}

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
function writefile(fromDir, toDir, opts, force) {
    if (opts === void 0) { opts = {}; }
    if (force === void 0) { force = false; }
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
            var html = ejs__default["default"].render(originRoot, opts);
            fs__default["default"].writeFileSync(toRes, html);
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
    Config.getInstance().setGiteeToken(token);
    console.log(chalk__default["default"].green("已保存gitee的私人令牌"));
}
function onLogOut() {
    Config.getInstance().reomveGitee();
    console.log(chalk__default["default"].green("已清除gitee"));
}
function Whoami() {
    var giteeConfig = Config.getInstance().getGitee();
    var token = giteeConfig.token;
    if (token) {
        console.log(chalk__default["default"].green("gitee token: ") + chalk__default["default"].greenBright(token));
    }
    else {
        console.log(chalk__default["default"].green("您尚未保存gitee token"));
    }
}
function sync() {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var giteeConfig, token, params, requestInfo, res;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    giteeConfig = Config.getInstance().getGitee();
                    token = giteeConfig.token;
                    params = qs__default["default"].stringify({
                        access_token: token
                    });
                    requestInfo = new fetch.Request('https://gitee.com/api/v5/gists?' + params, {
                        method: "GET"
                    });
                    return [4, fetch__default["default"](requestInfo)];
                case 1: return [4, (_a.sent()).json()];
                case 2:
                    res = _a.sent();
                    console.log(res);
                    return [2];
            }
        });
    });
}
function onList(opt) {
    var data = Data.getInstance().getData();
    var keys = Object.keys(data);
    if (!data || !keys.length) {
        console.log("暂无模板列表，请自行体添加");
        return;
    }
    keys.forEach(function (key) {
        var value = data[key];
        if (opt === null || opt === void 0 ? void 0 : opt.all) {
            console.log(key + (value.desc ? "(" + value.desc + ")" : "") + (": " + value.url));
        }
        else {
            console.log(key + (value.desc ? "(" + value.desc + ")" : ""));
        }
    });
}
function onCopy(templateDir, opts) {
    if (!isExist(templateDir)) {
        console.log(chalk__default["default"].red("请提供模板目录"));
        return;
    }
    if (isExist(opts.targetDir)) {
        console.log(chalk__default["default"].red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹"));
        return;
    }
    writefile(templateDir, opts.targetDir);
}
function onClone(name, opts) {
    var item = Data.getInstance().findOne(name);
    if (!item) {
        console.log("请先添加项目");
        return;
    }
    var tempPath = path__default["default"].join(os__default["default"].tmpdir(), "pp-" + uuid__default["default"].v4());
    var to = opts.dir;
    var git_url = "direct:" + item.url;
    if (isExist(to)) {
        console.log(chalk__default["default"].red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹"));
        return;
    }
    download__default["default"](git_url, tempPath, { clone: true }, function (err) {
        if (err)
            throw err;
        console.log("临时文件夹为:" + tempPath);
        writefile(tempPath, to, { name: "哈哈" });
        fs__default["default"].removeSync(tempPath);
        console.log(chalk__default["default"].green("已清除临时文件夹"));
        console.log(chalk__default["default"].green("克隆成功"));
        console.log("\ncd " + to + " && npm install\n");
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
}
function onAdd(url, opt) {
    var http = /^(http|https)\:\/\//g;
    var git = /(git|root)\@/g;
    if (!git.test(url) && !http.test(url)) {
        console.error(chalk__default["default"].red("请添加正确的Git仓库地址"));
        return;
    }
    Data.getInstance().addUrl(tslib.__assign(tslib.__assign({}, opt), { url: url }));
    console.log(chalk__default["default"].green("添加成功"));
}
function onCheck() {
    console.log(JSON.stringify(Data.getInstance().getData()));
}

var program = new commander.Command();
program.version("0.0.1", "-v, --version").description("查看当前版本号");
program.helpOption("-h --help", "显示帮助信息");
program.showHelpAfterError("( pp -h 查看帮助信息)");
program.command("login <token>").description("本地保存Gitee的私人令牌").action(onLogin);
program.command("whoami").description("查看私人令牌").action(Whoami);
program.command("logout").description("删除私人令牌").action(onLogOut);
program.command("sync").description("同步模板列表").action(sync);
program.command("list").option('-a --all').description("查看所有模板列表").action(onList);
program.command("check").description("查看配置文件").action(onCheck);
program
    .command("add <url>")
    .requiredOption("-n --name <name>", "模板名字")
    .option("-d --desc <desc>", "模板具体描述")
    .option("-t --tag <tag>", "模板标签")
    .description("添加一个模板仓库")
    .action(onAdd);
program
    .command("remove <name>")
    .description("删除一个模板仓库")
    .action(onRemove);
program.command("clone <name>").requiredOption("-d --dir <target>", "目标路径").description("克隆模板仓库").action(onClone);
program.command("copy <templateDir>").requiredOption("-d --targetDir <targetDir>", "目标路径").description("简单文件夹克隆").action(onCopy);
program.parse(process.argv);
//# sourceMappingURL=pp.cjs.js.map
