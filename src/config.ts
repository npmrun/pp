import path from "path";
import os from "os";

export default {
  //数据目录
  dir: path.join(os.homedir(), '.pp'),
  configPath: path.join(os.homedir(), '.pp','.pprc'),
  listPath: path.join(os.homedir(), '.pp','.listrc')
}
