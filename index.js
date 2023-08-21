const core = require('@actions/core');
const github = require('@actions/github');

const { owner, repo } = github.context.repo;
const ref = process.env.GITHUB_REF;
const environment = core.getInput('environment', {
  required: true,
});
const preview_url = core.getInput('preview_url');
const description = core.getInput('description');

const token = core.getInput('token', { required: true });
const octokit = github.getOctokit(token);

async function createDeployment() {
  const req = {
    owner,
    repo,
    ref,
    environment,
    description,
    auto_merge: false,
    required_contexts: [],
  };

  const response = await octokit.rest.repos.createDeployment(req);

  if (response.status >= 400) {
    throw new Error('Failed to create a new deployment');
  }

  return response;
}

async function getFailureURL() {
  const {repo: {owner, repo}, serverUrl, runId} = github.context;
  return `${serverUrl}/${owner}/${repo}/actions/runs/${runId}`
}

async function main() {
  const response = await createDeployment();

  const isSuccessful = preview_url && preview_url.length > 0;

  const deploymentStatus = {
    repo,
    owner,
    deployment_id: response.data.id,
    auto_inactive: false,
  };

  if (isSuccessful) {
    deploymentStatus.state = 'success';
    deploymentStatus.environment_url = preview_url;
  } else {
    deploymentStatus.state = 'failure';
    deploymentStatus.environment_url = await getFailureURL();
    if (!process.env.WORKFLOW_CI) {
      core.setFailed("Deployment to Oxygen failed. Check the 'Build and Publish to Oxygen' step for more information.");
    }
  }

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);

  return deploymentStatus.state;
}

main().then((result) => {
  if (process.env.WORKFLOW_CI) {
    const expected = process.env.EXPECTED_RESULT
    if (result !== expected) {
      core.setFailed(`Expected ${expected} but got ${result}`);
    }
  }
}).catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
