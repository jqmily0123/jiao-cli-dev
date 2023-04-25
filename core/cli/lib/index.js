"use strict";

module.exports = core;
const path = require("path");
const pkg = require("../package.json");
const log = require("@jiao-cli-dev/log");

const colors = require("colors/safe");
const userHome = require("user-home");
const commander = require("commander");
// const pathExists = require("path-exists");
const init = require("@jiao-cli-dev/init");
const exec = require("@jiao-cli-dev/exec");
async function core() {
  prepare();
  registerCommand();
}
async function prepare() {
  checkPkgVersion();
  checkRoot();
  // checkUserHome();
  checkInputArgs();
  checkEnv();
  await checkGlobalUpdate();
}
//注册脚手架
const program = new commander.Command();
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d,--debug", "是否开启调试模式", false)
    .option("-tp --targetPath <targetPath>", "是否指定本地调试文件路径", "");
  program
    .command("init [projectName]")
    .option("-f,--force", "是否强制初始化项目")
    .action(exec);
  // program;
  //   .command("publish")
  //   .option("--refreshServer", "强制更新远程Git仓库")
  //   .option("--refreshToken", "强制更新远程仓库token")
  //   .option("--refreshOwner", "强制更新远程仓库类型");
  // .action(exec);
  program.on("option:debug", function () {
    if (program.debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose("verbose");
  });
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = program.targetPath;
  });
  program.on("command:*", function (obj) {
    const awailableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red("未知的命令" + obj[0]));
    if (awailableCommands.length > 0) {
      console.log(colors.red("可用的命令:" + awailableCommands.join(",")));
    }
  });
  program.parse(program.argv);
  // console.log(program.args);
  if (program.args && program.length < 1) {
    program.outputHelp();
    console.log();
  }
  // if (process.argv.length < 3) {
  //   program.outputHelp();
  // } else {
  //   program.parse(program.argv);
  // }
}

//检查脚手架是否需要更新
async function checkGlobalUpdate() {
  // 1.获取当前版本号
  const currentVersion = pkg.version;
  const pkgName = pkg.name;
  const { getNpmSemverVersions } = require("@jiao-cli-dev/get-npm-info");
  const lastVersion = await getNpmSemverVersions(currentVersion, pkgName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        `请手动更新${pkgName}当前的版本${currentVersion},最新版本${lastVersion} 更新命令：npm install -g ${pkgName}`
      )
    );
  }
}
function checkEnv() {
  //dotenv这个包的主要作用就是将外部声明变量给加载进 process.env 这个变量里面
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  dotenv.config({
    path: dotenvPath,
  });

  createDefaultConfig();
}
function createDefaultConfig() {
  const cliConfig = {
    // home: userHome,
  };

  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, process.env.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
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

//检查脚手架的版本
function checkPkgVersion() {
  log.info("cli", pkg.version);
}
