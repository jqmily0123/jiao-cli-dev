"use strict";

class Command {
  constructor(argv) {
    console.log("command", argv);
  }
  init() {}
  exec() {}
}
module.exports = Command;
