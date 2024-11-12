#!/usr/bin/env node
const util = require("util");

const exec = util.promisify(require("child_process").exec);

const getAffectedForFeature = async () => {
  const { stdout } = await exec(
    "nx show projects --affected --json --base=origin/main --head=HEAD",
  );
  return JSON.parse(stdout);
};

const getAffectedForTag = () => {
  const app = process.env.CI_COMMIT_TAG.split("-v")[0];

  return app ? [app] : [];
};

const getAffectedForMain = async () => {
  const { stdout } = await exec(
    "nx show projects --affected --json --base=HEAD^ --head=HEAD",
  );
  return JSON.parse(stdout);
};

const getApps = async () => {
  const { stdout } = await exec('nx show projects --json --projects "apps/*"');
  return JSON.parse(stdout);
};

const getLibs = async () => {
  const { stdout } = await exec('nx show projects --json --projects "libs/*"');
  return JSON.parse(stdout);
};

const run = async () => {
  let affected = [];
  let apps = await getApps();
  let libs = await getLibs();

  let opsBranch = process.env.OPS_BRANCH;
  if (opsBranch === "") {
    opsBranch = "edge";
  }

  if (!!process.env.CI_COMMIT_TAG) {
    affected = getAffectedForTag();
  } else if (process.env.CI_COMMIT_BRANCH === "main") {
    affected = await getAffectedForMain();
  } else {
    affected = await getAffectedForFeature();
  }

  let config = `
stages:
 - 'run'

`;

  apps.forEach((app) => {
    let when = affected.includes(app) ? "on_success" : "manual";

    config += `
${app}:
  stage: 'run'
  when: '${when}'
  trigger:
    strategy: 'depend'
    include:
      - local: 'apps/${app}/.gitlab-ci.yml'
  variables:
    OPS_BRANCH: "${opsBranch}"
`;
  });

  if (affected.length === 0) {
    config += `
noop:
  stage: 'run'
  tags:
  - 'ci'
  script:
    - 'echo "No apps affected, running noop to prevent Gitlab trigger job (run) from failing"'
`;
  }

  libs.forEach((lib) => {
    let when = affected.includes(lib) ? "on_success" : "manual";

    config += `
${lib}-lib:
  stage: 'run'
  when: '${when}'
  trigger:
    strategy: 'depend'
    include:
      - local: 'libs/${lib}/.gitlab-ci.yml'
  variables:
    OPS_BRANCH: "${opsBranch}"
`;
  });

  console.log(config);
};

run();
