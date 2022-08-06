# @noderun/pp

### 安装
```bash
npm i @noderun/pp -g
```
### 帮助
```bash
pp -h

Options:
  -v, --version                 output the version number
  -h --help                     显示帮助信息

Commands:
  login <token>                 本地保存Gitee的私人令牌
  whoami                        查看私人令牌
  logout                        删除私人令牌
  sync [options]                同步模板列表
  list [options]                查看所有模板列表
  check                         查看配置文件
  add [options] <url> <name>    添加一个模板仓库
  remove <name>                 删除一个模板仓库
  clone <name> <target>         克隆模板仓库
  copy [options] <templateDir>  简单文件夹克隆
  ask <templateDir>             命令行交互测试
  help [command]                display help for command
```
### 同步
* 在gitee创建私人令牌，权限包括gist的操作
* 复制token,执行`pp sync`同步到gist
> 注意操作gist的是description的pp的，请注意跟你的gist不要重复
> `pp sync`需要手动执行

命令行管理模板项目

* [x] 增删查模板列表
* [x] 克隆项目到本地
* [x] 克隆时ejs模板变量渲染
* [x] 代码整理
* [x] 同步功能
* [x] 可展示表格`pp list --table`
* [x] 增加`inquirer`自定义项目变量（beta）
* [x] 命令行交互
* [x] 本地模板命令行交互测试

TODO

* [ ] 代码整理
* [ ] 远端同步可能造成的数据丢失
