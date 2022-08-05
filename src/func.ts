import { Data,Config } from "./data"
import chalk from "chalk";
import path from "path";
import os from "os";
import uuid from "uuid";
import download from "download-git-repo";
import writefile, {isExist} from "@/writefile";
import fs from "fs-extra";
import ini from "ini";
import Table from "cli-table3"
import inquirer from 'inquirer';
import { isPromise } from "util/types";

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
export function onList(opt?: { all?: boolean, tag:string, table?: boolean }) {
  const data = Data.getInstance().getData()
  const keys = Object.keys(data)
  if (!data || !keys.length) {
    console.log("暂无模板列表，请自行体添加");
    return;
  }
  const table = new Table({ head: opt?.all?["name", "描述", "标签", "分支", "远程"]:["name", "描述", "标签", "分支"] });
  const msgs: string[] = []
  keys.forEach((key) => {
    const value = data[key]
    if(opt?.tag){
      if(!value.tag){
        return
      }
      let tagList = opt.tag.split(',')
      let tags = value.tag.split(',')
      let filterTags = tagList.filter(v=>tags.includes(v))
      if (!filterTags.length) {
        // console.log("暂无此标签的模板");
        return
      }
    }
    if (opt?.all) {
      table.push(
          { [key]: [value.desc, value.tag, value.branch, value.url] }
      );
      msgs.push(
        key + (value.desc ? `(${value.desc})` : "") + (value.tag ? `[${value.tag}]` : "") + (value.branch ? `{${value.branch}}` : "") + `: ${value.url}`
      );
    } else {
      table.push(
          { [key]: [value.desc, value.tag, value.branch] }
      );
      msgs.push(key + (value.desc ? `(${value.desc})` : "") + (value.tag ? `[${value.tag}]` : "") + (value.branch ? `{${value.branch}}` : ""));
    }
  });
  if(opt?.table){
    console.log(table.toString())
  }else{
    console.log(msgs.join('\n'))
  }
}

async function checkAsk(templateDir: string, vars: object) {
    let result = {}
    const askPath = path.resolve(templateDir, "./pp.ask.js")
    if(fs.pathExistsSync(askPath)){
        const data = require(askPath)(inquirer);
        let answers = {}
        if(!data){
            throw 'pp.ask.js的输出不符合格式'
        }
        if(isPromise(data)){
            answers = await data
        }else{
            answers = await inquirer.prompt(data)
        }
        result = Object.assign(result, vars, answers)
    }
    return result
}

export async function onAsk(templateDir: string){
    const vars = await checkAsk(templateDir, {})
    console.log(
        chalk.red("Ask变量如下：")
    );
    console.log(vars);
}

export async function onCopy(templateDir: string, opts: { targetDir: string, p:string }){
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
  let vars = {}
  if(opts.p){
    try{
      opts.p.split(',').forEach((v:string)=>{
        let temp = v.split(":")
        if (temp[0]!=undefined&&temp[1]!=undefined){
          // @ts-ignore
          vars[temp[0]] = temp[1]
        }
      })
    }catch (e) {
      console.log(
        chalk.red("您存储的变量解析出错了，请先检查")
      );
    }
  }
  vars = await checkAsk(templateDir, vars)
  writefile(templateDir, opts.targetDir, vars);
}

export function onClone(name: string, target: string, cc: { ignore?:boolean }) {
  const item = Data.getInstance().findOne(name)
  if (!item) {
    console.log(`请先添加该项目`);
    return;
  }
  let tempPath = path.join(os.tmpdir(), "pp-" + uuid.v4());
  let to = target;
  let git_url = "direct:" + item.url;
  if (isExist(to)) {
    console.log(
      chalk.red("安全起见，不覆写已存在的目录，请先删除相同目录文件夹")
    );
    return;
  }
  let opts = {}
  if(item.p){
    try{
      item.p.split(',').forEach((v:string)=>{
        let temp = v.split(":")
        if (temp[0]!=undefined&&temp[1]!=undefined){
          // @ts-ignore
          opts[temp[0]] = temp[1]
        }
      })
    }catch (e) {
      console.log(
        chalk.red("您存储的变量解析出错了，请先检查")
      );
    }
  }
  const branch = item.branch;
  download(branch?git_url+'#'+branch:git_url, tempPath, { clone: true }, async function (err: Error) {
    if (err) throw err;
    console.log("临时文件夹为:" + tempPath);
    //TODO 测试加命令行交互功能
    opts = await checkAsk(tempPath, opts)
    writefile(tempPath, to, opts, false, !cc.ignore);
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
  console.log(chalk.red("删除后请记得同步内容"));
}

export function onModify(name: string, opt: { desc?: string, url?:string,tag?:string,p?:string,branch?: string }) {
  const http = /^(http|https)\:\/\//g;
  const git = /(git|root)\@/g;
  if (opt.url&&!git.test(opt.url) && !http.test(opt.url)) {
    console.error(chalk.red("请添加正确的Git仓库地址"));
    return;
  }
  Data.getInstance().modifyUrl(name, opt);
  console.log(chalk.green("修改成功"));
  console.log(chalk.red("修改后请记得同步内容"));
}

export function onAdd(url: string, name: string, opt: { desc?: string,tag?:string,var?:string,branch?: string }) {
  const http = /^(http|https)\:\/\//g;
  const git = /(git|root)\@/g;
  if (!git.test(url) && !http.test(url)) {
    console.error(chalk.red("请添加正确的Git仓库地址"));
    return;
  }
  if(Data.getInstance().findOne(name)){
    console.error(chalk.red("已存在的name,请更换一个"));
    return
  }
  Data.getInstance().addUrl({...opt, url: url, name: name});
  console.log(chalk.green("添加成功"));
  console.log(chalk.red("添加后请记得同步内容"));
}

export function onCheck() {
  console.log(ini.stringify(Data.getInstance().getData()));
}
