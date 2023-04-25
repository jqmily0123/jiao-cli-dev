#! /usr/bin/env node
const importLocal = require("import-local");
console.log(__filename);
if (importLocal(__filename)) {
  //如果传入了文件就代表加载的本地脚手架文件
  require("npmlog").info("cli", "正在使用imoocCli本地版本");
} else {
  require("../lib/index.js")(process.argv.slice(2));
}
