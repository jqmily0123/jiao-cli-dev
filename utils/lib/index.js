"use strict";

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
function sleep(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

function exec(command, args, options) {
  const win32 = process.platform === "win32";

  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;

  return require("child_process").spawn(cmd, cmdArgs, options || {});
}
function spinnerStart(msg, spinnerString = "|/-\\") {
  const Spinner = require("cli-spinner").Spinner;
  const spinner = new Spinner(msg + " %s");
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}
function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const cp = exec(command, args, options);
    cp.on("error", (e) => {
      reject(e);
    });
    cp.on("exit", (c) => {
      resolve(c);
    });
  });
}
module.exports = {
  isObject,
  sleep,
  exec,
  execAsync,
  spinnerStart,
};
