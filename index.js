const core = require('@actions/core');
const github = require('@actions/github');

const token = core.getInput('token', { required: true });
const preview_url = core.getInput('preview_url');

const octokit = github.getOctokit(token, {
  previews: ['ant-man-preview', 'flash-preview'],
});

const { owner, repo } = github.context.repo;

async function setDeploymentStatus(deploymentId) {
  const deploymentStatus = {
    repo,
    owner,
    deployment_id: deploymentId,
  };

  const isSuccessful = preview_url && preview_url.length > 0;

  if (isSuccessful) {
    deploymentStatus.state = 'success';
    deploymentStatus.environment_url = preview_url;
  } else {
    deploymentStatus.state = 'failure';
    deploymentStatus.environment_url = `https://github.com/${process.env.GITHUB_REPOSITORY}/runs/${process.env.GITHUB_RUN_ID}?check_suite_focus=true`;
  }

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);
}

async function main() {
  try {
    const deploymentId = core.getState('deploymentId');
    await setDeploymentStatus(deploymentId);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main().catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
