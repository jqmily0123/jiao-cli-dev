"use strict";
const log = require("@jiao-cli-dev/log");
const Command = require("@jiao-cli-dev/command");
const Package = require("@jiao-cli-dev/package");
const { spinnerStart, sleep, execAsync } = require("@jiao-cli-dev/utils");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const fs = require("fs");
const { valid } = require("semver");
const path = require("path");
const userHome = require("user-home");
const ejs = require("ejs");
const getProjectTemplate = require("./getProjectTemplate");
const { promises } = require("dns");
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";
const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";
const WHITE_COMMAND = ["npm", "cnpm"];
const localPath = process.cwd();
class InitCommand extends Command {
  //这里的init方法主要是用来解构出项目名称和 --force 属性值

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
      //这里就是 有两个作用一个是 判断是否强制清空目录 二是 返回用户输入的版本信息
      const projectInfo = await this.prepare();
      // 2.下载模板
      if (projectInfo) {
        log.verbose("projectInfo", projectInfo);
        this.projectInfo = projectInfo;
        await this.downLoadTemplate();
      }
      // 3.安装模板
      await this.installTemplate();
    } catch (error) {
      console.log(error);
      log.error(error.message);
    }
  }
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }
    return null;
  }
  async execCommand(command, errMsg) {
    let ret;
    if (command) {
      const cmdArray = command.split(" ");
      const cmd = this.checkCommand(cmdArray[0]);
      if (!cmd) {
        throw new Error("命令不存在！命令：" + command);
      }
      const args = cmdArray.slice(1);
      ret = await execAsync(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    }
    if (ret !== 0) {
      throw new Error(errMsg);
    }
    return ret;
  }
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        //标准安装
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        //自定义安装
        await this.installCustomTemplate();
      } else {
        throw new Error("项目模板无法识别");
      }
    } else {
      throw new Error("项目模板信息不存在");
    }
  }
  async installNormalTemplate() {
    log.verbose("template", this.templateInfo);
    //拷贝模板到当前目录
    const templatePath = path.resolve(
      this.templateNpm.cacheFilePath,
      "template"
    );
    let spinner = spinnerStart("正在安装模板");
    try {
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      await fse.copy(templatePath, targetPath);
    } catch (error) {
      throw new Error(error);
    } finally {
      spinner.stop(true);
    }
    //ejs渲染
    const ignore = ["node_modules/**", "public/**"];
    await this.ejsRender({ ignore });
    //安装依赖
    const { installCommand, startCommand } = this.templateInfo;
    // console.log(installCommand, startCommand);
    // await this.execCommand(installCommand, "依赖安装失败！");
    // 启动命令执行
    // await this.execCommand(startCommand, "启动执行命令失败！");
  }
  async installCustomTemplate() {}
  //这里的逻辑是将用户的信息和模板库里的信息比对然后得到用户所选择的模板信息
  //然后将用户下载的包缓存到用户的指定目录 比如这里就是 jiaodashi/.jiao-cli/template/node_modules
  //然后拿到
  async downLoadTemplate() {
    // console.log(this.template, this.projectInfo);
    const { projectTemplate } = this.projectInfo;

    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    );
    const targetPath = path.resolve(userHome, ".jiao-cli", "template");
    const storeDir = path.resolve(
      userHome,
      ".jiao-cli",
      "template",
      "node_modules"
    );
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart("正在下载模板");
      try {
        await templateNpm.install();
        await sleep();
      } catch (error) {
        throw new Error("下载模板失败");
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          this.templateNpm = templateNpm;
        }
      }
    } else {
      const spinner = spinnerStart("正在更新模板");
      try {
        await templateNpm.update();
        await sleep();
      } catch (error) {
        throw new Error("下载模板失败");
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          this.templateNpm = templateNpm;
        }
      }
    }
    // 1.通过项目模板api获取项目信息
    // 1.1通过egg.js搭建一套后端系统
    // 1.2通过npm存储项目模板
    // 1.3将项目模板存储在mongodb数据库中
    // 1.4通过egg.js获取mongodb中的数据并通过API返回
  }

  async getProjectInfo() {
    // 3选择创建项目或者组件
    function isValidName(v) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        v
      );
    }
    let projectInfo = {};
    let isProjectNameValid = false;
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      projectInfo.projectName = this.projectName;
    }
    const { type } = await inquirer.prompt({
      type: "list",
      message: "请选择初始化类型",
      default: TYPE_PROJECT,
      name: "type",
      choices: [
        {
          name: "项目",
          value: TYPE_PROJECT,
        },
        {
          name: "组件",
          value: TYPE_COMPONENT,
        },
      ],
    });
    log.verbose("type", type);
    // 4.获取项目基本信息
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "请输入项目名称",
          default: "",
          validate: function (v) {
            // 首字符必须为英文字符
            // 尾字符必须为英文或者数字不能为数字
            //字符仅允许-_
            const done = this.async();

            setTimeout(function () {
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                  v
                )
              ) {
                done("请输入合法的项目名称");
                return;
              }
              done(null, true);
            }, 0);
            return v;
          },
        },
        {
          type: "input",
          name: "projectVersion",
          message: "请输入版本号",
          default: "1.0.0",
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              if (!valid(v)) {
                done("请输入合法的版本号");
                return;
              }
              done(null, true);
            }, 0);
            return;
          },
        },
        {
          type: "list",
          name: "projectTemplate",
          message: "请选择项目模板",
          choices: this.createTemplateChoice(),
        },
      ]);
      projectInfo = {
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
    }
    if (projectInfo.projectName) {
      projectInfo.className = require("kebab-case")(
        projectInfo.projectName
      ).replace(/^-/, "");
    }
    return projectInfo;
  }
  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }));
  }
  //这里的prepare 方法就是用来处理用户目录不为空或者强制创建的逻辑
  async prepare() {
    //这里就是发起请求获取到mongodb上的模板信息
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error("项目模板不存在");
    }

    this.template = template;
    // 1.判断当前目录是否为空
    let ifContinue = false;
    if (!this.ifCwdIsEmpty()) {
      if (!this.force) {
        ifContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "ifContinue",
            message: "当前项目不为空，是否继续创建项目",
          })
        ).ifContinue;
      }
      // 2.启动强制创建
      if (ifContinue) {
        return;
      }
      if (ifContinue || this.force) {
        // 清空当前目录
        const { confirmDelete } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDelete",
          default: false,
          message: "是否确认清空当前目录下的所有文件",
        });
        if (confirmDelete) {
          fse.emptyDirSync(localPath);
        }
      }
    }

    return await this.getProjectInfo();
    // 3选择创建项目或者组件
    // 4.获取项目基本信息
  }
  ifCwdIsEmpty() {
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(
      (file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0
    );
    return !fileList && fileList.length <= 0;
  }
  ejsRender(option) {
    return new Promise((resolve, reject) => {
      const glob = require("glob");
      const dir = process.cwd();
      glob(
        "**",
        {
          cwd: dir,
          ignore: option.ignore || 0,
          nodir: true,
        },
        (err, files) => {
          if (err) reject(err);
          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file);
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(
                  filePath,
                  this.projectInfo,
                  {},
                  (err, result) => {
                    if (err) {
                      reject1(err);
                    }
                    fse.writeFileSync(filePath, result);
                    resolve1(result);
                  }
                );
              });
            })
          )
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }
      );
    });
  }
}

function init(argv) {
  // console.log(projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}
module.exports = { init, Command };
