"use strict";
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const Command = require("@jiao-cli-dev/command");
const log = require("@jiao-cli-dev/log");
const Git = require("@jiao-cli-dev/git");
class PublishCommand extends Command {
  init() {
    //处理参数
    log.verbose("cli init argv", this._argv, this._cmd);
    this.options = {
      refleshService: this._cmd.refleshService,
      refleshToken: this._cmd.refleshToken,
    };
  }
  async exec() {
    try {
      const startTime = new Date().getTime();
      // 初始化检查
      this.prepare();
      //git Flow自动化
      const git = new Git(this.projectInfo, this.options);
      git.init();
      git.prepare();
      //云构建云发布
      const endTime = new Date().getTime();
      log.info("本次发布耗时:" + Math.floor(endTime - startTime) / 1000 + "s");
    } catch (error) {
      log.error(error.message);
      if (process.env.LOG_LEVEL === "verbose") {
        console.log(error);
      }
    }
  }
  prepare() {
    // 确认项目是否是npm项目
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, "package.json");
    log.verbose("packageJsonPath", pkgPath);
    if (!fs.existsSync(pkgPath)) {
      throw new Error("package.json 文件不存在");
    }
    //确认是否包含build命令
    const pkg = fse.readJsonSync(pkgPath);
    const { name, version, scripts } = pkg;
    log.verbose("package.json", name, version, scripts);
    if (!name || !version || !scripts || !scripts.build) {
      throw new Error(
        "package.json 信息不全，请检查是否存在name, version, scripts（需提供build命令）"
      );
    }
    this.projectInfo = {
      name,
      version,
      dir: projectPath,
    };
  }
}
function init(argv) {
  return new PublishCommand(argv);
}
module.exports = { init, PublishCommand };
