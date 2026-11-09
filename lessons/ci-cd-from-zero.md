# CI/CD from Zero: Learn with API Quality Lab

This guide turns API Quality Lab into a hands-on exercise. You will watch GitHub run the tests automatically and, when you are ready, configure an optional deployment to Render.

## What you will learn

By the end, you will understand:

- what CI and CD mean;
- how a code change moves from your computer to GitHub;
- how a workflow runs commands on a clean machine;
- how tests can stop a deployment;
- where to find a workflow result and its report;
- how to store a secret URL and use it to trigger a deployment.

You do not need prior CI/CD experience. It helps to know how to open a terminal and use basic Git commands such as `commit` and `branch`. The Render service is optional until the deployment lesson.

## The idea in one sentence

CI/CD automates the path from a code change, through quality checks, to delivering or deploying the software.

- **CI — Continuous Integration:** changes are integrated into the repository and checked automatically. In this project, GitHub installs the dependencies and runs the API tests.
- **CD — Continuous Delivery:** after the checks pass, the software is ready to release, usually after a person approves it.
- **CD — Continuous Deployment:** after the checks pass, the software is deployed automatically. This project makes deployment optional; it only runs after you configure Render and enable `RENDER_DEPLOY_ENABLED`.

A team can use CI without CD. Automated tests are already a valuable first step.

## How a change moves through the pipeline

```text
You change the code
        ↓
Push a branch to GitHub and open a pull request to main
        ↓
GitHub Actions installs dependencies and runs the tests (CI)
        ↓
If a test fails, the run turns red and deployment does not start
        ↓
After review and merge to main, the tests run again
        ↓
If optional CD is enabled, GitHub asks Render to deploy
```

## The parts of the workflow

Open [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). A workflow is an automation recipe that GitHub Actions reads.

| Term | Meaning in this project |
| --- | --- |
| `on` | Events that start the automation: a pull request to `main`, a push to `main`, or a manual run. |
| `jobs` | Work groups. `ci` checks the code; `deploy` can request a deployment. |
| `runs-on` | The temporary GitHub machine that runs the job. |
| `steps` | The ordered actions within a job. |
| `actions/checkout` | Downloads a copy of the repository to the temporary machine. |
| `actions/setup-node` | Installs Node.js 22 on that machine. |
| `npm ci` | Installs the exact versions recorded in `package-lock.json`. |
| `npm test` | Runs the Playwright API tests. |
| Artifact | A file saved by a workflow run; here, the JSON test report. |
| Secret | A private value stored by GitHub, used here to authorize a deployment request to Render. |

The GitHub runner starts clean for each run. This helps reveal dependencies or settings that only existed on your own computer.

## Lesson 1: Watch CI run

The pull request for this learning project is the first example. Open its **Checks** tab and select **Install and test**. You can also open the repository's **Actions** tab and select **CI and optional CD**.

After the pull request is merged, the workflow is available on `main`. To see CI run again on a new pull request:

1. Update your local `main` branch and create a learning branch:

   ```powershell
   git switch main
   git pull
   git switch -c learn-ci-cd
   ```

2. Make a small documentation change, then stage, commit, and push it:

   ```powershell
   git add README.md
   git commit -m "Practice the CI workflow"
   git push -u origin learn-ci-cd
   ```

3. Open a pull request from `learn-ci-cd` to `main`.
4. On the pull request page, watch the **Install and test** check. Open the run to inspect each step.
5. After it finishes, download the `playwright-report` artifact to view the JSON test report.

CI checks pull requests targeting `main` and commits pushed to `main`. Merging a pull request creates a push to `main`, so the workflow runs again after the merge.

### Exercise: Make a test fail

Do this exercise only on the `learn-ci-cd` branch:

