import ini, {EncodeOptions } from "ini"
import fs from "fs-extra"

export function readFile(path:string, encoding: BufferEncoding="utf-8") {
  return fs.readFileSync(path, encoding)
}
export function readIniFile(path:string, encoding: BufferEncoding="utf-8") {
  return ini.parse(fs.readFileSync(path, encoding))
}

export function writeIniFile(path:string, data: Object) {
  fs.writeFileSync(path, ini.stringify(data))
}