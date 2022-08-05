import { Command } from "commander";
import * as func from "./func";
// import os from "os"

// console.log(os.tmpdir());

const program = new Command();
program.version("0.0.17", "-v, --version").description("查看当前版本号");
program.helpOption("-h --help", "显示帮助信息");
program.showHelpAfterError("( pp -h 查看帮助信息)");


//Todo
program.command("login <token>").description("本地保存Gitee的私人令牌").action(func.onLogin);
program.command("whoami").description("查看私人令牌").action(func.Whoami);
program.command("logout").description("删除私人令牌").action(func.onLogOut);
program.command("sync").option('-f --force', "强制同步").option('-d --delete', "删除远端").option('-s --show', "查看远端").option('-p --pull', "强制拉取远端").description("同步模板列表").action(func.sync);

program.command("list").alias('ls').option('-a --all').option('--table').option('-t --tag <tag>', "标签筛选").description("查看所有模板列表").action(func.onList);

program.command("check").description("查看配置文件").action(func.onCheck);

program
  .command("add <url> <name>")
  .option("-d --desc <desc>", "模板具体描述")
  .option("-t --tag <tag>", "模板标签")
  .option("-v --var <var>", "模板变量")
  .option("-b --branch <branch>", "仓库分支")
  .description("添加一个模板仓库")
  .action(func.onAdd);
program
  .command("m <name>")
  .option("-d --desc <desc>", "模板具体描述")
  .option("-t --tag <tag>", "模板标签")
  .option("-u --url <url>", "仓库地址")
  .option("-p --p <p>", "模板变量")
  .option("-b --branch <branch>", "仓库分支")
  .description("修改模板仓库")
  .action(func.onModify);
program
  .command("remove <name>")
  .description("删除一个模板仓库")
  .action(func.onRemove);

program.command("clone <name> <target>").option("-i --ignore", "是否不需要模板变量").description("克隆模板仓库").action(func.onClone);
program.command("copy <templateDir>")
  .requiredOption("-d --targetDir <targetDir>", "目标路径")
  .option("-p --p <p>", "模板变量")
  .description("简单文件夹克隆").action(func.onCopy);

program.command("ask <templateDir>")
  .description("测试ask规则").action(func.onAsk);

program.parse(process.argv);
