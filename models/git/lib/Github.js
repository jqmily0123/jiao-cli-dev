const GitService = require("./gitService");

class Github extends GitService {
  constructor() {
    super("github");
  }
  getSSHKeyUrl() {
    return "https://github.com/settings/keys";
  }
  getTokenHelpUrl() {
    return "https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh";
  }
  getUser() {}
}
module.exports = Github;
