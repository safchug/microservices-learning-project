# GitHub Actions CI/CD Configuration

This repository uses GitHub Actions to automatically run tests and checks on every pull request.

## Workflows

### 1. Product Service Tests (`product-service-tests.yml`)
Runs comprehensive tests for the Product Service whenever changes are made to that service.

**Triggers:**
- Pull requests to `master`, `main`, or `develop` branches
- Push events to these branches
- Only runs when files in `services/product-service/` are changed

**Services Used:**
- MongoDB 7.0 (test database)
- Redis 7 (caching)
- Elasticsearch 8.11.0 (search)

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Wait for services to be ready
5. ✅ Run unit tests
6. ✅ Run tests with coverage
7. ✅ Upload coverage to Codecov
8. ✅ Comment PR with test results

### 2. All Services CI (`ci.yml`)
Comprehensive checks for the entire monorepo.

**Jobs:**

#### Product Service Tests
- Runs all Product Service tests with coverage
- Requires MongoDB, Redis, and Elasticsearch

#### Lint Check
- Runs Prettier formatting check
- Runs ESLint on all services

#### Build Services
- Builds all 4 services in parallel:
  - user-service
  - product-service
  - api-gateway
  - notification-service
- Verifies build artifacts exist

#### Docker Compose Validation
- Validates `docker-compose.yml` configuration

#### All Checks Passed (Required)
- **This job blocks PR merging if any check fails**
- Posts a summary comment on the PR

## Setting Up Branch Protection

To require these checks before merging, follow these steps:

### Step 1: Go to Repository Settings

1. Navigate to your repository on GitHub
2. Click **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `master` branch

### Step 2: Configure Branch Protection Rules

Enable these settings:

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   
   Required status checks:
   ✅ Product Service Tests
   ✅ Lint Check
   ✅ Build Services (user-service)
   ✅ Build Services (product-service)
   ✅ Build Services (api-gateway)
   ✅ Build Services (notification-service)
   ✅ Docker Compose Validation
   ✅ All Checks Passed

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
```

### Step 3: Apply to Additional Branches (Optional)

Repeat for `develop` or other branches if needed.

## Required Secrets

For full functionality, add these secrets in **Settings** → **Secrets and variables** → **Actions**:

### Optional:
- `CODECOV_TOKEN` - For code coverage reports (get from [codecov.io](https://codecov.io))

## How It Works

### When You Create a PR:

1. **GitHub Actions triggers automatically**
2. **Services are started** (MongoDB, Redis, Elasticsearch)
3. **Tests run** in parallel where possible
4. **Build verification** ensures all services compile
5. **Lint checks** verify code formatting
6. **Status check** appears on your PR

### PR Status Indicators:

- 🟡 **Pending** - Tests are running
- ✅ **Passed** - All checks succeeded (can merge!)
- ❌ **Failed** - Some checks failed (cannot merge)

### Automatic Comments:

The workflow will post a comment on your PR with:
- Test results
- Coverage percentages
- Status of each check
- Whether PR is ready to merge

## Example PR Comment

```markdown
## 🚀 CI/CD Checks

| Check | Status |
|-------|--------|
| Product Service Tests | ✅ success |
| Lint | ✅ success |
| Build All Services | ✅ success |
| Docker Compose | ✅ success |

✅ **All checks passed! This PR is ready to merge.**
```

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Run tests
cd services/product-service
npm test
npm run test:cov

# Check formatting
npx prettier --check .

# Lint code
npm run lint

# Build all services
cd services/user-service && npm run build
cd ../product-service && npm run build
cd ../api-gateway && npm run build
cd ../notification-service && npm run build

# Validate Docker Compose
docker-compose config
```

## Workflow Files

- `.github/workflows/product-service-tests.yml` - Focused Product Service testing
- `.github/workflows/ci.yml` - Complete CI/CD pipeline

## Troubleshooting

### Tests Failing in CI but Passing Locally

1. Check service versions (MongoDB, Redis, Elasticsearch)
2. Verify environment variables
3. Ensure test database is isolated

### Build Failures

1. Check `package.json` scripts
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles without errors

### Timeout Issues

Services may take time to start. The workflow waits up to 60 seconds for:
- MongoDB to respond to ping
- Redis to respond to ping
- Elasticsearch cluster to be healthy

### Coverage Upload Fails

This is non-blocking. You can:
1. Add `CODECOV_TOKEN` secret
2. Or remove the codecov step from the workflow

## Benefits

✅ **Quality Assurance** - No broken code reaches main branch  
✅ **Confidence** - Every PR is tested automatically  
✅ **Documentation** - CI config documents requirements  
✅ **Speed** - Parallel execution saves time  
✅ **Visibility** - Everyone sees test results on PR  

## Customization

### Add More Tests

Edit `.github/workflows/ci.yml` to add:
- User Service tests
- API Gateway tests
- E2E tests
- Integration tests

### Modify Triggers

Change `on:` section to trigger on:
- Specific branches
- Tags
- Schedules (cron)
- Manual dispatch

### Add Notifications

Add steps to notify:
- Slack
- Discord
- Email
- Teams

---

**Your PRs are now protected! 🛡️**
