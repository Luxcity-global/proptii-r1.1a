const { Octokit } = require('@octokit/rest');
const chalk = require('chalk');

const REPO_OWNER = process.env.GITHUB_OWNER;
const REPO_NAME = 'proptii-r1.1a-2';

async function verifyWorkflowTriggers() {
    console.log(chalk.blue('Verifying Workflow Triggers...'));

    try {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get workflow configurations
        const { data: workflows } = await octokit.actions.listRepoWorkflows({
            owner: REPO_OWNER,
            repo: REPO_NAME
        });

        console.log(chalk.gray('\nConfigured Workflows:'));
        workflows.workflows.forEach(workflow => {
            console.log(chalk.white(`- ${workflow.name} (${workflow.state})`));
            console.log(chalk.gray(`  Path: ${workflow.path}`));
            console.log(chalk.gray(`  ID: ${workflow.id}`));
        });

        // Check recent workflow runs
        const { data: runs } = await octokit.actions.listWorkflowRunsForRepo({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            per_page: 5
        });

        console.log(chalk.gray('\nRecent Workflow Runs:'));
        runs.workflow_runs.forEach(run => {
            const status = run.conclusion === 'success'
                ? chalk.green(run.conclusion)
                : chalk.red(run.conclusion);
            console.log(chalk.white(`- ${run.name}: ${status}`));
            console.log(chalk.gray(`  Triggered by: ${run.event}`));
            console.log(chalk.gray(`  Run ID: ${run.id}`));
        });

    } catch (error) {
        console.error(chalk.red('Error verifying workflow triggers:'), error.message);
    }
}

async function checkDeploymentStatus() {
    console.log(chalk.blue('\nChecking Deployment Status...'));

    try {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get recent deployments
        const { data: deployments } = await octokit.repos.listDeployments({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            per_page: 5
        });

        console.log(chalk.gray('\nRecent Deployments:'));
        for (const deployment of deployments) {
            const { data: status } = await octokit.repos.listDeploymentStatuses({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                deployment_id: deployment.id
            });

            const latestStatus = status[0];
            const statusColor = latestStatus?.state === 'success' ? 'green' : 'red';

            console.log(chalk.white(`- Environment: ${deployment.environment}`));
            console.log(chalk.gray(`  Created: ${new Date(deployment.created_at).toLocaleString()}`));
            console.log(chalk[statusColor](`  Status: ${latestStatus?.state || 'unknown'}`));
        }

    } catch (error) {
        console.error(chalk.red('Error checking deployment status:'), error.message);
    }
}

async function verifyBranchProtection() {
    console.log(chalk.blue('\nVerifying Branch Protection Rules...'));

    try {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get branch protection rules
        const { data: branch } = await octokit.repos.getBranch({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            branch: 'main'
        });

        const protection = branch.protected ?
            await octokit.repos.getBranchProtection({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                branch: 'main'
            }) : null;

        console.log(chalk.gray('\nMain Branch Protection:'));
        console.log(chalk.white(`- Protected: ${branch.protected ? chalk.green('Yes') : chalk.red('No')}`));

        if (protection) {
            const { data } = protection;
            console.log(chalk.white('- Required Status Checks:'),
                data.required_status_checks ? chalk.green('Enabled') : chalk.red('Disabled'));
            console.log(chalk.white('- Required Reviews:'),
                data.required_pull_request_reviews ? chalk.green('Enabled') : chalk.red('Disabled'));
            console.log(chalk.white('- Enforce Admins:'),
                data.enforce_admins.enabled ? chalk.green('Yes') : chalk.red('No'));
        }

    } catch (error) {
        console.error(chalk.red('Error verifying branch protection:'), error.message);
    }
}

async function main() {
    console.log(chalk.yellow('Starting GitHub Integration Verification...\n'));

    if (!process.env.GITHUB_TOKEN) {
        console.error(chalk.red('Error: GITHUB_TOKEN environment variable is required'));
        process.exit(1);
    }

    if (!process.env.GITHUB_OWNER) {
        console.error(chalk.red('Error: GITHUB_OWNER environment variable is required'));
        process.exit(1);
    }

    try {
        await verifyWorkflowTriggers();
        await checkDeploymentStatus();
        await verifyBranchProtection();

        console.log(chalk.green('\n✅ GitHub integration verification completed'));
    } catch (error) {
        console.error(chalk.red('\n❌ GitHub integration verification failed:'), error.message);
        process.exit(1);
    }
}

main(); 