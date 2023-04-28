const GitService = require("./gitService");
const GiteeRequest = require("./giteeRequest");
class Gitee extends GitService {
  constructor() {
    super("gitee");
    this.request = null;
  }
  getUser() {
    this.request.get("/user").then((res) => {
      console.log(res);
    });
  }
  getTokenUrl() {
    return "https://gitee.com/personal_access_tokens";
  }
  setToken(token) {
    super.setToken(token);
    this.request = new GiteeRequest(token);
  }
  getTokenHelpUrl() {
    return "https://gitee.com/help/articles/4191";
  }
}
module.exports = Gitee;
