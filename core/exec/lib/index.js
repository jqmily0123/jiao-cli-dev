"use strict";
const path = require("path");
const childProcess = require("child_process");
const Package = require("@jiao-cli-dev/package");
const log = require("@jiao-cli-dev/log");
const SETTINGS = {
  init: "@imooc-cli/init",
};
const CACHE_DIR = "dependencies";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "1.0.1";
  let storeDir = "";
  let pkg = "";
  //如果没有传targetPath 就给tagetPath一个默认值 在这里就是 jiaodashi/node_modules 缓存路径是空路径

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    log.verbose("targetPath", targetPath);
    log.verbose("storeDir", storeDir);
    pkg = new Package({
      storeDir,
      targetPath,
      packageName,
      packageVersion,
    });

    if (await pkg.exists()) {
      // 更新pkg
      // console.log("更新package");
      await pkg.update();
    } else {
      //安装pkg
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  //获取入口文件的路径
  const rootFile = pkg.getRootFilePath();
  //以下的逻辑就是开启子进程执行init方法
  //如果命令行没有传targetPath targetPath就会自动生成 pkg的install 方法会自动下载到生成的targetPath里面
  if (rootFile) {
    const args = Array.from(arguments);
    const cmd = args[args.length - 1];
    const o = Object.create(null);
    Object.keys(cmd).forEach((key) => {
      if (cmd.hasOwnProperty(key) && !key.startsWith("_") && key !== "parent") {
        o[key] = cmd[key];
      }
    });
    args[args.length - 1] = o;
    const code = `require('${rootFile}').init.call(null,${JSON.stringify(
      args
    )})`;
    try {
      const child = childProcess.spawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令执行成功", e);
        process.exit(e);
      });
      // child.stdio.on("data", (chunk) => {});
      // child.stderr.on("data", (chunk) => {});
    } catch (e) {
      log.error(e.message);
    }
  }
}
module.exports = exec;
