"use strict";
const path = require("path");
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
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    const args = Array.from(arguments);
    // console.log(args);
    console.log(require(rootFile));
    require(rootFile).apply(null, [2, 2, 3]);
  }
}
module.exports = exec;
