"use strict";
const log = require("@jiao-cli-dev/log");
const Command = require("@jiao-cli-dev/command");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const fs = require("fs");
const localPath = process.cwd();
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      // console.log("exec的业务逻辑");
      // 1.准备阶段
      // console.log();
      await this.prepare();
      // 2.下载模板
      // 3.安装模板
    } catch (error) {
      log.error(error.message);
    }
  }
  async prepare() {
    // 1.判断当前目录是否为空
    if (!this.ifCwdIsEmpty()) {
      const { ifContinue } = await inquirer.prompt({
        type: "confirm",
        name: "ifContinue",
        default: false,
        message: "当前项目不为空，是否继续创建项目",
      });
      console.log(ifContinue);
      // 2.启动强制创建
      if (ifContinue) {
        // 清空当前目录
        fse.emptyDirSync(localPath);
      }
    }

    // 3选择创建项目或者组件
    // 4.获取项目基本信息
  }
  ifCwdIsEmpty() {
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(
      (file) => file.startsWith(".") && ["node_modules"].indexOf(file) < 0
    );
    return !fileList && fileList.length <= 0;
  }
}

function init(argv) {
  // console.log(projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}
module.exports = { init, Command };
