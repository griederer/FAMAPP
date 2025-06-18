# GitHub Actions CI/CD Setup for FAMAPP

This document explains how to set up GitHub Actions for continuous integration and deployment to Firebase Hosting.

## Overview

The GitHub Actions workflow automatically:
- Runs tests on every push and pull request
- Performs linting and type checking
- Builds the application
- Deploys to Firebase Hosting (preview for PRs, production for main branch)

## Files Created

### 1. `.github/workflows/firebase-hosting.yml`
The main workflow file that defines the CI/CD pipeline.

### 2. `.firebaserc`
Firebase project configuration specifying the default project (`famapp-e80ff`).

### 3. Updated Configuration Files
- `tsconfig.json` - Excludes test files from production build
- `.eslintrc.cjs` - Allows `any` types in test files and configures react-refresh rules

## Required GitHub Secrets

To enable Firebase deployment, you need to add the following secret to your GitHub repository:

### `FIREBASE_SERVICE_ACCOUNT_FAMAPP_E80FF`

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`famapp-e80ff`)
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. In GitHub, go to your repository → Settings → Secrets and variables → Actions
7. Create a new repository secret named `FIREBASE_SERVICE_ACCOUNT_FAMAPP_E80FF`
8. Paste the entire JSON content as the value

## Workflow Jobs

### 1. Test Job
Runs on every push and pull request:
- Install dependencies
- Run ESLint
- Run TypeScript type checking
- Run test suite with coverage
- Build the application
- Upload build artifacts

### 2. Deploy Preview Job
Runs on pull requests:
- Downloads build artifacts
- Deploys to Firebase Hosting preview channel
- Adds comment to PR with preview URL

### 3. Deploy Production Job
Runs on main branch pushes:
- Downloads build artifacts
- Deploys to Firebase Hosting production (live channel)

## Local Testing

Before pushing, you can test the CI pipeline locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run tests
npm test -- --run --coverage

# Build application
npm run build
```

## Firebase CLI Setup (Optional)

For local Firebase operations:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Test local deployment
firebase deploy --only hosting
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check TypeScript errors in build output
2. **Test Failures**: Review test results and fix failing tests
3. **Deployment Failures**: Verify Firebase service account JSON is correct
4. **Linting Errors**: Run `npm run lint` locally to identify issues

### Build Optimization

The current build includes a warning about large chunks. Consider:
- Implementing code splitting with React.lazy()
- Using dynamic imports for Firebase modules
- Optimizing bundle size with tree shaking

## Security Considerations

- Service account key is stored as GitHub secret (not in code)
- Preview deployments are automatically cleaned up
- Build artifacts are only accessible during workflow execution
- All deployments require successful tests to pass

## Performance Metrics

The workflow typically completes in:
- Test job: 2-3 minutes
- Deploy preview: 1-2 minutes
- Deploy production: 1-2 minutes

Total CI/CD time: 3-5 minutes from push to deployment.