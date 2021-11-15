
import config from "@/config";
import {readIniFile, writeIniFile} from "@/util";

const configPath = config.configPath

/**
 * 读取配置
 */
let configData = readIniFile(configPath);

export  default  class Config {
  private static instance:Config;
  static  getInstance():Config{
    if(!Config.instance){
      Config.instance = new Config()
    }
    return Config.instance
  }
  getData(){
    if(!configData){
      configData = {}
    }
    return configData
  }
  sync(){
    writeIniFile(configPath, configData);
  }

  setGitee(data: any){
    let config = this.getData()
    config.gitee = data;
    this.sync()
  }
  reomveGitee(){
    let config = this.getData()
    delete config.gitee
    this.sync()
  }
  getGitee(){
    let config = this.getData()
    if(!config.gitee) config.gitee = {}
    return config.gitee
  }
}
