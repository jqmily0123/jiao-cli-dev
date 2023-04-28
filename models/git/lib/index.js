"use strict";
const SimpleGit = require("simple-git");
const path = require("path");
const fs = require("fs");
const userHome = require("user-home");
const fse = require("fs-extra");
const inquirer = require("inquirer");
const terminalLink = require("terminal-link");
const log = require("@jiao-cli-dev/log");
const { readFile, writeFile } = require("@jiao-cli-dev/utils");
const Gitee = require("./Gitee");
const Github = require("./Github");
const DEFAULT_HOME_PATH = ".jiao-cli-dev";
const GIT_SERVER_FILE = ".get_server";
const GIT_TOKEN_FILE = ".get_token";
const GIT_ROOT_DIR = ".git";
const GITHUB = "github";
const GITEE = "gitee";
const GIT_SERVICE_TYPE = [
  {
    name: "Github",
    value: GITHUB,
  },
  {
    name: "Gitee",
    value: GITEE,
  },
];
class Git {
  constructor(
    { name, version, dir },
    { refleshService = false, refleshToken = false }
  ) {
    this.name = name;
    this.version = version;
    this.dir = dir;
    this.user = null;
    this.orgs = null;
    this.git = SimpleGit(this.dir);
    this.gitService = null;
    this.homePath = null;
    this.refleshService = refleshService;
    this.refleshToken = refleshToken;
  }
  async prepare() {
    //检查缓存主目录
    this.checkHomePath();
    // 检查用户远程仓库类型
    await this.checkGitService();
    //获取远程仓库token
    await this.checkGitToken();
    //获取远程仓库和组织信息
    await this.getUserAndOrgs();
  }
  async getUserAndOrgs() {
    this.user = this.gitService.getUser();
  }
  async checkGitService() {
    const gitServerPath = this.createPath(GIT_SERVER_FILE);
    // console.log(gitServerPath);
    let gitService = readFile(gitServerPath);
    if (!gitService || this.refleshService) {
      gitService = (
        await inquirer.prompt({
          type: "list",
          message: "请选择您想要托管的平台",
          default: GITHUB,
          name: "gitService",
          choices: GIT_SERVICE_TYPE,
        })
      ).gitService;
      writeFile(gitServerPath, gitService);
      log.success("gitService写入成功", `${gitService} -> ${gitServerPath}`);
    } else {
      log.success("gitService获取成功", `${gitService}`);
    }
    this.gitService = this.createGitService(gitService);
    if (!this.gitService) {
      throw new Error("gitService初始化失败");
    }
  }
  createGitService(gitService) {
    console.log(gitService);
    if (gitService === GITHUB) {
      return new Github();
    } else if (gitService === GITEE) {
      return new Gitee();
    } else {
      return null;
    }
  }
  async checkGitToken() {
    const tokenPath = this.createPath(GIT_TOKEN_FILE);
    let token = readFile(tokenPath);
    if (!token || this.refleshToken) {
      log.warn(
        this.gitService.type +
          "token未生成 请先生成" +
          this.gitService.type +
          terminalLink("链接", this.gitService.getTokenHelpUrl())
      );
      token = (
        await inquirer.prompt({
          type: "password",
          message: "请将token复制到这里",
          default: "",
          name: "token",
        })
      ).token;
      writeFile(tokenPath, token);
      log.success("token 写入成功", `${token} -> ${tokenPath}`);
    } else {
      log.success("token获取成功", `${tokenPath}`);
    }
    this.token = token;
    this.gitService.setToken(token);
  }
  checkHomePath() {
    if (!this.homePath) {
      if (process.env.CLI_HOME_PATH) {
        this.homePath = process.env.CLI_HOME_PATH;
      } else {
        this.homePath = path.resolve(userHome, DEFAULT_HOME_PATH);
      }
      log.verbose("cli homePath", this.homePath);
      fse.ensureDirSync(this.homePath);
      if (!fs.existsSync(this.homePath)) {
        throw new Error("用户主目录获取失败");
      }
    }
  }
  createPath(file) {
    const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR);
    const filePath = path.resolve(rootDir, file);
    fse.ensureFileSync(filePath);
    return filePath;
  }
  init() {}
}
module.exports = Git;
