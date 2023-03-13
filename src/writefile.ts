import fs from "fs-extra";
import ejs from "ejs";
import chalk from "chalk";
import path from "path";
import {writeErrorFile} from "@/util";

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
  let result: boolean
  try {
    fs.accessSync(file, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
    result = true // 文件可读写
  } catch (err) {
    result = false
  }
  return result
}

const exclude = ['.png','.jpg','.jpeg','.zip','.rar','.webp']

export default function writefile (fromDir: string, toDir: string, opts = {}, force = false, isEjs = true) {
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
  const errorFile:any[] = []
  const errors: any[] = []
  walkDir(fromDir, function (file) {
    let fromRes = path.resolve(fromDir, file)
    let toRes = path.resolve(toDir, file)
    fs.ensureFileSync(toRes)
    const originRoot = fs.readFileSync(fromRes, {
      encoding: "utf8",
    });
    try{
      let ext = path.parse(fromRes).ext
      if(exclude.includes(ext) || !isEjs){
        fs.copyFileSync(fromRes, toRes)
      }else {
        if (Object.keys(opts).length) {
          try {
            const html = ejs.render(originRoot, opts);
            fs.writeFileSync(toRes, html);
          } catch (error) {
            // 赋值失败后原样复制
            fs.writeFileSync(toRes, originRoot);
          }
        }else {
          fs.writeFileSync(toRes, originRoot);
        }
      }
    }catch (e) {
      errorFile.push(toRes)
      errors.push(e)
      // throw e
    }
  })
  console.log(
    chalk.green("写入完成")
  );
  if(errorFile.length){
    console.log(chalk.red('以下文件写入失败:'))
    let errorInfo = '错误如下：\n\n'
    errorFile.forEach((errFile, index)=>{
      console.log(chalk.red(errFile))
      errorInfo+="========================="+'\n'
      errorInfo+=errFile+'\n\n'
      errorInfo+=errors[index].toString()+'\n'
      errorInfo+="========================="+'\n'
    })
    let errorPath = path.resolve(toDir, "./.pp.error.log")
    writeErrorFile(errorInfo, errorPath)
    console.log(
      chalk.red("详情请查看: "+errorPath)
    );
  }
}
