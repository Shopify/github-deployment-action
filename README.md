# shopify/github-deployment-action

## Deprecation notice

Earlier this year (2024), we introduced the [hydrogen deploy command](https://shopify.dev/docs/api/shopify-cli/hydrogen/hydrogen-deploy), which makes it simpler and more flexible to deploy to Oxygen from any context — including from CI/CD platforms other than GitHub.

The `hydrogen deploy` command is now replacing Oxygen's previous deployment method, which uses two GitHub Actions: `shopify/oxygenctl-action` and [shopify/github-deployment-action](https://github.com/Shopify/github-deployment-action) (this repo). These actions are now deprecated, and we encourage everyone to switch to the `deploy` command.

Many developers have already received a pull request from Shopify’s GitHub bot to make the required updates automatically, but you can also update manually if required. In most cases, it results in a much simpler workflow:

```diff
  - name: Build and Publish to Oxygen
    id: deploy
-   uses: shopify/oxygenctl-action@v4
-   with:
-    oxygen_deployment_token: ${{ secrets.OXYGEN_DEPLOYMENT_TOKEN_0000000000 }}
-     build_command: "npm run build"
- # Create GitHub Deployment
- - name: Create GitHub Deployment
-   uses: shopify/github-deployment-action@v1
-   if: always()
-   with:
-     token: ${{ github.token }}
-     environment: 'preview'
-     preview_url: ${{ steps.deploy.outputs.url }}
-     description: ${{ github.event.head_commit.message }}
+   run: npx shopify hydrogen deploy
+   env:
+     SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN: ${{ secrets.OXYGEN_DEPLOYMENT_TOKEN_0000000000 }}
```

If your workflow file has more complex customizations, consult the Hydrogen CLI reference for more details on configuring the [deploy](https://shopify.dev/docs/api/shopify-cli/hydrogen/hydrogen-deploy) command.

---

[About this repo](#about-this-repo) | [Usage](#usage) | [Configuration](#configuration)

## About this repo

Create [GitHub deployments](https://docs.github.com/en/rest/reference/repos#deployments) from GitHub actions.

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
    name: Deploy to production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      # You should replace this step with your own deploy code
      - name: Example Deploy Action
        id: deploy
        run: |
          export PREVIEW_URL=https://shopify.dev/hydrogen
          echo "preview_url=$PREVIEW_URL >> $GITHUB_OUTPUT"

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

## Releasing

Please refer to [Releasing doc](https://github.com/Shopify/github-deployment-action/blob/main/RELEASING.md) for more details.