1. Open `tests/api/tasks.spec.js`. In the test that lists tasks, temporarily change `expect(tasks).toEqual([])` to `expect(tasks).toEqual(["intentional failure"])`.
2. Commit and push the change. The workflow should turn red because the actual response does not match the expected value.
3. Open the `Run the API tests` log and find the difference between the expected and received values.
4. Restore the original expectation with `git restore tests/api/tasks.spec.js`, then commit and push the fix. The CI check should turn green again.

Do not merge a change made only to cause a test failure.

## Lesson 2: Understand when deployment runs

The `deploy` job depends on `ci` (`needs: ci`), so it cannot start if the tests fail. It also requires all of the following:

1. The event is a push, not a pull request or a manual run.
2. The branch is `main`.
3. The repository variable `RENDER_DEPLOY_ENABLED` has the value `true`.

This lets you use CI without deploying. If the variable is missing or has another value, the deployment job is skipped. A manual **Run workflow** run executes CI, but it does not deploy in this configuration.

## Lesson 3: Configure the optional Render deployment

This step publishes a demo API to the internet. Use synthetic data only: this example has no authentication and stores tasks in memory.

### 1. Create the service

In Render, create a **Web Service** linked to the `api-quality-lab` repository and the `main` branch. Configure:

- Build Command: `npm ci`
- Start Command: `npm start`
- Environment variable: `HOST` = `0.0.0.0`
- Health Check Path: `/tasks`
- Auto-Deploy: **No**

On your computer, the server binds to `127.0.0.1` by default. On Render, `HOST=0.0.0.0` lets Render route requests to the process. Render provides the `PORT` variable, which this project already reads.

Disabling Render Auto-Deploy prevents a push from deploying separately before GitHub finishes CI. GitHub Actions will request the deployment after the tests pass.

### 2. Store the deploy hook as a secret

In the Render service dashboard, open **Settings** and create a **Deploy Hook**. Treat its URL like a password: anyone with the URL can request a deployment.

In GitHub, open **Settings → Secrets and variables → Actions → Secrets → New repository secret** and add:

- Name: `RENDER_DEPLOY_HOOK_URL`
- Secret: the Render Deploy Hook URL

Do not put this URL in source code, a commit, a log message, or a chat.

### 3. Enable the deployment job

In GitHub, still under **Settings → Secrets and variables → Actions**, open **Variables → New repository variable** and add:

- Name: `RENDER_DEPLOY_ENABLED`
- Value: `true`

Then merge an approved change into `main`. CI installs the dependencies and runs the tests first. If they pass and the settings above are present, the CD job sends a request to Render. Follow the deployment in the Render dashboard, then open your service URL followed by `/tasks`.

To turn off CD, remove the variable or change its value. CI will continue to run.

## How to investigate a failure

1. Open the failed run in the **Actions** tab.
2. Find the first red step; later steps may have been skipped because of it.
3. Read the error message. If `npm ci` failed, investigate the dependencies and lockfile. If `npm test` failed, read the assertion that failed.
4. Make the fix on a branch and push another commit. A new run will show whether the fix worked.
5. For more detail, download the `playwright-report` artifact when it is available.

## Quick vocabulary

- **Branch:** a separate line of work in Git.
- **Commit:** a recorded set of changes.
- **Pull request (PR):** a request to review and merge a branch.
- **Workflow:** an automation recipe stored under `.github/workflows`.
- **Runner:** a temporary machine that executes a workflow.
- **Job:** a group of steps that run on the same machine.
- **Artifact:** a file saved by a workflow for later inspection or download.
- **Secret:** a private value stored in GitHub settings.
- **Deploy:** publish a version to an accessible environment.
- **Pipeline:** an informal name for the automated path through checks and deployment.

## Next challenges

1. Add a lint step and observe how it can block a merge.
2. Require the CI check to pass before allowing a pull request to merge into `main`.
3. Separate test and production environments, requiring approval before deployment.
4. Add a dedicated health endpoint and configure the health check to use it.

Take one challenge at a time. First understand the current run and why each condition exists.

## Official references

- [Events that trigger workflows in GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
