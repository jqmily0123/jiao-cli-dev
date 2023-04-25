"use strict";
const LOW_NODE_VERSION = "12.0.0";
const colors = require("colors/safe");
const semver = require("semver");
const log = require("@imooc-cli-dev/log");
class Command {
  constructor(argv) {
    console.log("command", argv);
    if (!argv) {
      throw new Error("参数不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("参数要是数组类型");
    }
    if (argv.length < 1) {
      throw new Error("参数列表为空");
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {
        this.checkNodeVersion();
      });
      chain.then(() => {
        this.initArgs();
      });
      chain.then(() => {
        this.init();
      });
      chain.then(() => {
        this.exec();
      });
      chain.catch((err) => {
        log.error(err);
      });
    });
  }
  // 初始化参数
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
    // console.log(this._cmd, this._argv);
  }
  // 检查node版本
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOW_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`jiao-cli需要安装 ${lowestVersion} 以上版本的node.js`)
      );
    }
  }
  init() {
    throw new Error("init 方法必须实现");
  }
  exec() {
    throw new Error("exec 方法必须实现");
  }
}
module.exports = Command;
