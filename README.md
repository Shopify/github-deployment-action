# shopify/github-deployment-action

[About this repo](#about-this-repo) | [Usage](#usage) | [Configuration](#configuration)

## About this repo

Create [GitHub deployments](GitHub deployments) from GitHub actions.

Omit the `preview_url` and the deployment is assumed to be a failure. When this happen, the GitHub workflow run URL will be used as the environment URL.

## Usage

Add `shopify/github-deployment-action@v1` to a GitHub workflow file.

```yml
# .github/workflows/deploy-production.yml
name: Deploy to Production on push to main
on:
  push:
    branches:
      - main
jobs:
  production:
    name: Theme Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      # You should replace this step with your own deploy code
      - name: Example Deploy Action
        id: deploy
        run: |
          export PREVIEW_URL=https://shopify.dev/hydrogen
          echo "::set-output name=preview_url::$PREVIEW_URL"

      - name: Create GitHub Deployment
        uses: shopify/github-deployment-action@v1
        # We use if: always() to make sure this workflow runs pass or fail
        if: always()
        with:
          token: ${{ github.token }}
          environment: 'production'
          description: ${{ github.event.head_commit.message }}

          # Example way to extract state from the deploy step.
          preview_url: ${{ steps.deploy.outputs.preview_url }}
```

## Configuration

The `shopify/github-deployment-action` accepts the following arguments:

* `environment` - (required) The name of the environment. This could be anything and will show up on the repo's Environments panel.
* `token` - (required) The contents of `${{ github.token }}` to allow the creation of GitHub deployments.
* `description` - (optional) More information about the deployment.
* `preview_url` - (optional) When absent, the deployment is assumed to be a failure and will link back to the GitHub workflow.
