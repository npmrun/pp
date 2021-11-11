const execa = require("execa");
const chalk = require('chalk');

console.log(chalk.red("开始监听,格式:umd"));
execa("rollup", ["-wc", "--environment", `NODE_ENV:development,TARGET:cjs`], {
  stdio: "inherit",
});
