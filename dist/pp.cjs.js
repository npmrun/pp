#!/usr/bin/env node
'use strict';

var commander = require('commander');
var tslib = require('tslib');
var fs = require('fs-extra');
var chalk = require('chalk');
var uuid = require('uuid');
var path = require('path');
var os = require('os');
var download = require('download-git-repo');
var ejs = require('ejs');
var ini = require('ini');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var uuid__default = /*#__PURE__*/_interopDefaultLegacy(uuid);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var download__default = /*#__PURE__*/_interopDefaultLegacy(download);
var ejs__default = /*#__PURE__*/_interopDefaultLegacy(ejs);
var ini__default = /*#__PURE__*/_interopDefaultLegacy(ini);

var config = {
    dir: path__default["default"].join(os__default["default"].homedir(), '.pp'),
    configPath: path__default["default"].join(os__default["default"].homedir(), '.pp', '.pprc')
};

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
    var result = false;
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
    walkDir(fromDir, function (file) {
        var fromRes = path__default["default"].resolve(fromDir, file);
        var toRes = path__default["default"].resolve(toDir, file);
        fs__default["default"].ensureFileSync(toRes);
        var originRoot = fs__default["default"].readFileSync(fromRes, {
            encoding: "utf8",
        });
        var html = ejs__default["default"].render(originRoot, opts);
        fs__default["default"].writeFileSync(toRes, html);
    });
}

function readFile(path, encoding) {
    if (encoding === void 0) { encoding = "utf-8"; }
    return fs__default["default"].readFileSync(path, encoding);
}
function readIniFile(path, encoding) {
    if (encoding === void 0) { encoding = "utf-8"; }
    return ini__default["default"].parse(fs__default["default"].readFileSync(path, encoding));
}
function writeIniFile(path, data) {
    fs__default["default"].writeFileSync(path, ini__default["default"].stringify(data));
}

try {
    fs__default["default"].ensureDirSync(config.dir);
    fs__default["default"].ensureFileSync(config.configPath);
}
catch (e) {
    throw e;
}
var Opts = readIniFile(config.configPath);
function onLogin(token) {
    var result = Object.assign({}, Opts);
    if (!result.token)
        result.token = {};
    result.token.gitee = token;
    writeIniFile(config.configPath, result);
    console.log(chalk__default["default"].green("已保存gitee的私人令牌"));
}
function Whoami() {
    console.log(chalk__default["default"].green("gitee token: ") + chalk__default["default"].greenBright(Opts.token.gitee));
}
function onList(opt) {
    if (!Opts.list || !Object.keys(Opts.list).length) {
        console.log("暂无模板列表，请自行体添加");
        return;
    }
    Object.keys(Opts.list).forEach(function (key) {
        var value = Opts.list[key];
        if (opt === null || opt === void 0 ? void 0 : opt.all) {
            console.log(value.name + (value.desc ? "(" + value.desc + ")" : "") + (": " + value.url));
        }
        else {
            console.log(value.name + (value.desc ? "(" + value.desc + ")" : ""));
        }
    });
}
function onClone(target, opts) {
    if (!Opts.list || !Opts.list[target]) {
        console.log("请先添加项目");
        return;
    }
    var data = Opts.list[target];
    var tempPath = path__default["default"].join(os__default["default"].tmpdir(), "pp-" + uuid__default["default"].v4());
    var to = opts.dir;
    var git_url = "direct:" + data.url;
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
    var result = Object.assign({}, Opts);
    if (result.list && result.list[name]) {
        delete result.list[name];
        writeIniFile(config.configPath, result);
        console.log(chalk__default["default"].green("删除成功"));
    }
    else {
        console.error(chalk__default["default"].red("不存在该模板"));
    }
}
function onAdd(url, opt) {
    var result = Object.assign({}, Opts);
    var http = /^(http|https)\:\/\//g;
    var git = /(git|root)\@/g;
    if (!git.test(url) && !http.test(url)) {
        console.error(chalk__default["default"].red("请添加正确的Git仓库地址"));
        return;
    }
    if (!result.list)
        result.list = {};
    if (result.list[opt.name]) {
        console.error(chalk__default["default"].red("名字重复,当前存在："));
        onList();
        return;
    }
    result.list[opt.name] = tslib.__assign(tslib.__assign({}, opt), { url: url });
    writeIniFile(config.configPath, result);
    console.log(chalk__default["default"].green("添加成功"));
}
function onCheck() {
    console.log(readFile(config.configPath));
}

var program = new commander.Command();
program.version("0.0.1", "-v, --version").description("查看当前版本号");
program.helpOption("-h --help", "显示帮助信息");
program.showHelpAfterError("( pp -h 查看帮助信息)");
program.command("login <token>").description("本地保存Gitee的私人令牌").action(onLogin);
program.command("whoami").description("查看私人令牌").action(Whoami);
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
    .command("rm <name>")
    .description("删除一个模板仓库")
    .action(onRemove);
program.command("clone <name>").requiredOption("-d --dir <target>", "目标路径").description("克隆模板仓库").action(onClone);
program.parse(process.argv);
//# sourceMappingURL=pp.cjs.js.map
