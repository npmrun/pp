import ini from "ini"
import fs from "fs-extra"

export function readFileModifyTime(path: string){
  var stat = fs.statSync(path);
  return stat.mtimeMs
}
export function readFileCreateTime(path: string){
  var stat = fs.statSync(path);
  return stat.birthtimeMs
}
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


export function dateTimeFormat(date: Date|number|string, fmt = 'yyyy-MM-dd HH:mm:ss') { //日期时间格式化
  if (!date) {
    return ''
  }
  if (typeof date === 'string') {
    date = date.replace('T', ' ').replace('Z', '');
    date = new Date(date.replace(/-/g, '/'))
  }
  if (typeof date === 'number') {
    date = new Date(date)
  }
  var o:Record<any, any> = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  }
  let week:Record<any, any> = {
    '0': '\u65e5',
    '1': '\u4e00',
    '2': '\u4e8c',
    '3': '\u4e09',
    '4': '\u56db',
    '5': '\u4e94',
    '6': '\u516d'
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + ''])
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt
}
