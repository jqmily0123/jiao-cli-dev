const axios = require("axios");

const BASE_URL = "https://gitee.com/api/v5";
class GiteeRequest {
  constructor(token) {
    this.token = token;
    this.service = axios.create({
      baseUrl: BASE_URL,
    });
    this.service.interceptors.response.use(
      (respose) => {
        return respose.data;
      },
      (error) => {
        if (error.respose && error.respose.data) {
          return error.respose;
        } else {
          return Promise.reject(error);
        }
      }
    );
  }
  get(url, params, headers) {
    return this.service({
      url,
      params: {
        ...params,
        accessToken: this.token,
      },
      method: "get",
      headers,
    });
  }
}
module.exports = GiteeRequest;
