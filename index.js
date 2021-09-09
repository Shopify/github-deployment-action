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

async function getFailureURL() {
  // Since GITHUB_JOB = YAML's job.id,
  // and since the API's job.id is the database's ID,
  // and since the API's job.name === job.id IFF there's no job.name in the yaml file,
  // It's possible that we can't get the URL for the actual job.
  const job = await getJob();
  if (job && job.html_url) return job.html_url

  // When that happens, we fallback to the run's URL.
  const run = await getRun();
  if (run && run.html_url) return run.html_url
  return undefined;
}

async function getJob() {
  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs',
    {
      owner,
      repo,
      run_id: process.env.GITHUB_RUN_ID,
    },
  );
  const { jobs } = res.data;
  if (jobs.length === 1) return jobs[0];
  return jobs.find((job) => job.name === process.env.GITHUB_JOB);
}

async function getRun() {
  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/runs/{run_id}',
    {
      owner,
      repo,
      run_id: process.env.GITHUB_RUN_ID,
    },
  );
  return res.data;
}

async function main() {
  const response = await createDeployment();

  const isSuccessful = preview_url && preview_url.length > 0;

  const deploymentStatus = {
    repo,
    owner,
    deployment_id: response.data.id,
    auto_inactive: 'false',
  };

  if (isSuccessful) {
    deploymentStatus.state = 'success';
    deploymentStatus.environment_url = preview_url;
  } else {
    deploymentStatus.state = 'failure';
    deploymentStatus.environment_url = await getFailureURL();
  }

  await octokit.rest.repos.createDeploymentStatus(deploymentStatus);
}

main().catch(function (error) {
  core.setFailed(error.message);
  process.exit(1);
});
