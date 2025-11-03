# How to Enable Branch Protection with Required Status Checks

## Step-by-Step Guide

### Step 1: Push Your GitHub Actions Workflows

First, you need to commit and push the workflows:

```bash
cd /Users/vasylsavchuk/learning-project

# Add all changes
git add .

# Commit
git commit -m "Add GitHub Actions CI/CD workflows and tests"

# Push to your branch
git push origin create-project
```

### Step 2: Let GitHub Actions Run Once

After pushing, GitHub Actions needs to run at least once for the status checks to be available in settings.

1. Go to your PR: https://github.com/safchug/microservices-learning-project/pull/1
2. Wait for the Actions to start running (you'll see yellow dots/checks)
3. Once they start, the status check names will be registered with GitHub

### Step 3: Enable Branch Protection Rules

Now go to branch protection settings:

#### Option A: Via Repository Settings (Classic UI)

1. Go to: **Settings** → **Branches**
2. Under "Branch protection rules", click **Add rule** (or **Add classic branch protection rule**)
3. Branch name pattern: `master` or `main`
4. Scroll down and check these boxes:

   **Under "Protect matching branches":**
   - ✅ **Require a pull request before merging**
     - Set "Required number of approvals before merging": 1 (optional)
   - ✅ **Require status checks to pass before merging**
     - ⚠️ **This option only appears after status checks have run at least once**
     - After checking this box, search and select:
       - `Product Service Tests`
       - `Lint Check`
       - `Build Services (product-service)`
       - `Build Services (user-service)`
       - `Build Services (api-gateway)`
       - `Build Services (notification-service)`
       - `Docker Compose Validation`
       - `All Checks Passed`
   - ✅ **Require branches to be up to date before merging** (appears under status checks)
   - ✅ **Require conversation resolution before merging** (optional)
   - ✅ **Do not allow bypassing the above settings** (optional but recommended)

5. Click **Create** or **Save changes**

#### Option B: Via Repository Settings (New Rulesets - Recommended)

If you see "Rulesets" instead:

1. Go to: **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset** → **New branch ruleset**
3. Ruleset name: `Protect main branch`
4. Enforcement status: **Active**
5. Target branches:
   - Click **Add target**
   - Select **Include default branch** or **Include by pattern** and enter `master`
6. Under "Rules":
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass**
     - Click **Add checks**
     - Search and add:
       - `All Checks Passed` (this is the most important one!)
       - `Product Service Tests`
       - `Lint Check`
       - etc.
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Block force pushes**
7. Click **Create**

### Step 4: Verify It's Working

1. Go to your PR
2. Try to click the **Merge** button
3. It should be **disabled** or show "Required status checks must pass"
4. Wait for all checks to complete
5. Once all checks are ✅ green, the **Merge** button becomes enabled

## Troubleshooting

### "Require status checks to pass before merging" is not visible

**Cause:** GitHub needs to see at least one status check run before it shows this option.

**Solution:**

1. Push your workflow files first
2. Let GitHub Actions run at least once
3. Then go back to settings - the option will appear

### Status checks don't appear in the list

**Cause:** The check names haven't been registered yet.

**Solution:**

1. Make sure your workflows have run at least once
2. Go to **Actions** tab to verify they ran
3. The status check names will then be available to select

### Using the wrong branch protection UI

GitHub has two interfaces:

- **Classic branch protection rules** (older, simpler)
- **Rulesets** (newer, more flexible)

**Solution:** Try both! The location depends on your GitHub plan and settings.

### Can't find Settings tab

**Cause:** You might not have admin access to the repository.

**Solution:** You need admin or owner permissions to modify branch protection rules.

## Quick Command Reference

```bash
# Check what branch you're on
git branch

# Add all files
git add .

# Commit
git commit -m "Add CI/CD workflows with tests"

# Push
git push origin create-project

# Check Actions status
# Go to: https://github.com/safchug/microservices-learning-project/actions
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Install GitHub CLI (if not installed)
brew install gh

# Login
gh auth login

# Create branch protection rule
gh api repos/safchug/microservices-learning-project/branches/master/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["All Checks Passed","Product Service Tests","Lint Check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## What Happens After Setup

Once configured:

1. ✅ **PR created** → GitHub Actions run automatically
2. 🟡 **Checks running** → Merge button disabled
3. ❌ **Checks failed** → Merge button stays disabled
4. ✅ **All checks pass** → Merge button enabled
5. 🎉 **Can merge!**

## Visual Guide

```
GitHub Repository
  └── Settings (⚙️)
      └── Branches (or Rules → Rulesets)
          └── Add rule / New ruleset
              └── Branch name pattern: master
                  └── ✅ Require status checks to pass ← THIS OPTION
                      └── Search for: "All Checks Passed" ← SELECT THIS
```

## Need More Help?

If you still can't find the option:

1. **Share a screenshot** of your branch protection settings page
2. **Check your GitHub plan** (some features require Team/Enterprise)
3. **Verify you pushed the workflows** (`git push origin create-project`)
4. **Check Actions ran** (go to Actions tab)
5. **Try the GitHub CLI method** (shown above)

---

**The key is: Push workflows → Let them run → Then configure protection!**
