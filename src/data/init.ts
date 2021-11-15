/**
 * 确保配置文件存在
 */
import config from "@/config";
import fs from "fs-extra";

try {
  fs.ensureDirSync(config.dir);
  fs.ensureFileSync(config.configPath);
  fs.ensureFileSync(config.listPath);
} catch (e) {
  throw e;
}

export default {};
