import { Data,Config } from "./data"
import chalk from "chalk";
import path from "path";
import os from "os";
import uuid from "uuid";
import download from "download-git-repo";
import writefile, {isExist} from "@/writefile";
import fs from "fs-extra";

export * from "./gitee"

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
  const data = Data.getInstance().getData()
  const keys = Object.keys(data)
  if (!data || !keys.length) {
    console.log("暂无模板列表，请自行体添加");
    return;
  }
  keys.forEach((key) => {
    const value = data[key]
    if (opt?.all) {
      console.log(
        key + (value.desc ? `(${value.desc})` : "") + `: ${value.url}`
      );
    } else {
      console.log(key + (value.desc ? `(${value.desc})` : ""));
    }
  });
}

export function onCopy(templateDir: string, opts: { targetDir: string }){
  if(!isExist(templateDir)){
    console.log(
      chalk.red("请提供模板目录")
    );
    return;
  }
  if (isExist(opts.targetDir)) {
    console.log(
      chalk.red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹")
    );
    return;
  }
  writefile(templateDir, opts.targetDir);
}

export function onClone(name: string, opts: { dir: string }) {
  const item = Data.getInstance().findOne(name)
  if (!item) {
    console.log("请先添加项目");
    return;
  }
  let tempPath = path.join(os.tmpdir(), "pp-" + uuid.v4());
  let to = opts.dir;
  let git_url = "direct:" + item.url;
  if (isExist(to)) {
    console.log(
      chalk.red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹")
    );
    return;
  }
  download(git_url, tempPath, { clone: true }, function (err: Error) {
    if (err) throw err;
    console.log("临时文件夹为:" + tempPath);
    writefile(tempPath, to, { name: "哈哈" });
    fs.removeSync(tempPath);
    console.log(chalk.green("已清除临时文件夹"));
    console.log(chalk.green("克隆成功"));
    console.log(`\ncd ${to} && npm install\n`);
  });
}

export function onRemove(name: string) {
  const status = Data.getInstance().remove(name)
  if (status) {
    console.log(chalk.green("删除成功"));
  } else {
    console.error(chalk.red("不存在该模板"));
  }
}

export function onAdd(url: string, opt: { name: string; desc?: string }) {
  const http = /^(http|https)\:\/\//g;
  const git = /(git|root)\@/g;
  if (!git.test(url) && !http.test(url)) {
    console.error(chalk.red("请添加正确的Git仓库地址"));
    return;
  }
  Data.getInstance().addUrl({...opt, url: url});
  console.log(chalk.green("添加成功"));
}

export function onCheck() {
  console.log(JSON.stringify(Data.getInstance().getData()));
}
