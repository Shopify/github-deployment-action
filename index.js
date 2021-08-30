const core = require('@actions/core');
const github = require('@actions/github');

const { owner, repo } = github.context.repo;
const ref = process.env.GITHUB_REF;
const sha = process.env.GITHUB_SHA;
const creator = process.env.ACTOR;
const environment = core.getInput('environment', {
  required: true,
});
const preview_url = core.getInput('preview_url');
const description = core.getInput('description');

const token = core.getInput('token', { required: true });
const octokit = github.getOctokit(token, {
  previews: ['ant-man-preview', 'flash-preview'],
});

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

async function getJobURL() {
  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs',
    {
      owner,
      repo,
      run_id: process.env.GITHUB_RUN_ID,
    },
  );
  const job = res.data.jobs.find(
    (job) => job.name === process.env.GITHUB_JOB,
  );
  console.info(JSON.stringify(process.env, null, 2))
  console.log(JSON.stringify(res.data.jobs, null, 2));
  return job.html_url;
}

async function main() {
  const response = await createDeployment();

  const isSuccessful = preview_url && preview_url.length > 0;

  const deploymentStatus = {
    repo,
    owner,
    deployment_id: response.data.id,
  };

  if (isSuccessful) {
    deploymentStatus.state = 'success';
    deploymentStatus.environment_url = preview_url;
  } else {
    deploymentStatus.state = 'failure';
    deploymentStatus.environment_url = await getJobURL();
  }

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);
}

main().catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
