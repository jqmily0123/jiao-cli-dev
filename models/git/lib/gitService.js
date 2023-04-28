function error(methodName) {
  throw new Error(`${methodName} 必须实现 `);
}

class GitService {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }
  setToken(token) {
    this.token = token;
  }
  createRepo() {
    error("createRepo");
  }
  createOrg() {
    error("createOrg");
  }
  getRemote() {
    error("getRemote");
  }
  getUser() {
    error("getUser");
  }
  getOrg() {
    error("getUser");
  }
  getSSHKeyUrl() {
    error("getTokenHelpUrl");
  }
  getTokenHelpUrl() {
    error("getTokenHelpUrl");
  }
}
module.exports = GitService;
