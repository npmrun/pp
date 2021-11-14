import ini from "ini"
import fs from "fs-extra"

export function syncReadFile(path:string, encoding: BufferEncoding="utf-8") {
  return fs.readFileSync(path, encoding)
}

export function writeErrorFile(content: any, path:string = "pp.error.log"){
  if(typeof  content == 'string') syncWriteFile(path, content);
  if(typeof content == "object" && content.toString) syncWriteFile(path, content.toString());
  if(typeof content == "object" && content.toLocaleString) syncWriteFile(path, content.toLocaleString());
}

export function syncWriteFile(path:string, content: string, encoding: BufferEncoding="utf-8") {
  return fs.writeFileSync(path, content, encoding)
}
export function readIniFile(path:string, encoding: BufferEncoding="utf-8") {
  return ini.parse(fs.readFileSync(path, encoding))
}

export function writeIniFile(path:string, data: Object) {
  fs.writeFileSync(path, ini.stringify(data))
}
