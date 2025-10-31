# GitHub Actions Deployment to Vercel

This guide explains how to set up automatic deployments to Vercel using GitHub Actions.

## Overview

The workflow automatically:
- **Production Deployments**: Deploys to production when code is pushed to `main` branch
- **Preview Deployments**: Creates preview deployments for pull requests
- **CI Checks**: Runs linting, type checking, and builds before deployment
- **PR Comments**: Adds deployment status comments to pull requests

## Setup Instructions

### Step 1: Get Vercel Credentials

#### 1.1 Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it: `GitHub Actions`
4. Set scope: **Full Account**
5. Click **"Create"** and copy the token

#### 1.2 Get Vercel Project ID and Org ID

**Option A: From Vercel Dashboard**
1. Go to your project in Vercel
2. Navigate to **Settings** → **General**
3. Scroll down to find:
   - **Project ID**
   - **Organization ID** (in the URL: `vercel.com/[org-id]/[project-name]`)

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run in project directory)
vercel link

# This creates .vercel/project.json with your IDs
cat .vercel/project.json
```

The `.vercel/project.json` file contains:
```json
{
  "orgId": "your-org-id",
  "projectId": "your-project-id"
}
```

**Important**: Add `.vercel` to your `.gitignore` file:
```bash
echo ".vercel" >> .gitignore
```

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secrets:

#### Required Vercel Secrets:

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` or Vercel dashboard |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` or Vercel dashboard |

#### Required Application Secrets:

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Your production app URL | Your Vercel domain (e.g., `https://productquarry.vercel.app`) |

#### Optional Secrets (if you use them):

| Secret Name | Description |
|------------|-------------|
| `SENTRY_AUTH_TOKEN` | Sentry authentication token |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) |

### Step 3: Configure Vercel Project

Before the GitHub Action can deploy, you need to create the project in Vercel:

**Option A: Via Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure settings but **DO NOT** enable automatic deployments from Vercel
   - Go to **Settings** → **Git** → Disable **"Production Branch"** auto-deploy
   - This prevents duplicate deployments (one from Vercel, one from GitHub Actions)

**Option B: Via Vercel CLI**
```bash
vercel link
```

### Step 4: Commit and Push

```bash
git add .github/workflows/vercel-deploy.yml
git commit -m "Add GitHub Actions workflow for Vercel deployment"
git push origin main
```

## Workflow Details

### What Happens on Push to Main

1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Run linter (`npm run lint`)
5. Run type checking (`tsc --noEmit`)
6. Build the project (`npm run build`)
7. Install Vercel CLI
8. Pull Vercel environment configuration
9. Build production artifacts
10. Deploy to production

### What Happens on Pull Requests

1. Same checks as above (steps 1-6)
2. Build production artifacts
3. Deploy to preview environment
4. Add comment to PR with deployment status

## Monitoring Deployments

### View GitHub Actions

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. View workflow runs and logs

### View Vercel Deployments

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. View all deployments (production and preview)

## Troubleshooting

### Build Fails with "Missing Secrets"

**Problem**: GitHub Actions can't access environment variables.

**Solution**:
- Verify all secrets are added in GitHub Settings → Secrets
- Check secret names match exactly (they're case-sensitive)
- Ensure secrets don't have trailing spaces

### "Project not found" Error

**Problem**: Vercel CLI can't find the project.

**Solution**:
- Verify `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` are correct
- Create the project in Vercel first (via dashboard or CLI)
- Re-run `vercel link` locally to get correct IDs

### Deployment Succeeds but App Doesn't Work

**Problem**: Environment variables not set in Vercel.

**Solution**:
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add the same environment variables as GitHub secrets
3. Set them for: **Production**, **Preview**, and **Development**
4. Redeploy

### Duplicate Deployments

**Problem**: Both Vercel and GitHub Actions are deploying.

**Solution**:
1. Go to Vercel Dashboard → **Settings** → **Git**
2. Disable automatic deployments from Vercel
3. Only use GitHub Actions for deployments

## Advanced Configuration

### Deploy Only on Specific Paths

Modify `.github/workflows/vercel-deploy.yml`:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'app/**'
      - 'components/**'
      - 'lib/**'
      - 'package.json'
```

### Add Slack Notifications

Add this step to the workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment ${{ job.status }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Run Tests Before Deploy

Add this step after "Install dependencies":

```yaml
- name: Run tests
  run: npm test
```

## Security Notes

- Never commit `.vercel/project.json` to Git
- Store all sensitive values in GitHub Secrets
- Use environment-specific secrets (dev, staging, prod)
- Rotate Vercel tokens periodically
- Use service accounts for production deployments

## Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Create Vercel project
3. ✅ Push workflow to main branch
4. ✅ Monitor first deployment
5. ✅ Test preview deployments with a PR
6. ✅ Configure custom domain in Vercel
7. ✅ Update Supabase redirect URLs

## References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
