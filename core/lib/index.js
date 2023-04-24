"use strict";

module.exports = core;
const path = require("path");
const pkg = require("../package.json");
const log = require("@imooc-cli-dev/log");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
// const pathExists = require("path-exists");
const { LOW_NODE_VERSION } = require("./const");
async function core() {
  try {
    checkNodeVersion();
    checkPkgVersion();
    checkRoot();
    // checkUserHome();
    checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}
//检查脚手架是否需要更新
async function checkGlobalUpdate() {
  // 1.获取当前版本号
  const currentVersion = pkg.version;
  const pkgName = pkg.name;
  const { getNpmVersions } = require("@imooc-cli-dev/get-npm-info");
  const data = await getNpmVersions(pkgName);
  console.log(data);
}
function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  const config = dotenv.config({
    path: dotenvPath,
  });
  // log.info("环境变量", config);
}

function checkInputArgs() {
  const minimist = require("minimist");
  const args = minimist(process.argv.slice(2));
  checkArgs(args);
}
function checkArgs(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}
//这里有个问题 pathExists怎么都安装不了4.0.0版本
// function checkUserHome() {
//   if (!userHome || pathExists(userHome)) {
//     throw new Error(colors.red("当前用户主目录不存在"));
//   }
// }
//给用户降级
function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
}
// 检查node版本
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = LOW_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`jiao-cli需要安装 ${lowestVersion} 以上版本的node.js`)
    );
  }
}
//检查脚手架的版本
function checkPkgVersion() {
  log.info("cli", pkg.version);
}
