"use strict";

module.exports = { getNpmInfo, getNpmVersions, getNpmSemverVersions };
const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");
function getNpmInfo(npmName, registry) {
  // TODO
  if (!npmName) {
    return null;
  }
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios
    .get(npmInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? "https://registry.npmjs.org/"
    : "https://registry.npm.taobao.org/";
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}
function getSemverVersions(baseVersion, versions) {
  versions = versions.filter((version) => {
    semver.satisfies(version, `^${baseVersion}`);
  });
  return versions;
}
async function getNpmSemverVersions(npmName, registry, baseVersion) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getSemverVersions(baseVersion, versions);
  console.log(newVersions);
}
