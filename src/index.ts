import { Command } from "commander";
import * as func from "./func";
// import os from "os"

// console.log(os.tmpdir());

const program = new Command();
program.version("0.0.1", "-v, --version").description("查看当前版本号");
program.helpOption("-h --help", "显示帮助信息");
program.showHelpAfterError("( pp -h 查看帮助信息)");


//Todo
program.command("login <token>").description("本地保存Gitee的私人令牌").action(func.onLogin);
program.command("whoami").description("查看私人令牌").action(func.Whoami); 
 
program.command("list").option('-a --all').description("查看所有模板列表").action(func.onList);

program.command("check").description("查看配置文件").action(func.onCheck);

program
  .command("add <url>")
  .requiredOption("-n --name <name>", "模板名字")
  .option("-d --desc <desc>", "模板具体描述")
  .option("-t --tag <tag>", "模板标签")
  .description("添加一个模板仓库")
  .action(func.onAdd);

program
  .command("rm <name>")
  .description("删除一个模板仓库")
  .action(func.onRemove);

program.command("clone <name>").requiredOption("-d --dir <target>", "目标路径").description("克隆模板仓库").action(func.onClone);

program.parse(process.argv);
