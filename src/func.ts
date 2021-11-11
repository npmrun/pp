import fs from "fs-extra";
import chalk from "chalk";
import uuid from "uuid";
import path from "path";
import os from "os";
//https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#readable-named-exports
//不想用pure esm, 采用ora的5.4.1版本
// import ora from "ora";
// import * as inquirer from "inquirer";
import config from "@/config";
import download from "download-git-repo";
import writefile, {isExist} from "./writefile";
import {readFile, readIniFile, writeIniFile} from "./util";

/**
 * 确保配置文件存在
 */
try {
  fs.ensureDirSync(config.dir);
  fs.ensureFileSync(config.configPath);
} catch (e) {
  throw e;
}
/**
 * 读取配置
 */
const Opts = readIniFile(config.configPath);

// export function onLogin() {
//   const promptList = [{
//     type: 'input',
//     message: '请输入用户名:',
//     name: 'username',
//   }, {
//     type: "password",
//     message: '请输入密码(至少6位):',
//     name: 'password',
//     validate: function (val: string) {
//       if (val.length>=6) { // 校验位数
//         return true;
//       }
//       return "请输入至少6位密码";
//     }
//   }];
//   inquirer.prompt(promptList).then(answers => {
//     console.log(answers); // 返回的结果
//     let spinner = ora('登录中...').start();
//     setTimeout(()=>{
//       spinner.stop()
//     }, 2000)
//   })
// }

/**
 * 显示保存的列表
 * @param opt 参数: all:是否显示Git地址
 */
export function onList(opt?: { all?: boolean }) {
  if (!Opts.list || !Object.keys(Opts.list).length) {
    console.log("暂无模板列表，请自行体添加");
    return;
  }
  Object.keys(Opts.list).forEach((key) => {
    let value = Opts.list[key];
    if (opt?.all) {
      console.log(
        value.name + (value.desc ? `(${value.desc})` : "") + `: ${value.url}`
      );
    } else {
      console.log(value.name + (value.desc ? `(${value.desc})` : ""));
    }
  });
}

export function onClone(target: string, opts: { dir: string }) {
  if (!Opts.list || !Opts.list[target]) {
    console.log("请先添加项目");
    return;
  }
  let data = Opts.list[target];
  let tempPath = path.join(os.tmpdir(), "pp-" + uuid.v4());
  let to = opts.dir;
  let git_url = "direct:" + data.url;
  if (isExist(to)) {
    console.log(
      chalk.red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹")
    );
    return;
  }
  download(git_url, tempPath, {clone: true}, function (err: Error) {
    if (err) throw err;
    console.log("临时文件夹为:" + tempPath)
    writefile(tempPath, to, {name: "哈哈"});
    fs.removeSync(tempPath);
    console.log(chalk.green("已清除临时文件夹"));
    console.log(chalk.green("克隆成功"));
    console.log(`\ncd ${to} && npm install\n`);
  });
}

export function onRemove(name: string) {
  let result = Object.assign({}, Opts);
  if (result.list && result.list[name]) {
    delete result.list[name];
    writeIniFile(config.configPath, result);
    console.log(chalk.green("删除成功"));
  } else {
    console.error(chalk.red("不存在该模板"));
  }
}

export function onAdd(url: string, opt: { name: string; desc?: string }) {
  const result = Object.assign({}, Opts);
  const http = /^(http|https)\:\/\//g;
  const git = /(git|root)\@/g;
  if (!git.test(url) && !http.test(url)) {
    console.error(chalk.red("请添加正确的Git仓库地址"));
    return;
  }
  if (!result.list) result.list = {};
  if (result.list[opt.name]) {
    console.error(chalk.red("名字重复,当前存在："));
    onList();
    return;
  }
  result.list[opt.name] = {...opt, url};
  writeIniFile(config.configPath, result);
  console.log(chalk.green("添加成功"));
}

export function onCheck() {
  console.log(readFile(config.configPath));
}
