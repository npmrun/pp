// 全局替换
declare var __DEV__: boolean;

interface IItem{
  name: string; // 模板名称
  desc: string; // 具体干什么用的
  url: string; //Git仓库地址
}

type IOpts = {
  list?: [
    IItem
  ]
}


declare module "download-git-repo"{
  type download = (url: string, path: string, config: {clone: boolean}, cb: (err:Error)=>void)=>void
  const func: download;
  export default func;
}