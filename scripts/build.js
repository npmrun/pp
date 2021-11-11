const execa = require("execa");
const fs = require("fs-extra");
const chalk = require('chalk');
const dts = require("dts-bundle");
const pkg = require("../package.json");

(async function () {
  console.log(chalk.red("正在清理dist文件夹"));
  await fs.remove(`dist`);
  console.log(chalk.red("清理完成，开始构建"));
  await execa("rollup", ["-c", "--environment", `NODE_ENV:production`], {
    stdio: "inherit",
  });
  console.log(chalk.red("构建完成，开始生成d.ts"));
  const dtsOptions = {
    name: pkg.name,
    main: `dist/src/index.d.ts`,
    out: `../index.d.ts`,
  };
  dts.bundle(dtsOptions);
  console.log(chalk.red("生成完毕，开始清理残余"));
  await fs.remove(`dist/src`);
  console.log('所有文件清理完成');
})();
