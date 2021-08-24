const core = require('@actions/core');
const github = require('@actions/github');

const ref = process.env.GITHUB_REF;
const sha = process.env.GITHUB_SHA;
const creator = process.env.ACTOR;
const token = core.getInput('token', { required: true });
const environment = core.getInput('environment', {
  required: true,
});
const description = core.getInput('description');

const octokit = github.getOctokit(token, {
  previews: ['ant-man-preview', 'flash-preview'],
});

const { owner, repo } = github.context.repo;

async function createDeployment() {
  const req = {
    owner,
    repo,
    ref,
    environment,
    description,
    auto_merge: false,
    required_contexts: [],
    payload: {
      ref,
      sha,
      creator,
      environment,
      description,
    },
  };

  const resp = await octokit.rest.repos.createDeployment(req);

  if (resp.status >= 400) {
    throw new Error('Failed to create a new deployment');
  }

  return resp;
}

async function createDeploymentStatus(deploymentId) {
  const deploymentStatus = {
    repo,
    owner,
    deployment_id: deploymentId,
    state: 'pending',
  };

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);
}

async function main() {
  const response = await createDeployment();
  await createDeploymentStatus(response.data.id);
  core.saveState('deploymentId', response.data.id)
}

main().catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
