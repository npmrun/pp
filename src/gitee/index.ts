import { Data, Config } from "@/data";
import chalk from "chalk";
import ini from "ini";
import fetch, { Request } from "node-fetch";
import qs from "qs";
import ora from "ora";
import config from "@/config";
import {dateTimeFormat, readFileCreateTime, readFileModifyTime, syncWriteFile, writeIniFile} from "@/util";

export async function onLogin(token: string) {
  const res = await (
    await fetch("https://gitee.com/api/v5/user?access_token=" + token)
  ).json();
  if (res.message) {
    console.log(res.message);
    console.log(chalk.red("无效私人令牌"));
    return
  }
  Config.getInstance().setGitee({
    token,
  });
  console.log(chalk.green(`有效私人令牌，欢迎您: ${res.name}(${res.login})`));
}

export function onLogOut() {
  Config.getInstance().reomveGitee();
  console.log(chalk.green("已清除gitee"));
}

export async function Whoami() {
  let giteeConfig = Config.getInstance().getGitee();
  let token = giteeConfig.token;
  if (token) {
    console.log(chalk.green("gitee token: ") + chalk.greenBright(token));
    const res = await (
      await fetch("https://gitee.com/api/v5/user?access_token=" + token)
    ).json();
    if (res.message) {
      console.log(res.message);
      console.log(chalk.red("私人令牌已失效"));
      return
    }
    console.log(chalk.green(`有效私人令牌，欢迎您: ${res.name}(${res.login})`));
  } else {
    console.log(chalk.green("您尚未保存gitee token"));
  }
}

export async function sync(opts: {
  force: boolean;
  delete: boolean;
  show: boolean;
  pull: boolean;
}) {
  let giteeConfig = Config.getInstance().getGitee();
  let token = giteeConfig.token;
  if(!token){
    console.log(chalk.green("您尚未保存gitee token"));
    return
  }
  let params = qs.stringify({
    access_token: token,
  });
  const requestInfo = new Request("https://gitee.com/api/v5/gists?" + params, {
    method: "GET",
  });
  let spinner = ora("数据同步中，请稍后...").start();
  const gistList = await (await fetch(requestInfo)).json();
  spinner.clear();
  spinner.stop();
  let ppConfig = null;
  let ppId = "";
  gistList.forEach((gist: any) => {
    if (
      gist.description === "pp" &&
      gist.files &&
      gist.files.templates &&
      gist.files.templates.content
    ) {
      ppId = gist.id;
      let file = JSON.parse(decodeURIComponent(gist.files.templates.content));
      ppConfig = file;
    }
  });
  let localTime = readFileModifyTime(config.listPath);
  let localCreateTime = readFileCreateTime(config.listPath);
  let isJustCreate = localTime === localCreateTime;
  if (opts.show) {
    if (ppConfig) {
      console.log(`创建时间: ` + dateTimeFormat(ppConfig["create_time"],"yyyy-MM-dd HH:mm:ss"));
      console.log(`数据如下: `);
      console.log(ppConfig["data"]?ppConfig["data"]:"暂无数据，请同步");
    } else {
      console.log("远端暂无配置文件");
    }
    return;
  }
  if (opts.delete) {
    if (ppId) {
      await DELETE(ppId);
      console.log(chalk.green("删除成功"));
    } else {
      console.log(chalk.green("远端未找到配置文件"));
    }
    return;
  }
  if (opts.force) {
    let data = ini.stringify(Data.getInstance().getData());
    await POST(
      ppId,
      encodeURIComponent(
        JSON.stringify({
          create_time: localTime,
          data: data,
        })
      )
    );
    console.log(chalk.green("数据强制同步成功"));
    return;
  }
  if (opts.pull || isJustCreate) {
    if (ppConfig && ppConfig["create_time"]) {
      let data = ppConfig["data"];
      syncWriteFile(config.listPath, data);
      console.log(chalk.green("拉取成功"));
    } else {
      console.log(chalk.green("远端未找到配置文件"));
    }
    return;
  }
  if (ppConfig && ppConfig["create_time"]) {
    // 存在配置文件，比较之后决定
    let createTime = ppConfig["create_time"];
    let data = ppConfig["data"];
    if (localTime > createTime) {
      syncFile(ppId, localTime);
    } else if (localTime < createTime) {
      syncWriteFile(config.listPath, data);
      console.log(chalk.green("本地数据同步成功"));
    } else {
      console.log(chalk.green("配置文件数据一致"));
    }
  } else {
    syncFile(ppId, localTime);
  }
}

async function syncFile(ppId: any, localTime: any) {
  let data = ini.stringify(Data.getInstance().getData());
  let res = await (
    await POST(
      ppId,
      encodeURIComponent(
        JSON.stringify({
          create_time: localTime,
          data: data,
        })
      )
    )
  ).json();
  if (res.message) {
    console.log(res.message);
  } else {
    console.log(chalk.green("数据同步成功"));
  }
}

function DELETE(id: any) {
  let giteeConfig = Config.getInstance().getGitee();
  let token = giteeConfig.token;
  const requestInfo = new Request("https://gitee.com/api/v5/gists/" + id, {
    method: "DELETE",
    body: qs.stringify({
      access_token: token,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return fetch(requestInfo);
}

function POST(id: any, data: string) {
  let giteeConfig = Config.getInstance().getGitee();
  let token = giteeConfig.token;
  let url = "https://gitee.com/api/v5/gists";
  const requestInfo = new Request(id ? url + "/" + id : url, {
    method: id ? "PATCH": 'POST',
    body: qs.stringify({
      access_token: token,
      files: {
        templates: {
          content: data,
        },
      },
      description: "pp",
      public: false,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return fetch(requestInfo);
}
