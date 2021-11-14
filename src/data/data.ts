/**
 * 确保配置文件存在
 */
import fs from "fs-extra";
import config from "@/config";
import {readIniFile, writeIniFile} from "@/util";

const dataPath = config.listPath

/**
 * 读取配置
 */
let Lists = readIniFile(dataPath);

export default class Data {
  private static instance:Data;
  static getInstance():Data{
    if(!Data.instance) {
      Data.instance = new Data()
    }
    return Data.instance
  }

  getData(){
    if(!Lists){
      Lists = {}
    }
    return Lists
  }

  sync(){
    writeIniFile(dataPath, Lists);
  }

  remove(name: string){
    let data = this.getData()
    if(data[name]){
      delete data[name]
      this.sync()
      return true
    }
    return false
  }

  findOne(name: string){
    let data = this.getData()
    return data[name]
  }

  addUrl(opts: { url: string, name: string, desc?:string, force?: boolean}){
    let data = this.getData()
    if(!data[opts.name]){
      let _data: { url: string, name?: string, desc?:string, force?: boolean} = Object.assign({}, opts)
      delete _data.name
      data[opts.name] = _data
    }
    this.sync()
  }
}
