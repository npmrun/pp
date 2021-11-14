
import Data from "./data"
import Config from "./config"
/**
 * 确保配置文件存在
 */
import fs from "fs-extra";
import config from "@/config";

try {
  fs.ensureDirSync(config.dir);
  fs.ensureFileSync(config.configPath);
  fs.ensureFileSync(config.listPath);
} catch (e) {
  throw e;
}

export {
  Config,
  Data
}
