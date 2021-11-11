import fs from "fs-extra";
import ejs from "ejs";
import chalk from "chalk";
import path from "path";
import execa from "execa";

function walkDir (dir: string, cb?: (file: string)=>void) {
  function _walk (_dir = '.') {
    const statInfo = fs.statSync(dir + path.sep + _dir)
    if (statInfo.isDirectory()) {
      const paths = fs.readdirSync(path.resolve(dir + path.sep + _dir))
      for (let i = 0; i < paths.length; i++) {
        _walk(_dir + path.sep + paths[i])
      }
    } else if (statInfo.isFile()) {
      cb && cb(_dir)
    }
    return true
  }
  return _walk()
}

export function isExist (file: string) {
  let result = false
  try {
    fs.accessSync(file, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
    result = true // 文件可读写
  } catch (err) {
    result = false
  }
  return result
}

export default function writefile (fromDir: string, toDir: string, opts = {}, force = false) {
  if (!fromDir) {
    console.log(chalk.red("缺少模板目录"))
    return
  }
  if (!toDir) {
    console.log(chalk.red("缺少目标目录"))
    return
  }
  if (isExist(toDir) && !force) {
    console.log(chalk.red("安全起见，不覆写已存在的目录"))
    return
  }
  walkDir(fromDir, function (file) {
    let fromRes = path.resolve(fromDir, file)
    let toRes = path.resolve(toDir, file)
    fs.ensureFileSync(toRes)
    const originRoot = fs.readFileSync(fromRes, {
      encoding: "utf8",
    });
    const html = ejs.render(originRoot, opts);
    fs.writeFileSync(toRes, html);
  })
}
