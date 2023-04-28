"use strict";
const { isObject } = require("@jiao-cli-dev/utils");
const formatPath = require("@jiao-cli-dev/format-path");
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require("@imooc-cli-dev/get-npm-info");
const pkgDir = require("pkg-dir").sync;
const path = require("path");
const npminstall = require("npminstall");
const pathExists = require("path-exists").sync;
const fse = require("fs-extra");
class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的options参数不能为空");
    }
    if (!isObject(options)) {
      throw new Error("Package类的options参数应该为对象类型");
    }
    const { targetPath, storeDir, packageName, packageVersion } = options;
    // package的路径
    this.targetPath = targetPath;
    // package的存储路径
    this.storeDir = storeDir;
    // package的存储名称
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.catchFilePathPrefix = this.packageName.replace("/", "_");
  }
  //这里的prepare的逻辑是 1.检查用户的缓存路径是否存在，如果不存在就创建该目录
  //二个是判断用户输入的版本信息是否是最新版
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }
  //判断当前package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.catchFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }
  getSpecificFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.catchFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }
  // 安装package
  install() {
    //npm的四个参数解析
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }
  // 更新package
  async update() {
    //1.获取最新的模块版本号

    //2.查询最新版本号的路径是否存在
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    const latestFilePath = this.getSpecificFilePath(latestPackageVersion);
    //3.如果不存在安装最新版本
    await this.prepare();
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: this.latestPackageVersion,
          },
        ],
      });
    }
    this.packageVersion = latestPackageVersion;
  }
  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      const dir = pkgDir(targetPath);
      if (dir) {
        const pkgFile = require(path.resolve(dir, "package.json"));
        if (pkgFile && pkgFile.main) {
          return formatPath(path.resolve(dir, pkgFile.main));
        }
        if (pkgFile && pkgFile.lib) {
          return formatPath(path.resolve(dir, pkgFile.lib));
        }
      }
      return null;
    }
    if (this.storeDir) {
      return _getRootFile(this.catchFilePath);
    } else {
      //不使用缓存的情况
      return _getRootFile(this.targetPath);
    }
  }
}
module.exports = Package;
