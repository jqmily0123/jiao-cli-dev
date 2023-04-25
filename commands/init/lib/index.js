"use strict";

const Command = require("@jiao-cli-dev/command");
class InitCommand extends Command {}

function init(argv) {
  // console.log(projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
  console.log(typeof argv);
  return new InitCommand(argv);
}
module.exports = init;
