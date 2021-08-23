const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  const ref = process.env.GITHUB_REF;
  const sha = process.env.GITHUB_SHA;
  const creator = process.env.ACTOR;
  const token = core.getInput('token', { required: true });
  const environment = core.getInput('environment', {
    required: true,
  });
  const preview_url = core.getInput('preview_url');
  const description = core.getInput('description');
  const error = core.getInput('error');

  const octokit = github.getOctokit(token, {
    previews: ['ant-man-preview', 'flash-preview'],
  });

  const { owner, repo } = github.context.repo;
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
      preview_url,
      description,
    },
  };

  const resp = await octokit.rest.repos.createDeployment(req);

  if (resp.status >= 400) {
    throw new Error('Failed to create a new deployment');
  }

  const isSuccessful = preview_url && preview_url.length > 0;

  const deploymentStatus = {
    repo,
    owner,
    deployment_id: resp.data.id,
  };

  if (isSuccessful) {
    deploymentStatus.state = 'success';
    deploymentStatus.environment_url = preview_url;
  } else {
    deploymentStatus.state = 'failure';
    deploymentStatus.environment_url = `https://github.com/${process.env.GITHUB_REPOSITORY}/runs/${process.env.GITHUB_RUN_ID}?check_suite_focus=true`;
  }

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);
}

main().catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
