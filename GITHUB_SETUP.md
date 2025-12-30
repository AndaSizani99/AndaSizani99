# GitHub Repository Setup Instructions

## Prerequisites
1. Install Git from https://git-scm.com/download/win
2. Create a GitHub account at https://github.com (if you don't have one)
3. Create a new repository on GitHub (don't initialize it with a README)

## Steps to Push to GitHub

1. **Initialize Git repository** (if not already initialized):
   ```bash
   git init
   ```

2. **Add all files to staging**:
   ```bash
   git add .
   ```

3. **Make your first commit**:
   ```bash
   git commit -m "Initial commit: MT5 EA Dashboard"
   ```

4. **Add your GitHub repository as remote** (replace YOUR_USERNAME and YOUR_REPO_NAME):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

5. **Rename the default branch to main** (if needed):
   ```bash
   git branch -M main
   ```

6. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

## If you need to authenticate:
- GitHub now requires personal access tokens instead of passwords
- Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
- Create a new token with `repo` permissions
- Use the token as your password when pushing



