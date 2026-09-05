# 🔒 SENSITIVE_FILES - DO NOT COMMIT TO GIT

This folder contains sensitive files that should **NEVER** be committed to the public GitHub repository.

## 📂 Contents

- `.env` — Environment variables with secrets, local config
- `.env.local` — Local development overrides  
- `.env.production` — Production configuration (if needed)
- Any API keys, credentials, tokens, or secrets
- Local database files (if any)
- Private logs with sensitive data

---

## 🚀 Setup Instructions

### 1. Copy the template
```bash
cp .env.example .env
```

### 2. Fill in your local values
Edit `.env` with your actual configuration:
- Local ports (if different from defaults)
- Database credentials (if using)
- API keys (if any external services)
- Local machine-specific paths

### 3. Verify .gitignore is working
```bash
git check-ignore SENSITIVE_FILES/.env
# Should output: SENSITIVE_FILES/.env

git status
# Should NOT show SENSITIVE_FILES/.env as untracked
```

### 4. Load environment variables

**Option A: Manual export**
```bash
# Backend
cd backend
export $(cat ../SENSITIVE_FILES/.env | xargs)
npm start

# Frontend  
cd frontend
export $(cat ../SENSITIVE_FILES/.env | xargs)
npm run dev
```

**Option B: Use dotenv-cli**
```bash
npm install -g dotenv-cli

# Backend
cd backend
dotenv -e ../SENSITIVE_FILES/.env npm start

# Frontend
cd frontend
dotenv -e ../SENSITIVE_FILES/.env npm run dev
```

**Option C: Use direnv (auto-loads on cd)**
```bash
# Install direnv first
brew install direnv  # macOS
# or sudo apt install direnv  # Linux

# Add to ~/.bashrc or ~/.zshrc
eval "$(direnv hook bash)"  # or zsh

# Create .envrc in project root
echo 'dotenv SENSITIVE_FILES/.env' > .envrc
direnv allow .
```

---

## ⚠️ Before Pushing to GitHub

### Pre-Push Checklist

1. **Verify NO .env files are staged:**
   ```bash
   git status | grep -i "\.env"
   # Should return nothing
   ```

2. **Check SENSITIVE_FILES is ignored:**
   ```bash
   git check-ignore SENSITIVE_FILES/.env
   # Should return: SENSITIVE_FILES/.env
   ```

3. **Verify only safe files in SENSITIVE_FILES are tracked:**
   ```bash
   git ls-files SENSITIVE_FILES/
   # Should show only: .env.example and README.md
   ```

4. **Check for accidentally committed secrets:**
   ```bash
   git log --all --full-history --source -- "**/.env"
   # Should be empty
   ```

---

## 🚀 For Deployment

### Production Environment

**Do NOT copy .env file to production servers.**

Instead, set environment variables directly in:

### Option 1: Docker
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      BACKEND_PORT: ${BACKEND_PORT}
      ML_TRAINING_SAMPLES: ${ML_TRAINING_SAMPLES}
      # ... etc
```

### Option 2: Kubernetes
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: neuralflow-secrets
type: Opaque
data:
  backend-port: MzAwMA==  # base64 encoded
```

### Option 3: Cloud Provider Secrets
- **AWS**: AWS Secrets Manager
- **GCP**: Secret Manager
- **Azure**: Key Vault
- **Heroku**: Config Vars
- **Vercel**: Environment Variables

### Option 4: CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
env:
  BACKEND_PORT: ${{ secrets.BACKEND_PORT }}
  ML_TRAINING_SAMPLES: ${{ secrets.ML_TRAINING_SAMPLES }}
```

---

## 📝 Files in This Folder

### ✅ Tracked (committed to git)
- ✅ `.env.example` — Template with all required variables
- ✅ `README.md` — This file

### ❌ NOT Tracked (ignored by git)
- ❌ `.env` — Actual environment variables
- ❌ `.env.local` — Local overrides
- ❌ `.env.production` — Production config
- ❌ Any API keys, tokens, or secrets
- ❌ Private logs or data files

---

## 🔐 Security Best Practices

### Do's ✅
- ✅ Use `.env.example` to document required variables
- ✅ Keep `.env` in `.gitignore`
- ✅ Use different values for dev/staging/prod
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use strong passwords/tokens
- ✅ Limit access to production secrets
- ✅ Use cloud provider secret managers in production

### Don'ts ❌
- ❌ Never commit `.env` files
- ❌ Never share `.env` contents in Slack/Discord/email
- ❌ Never hardcode secrets in code
- ❌ Never use same secrets for dev and prod
- ❌ Never commit API keys (even accidentally)
- ❌ Never push secrets to public repos
- ❌ Never store secrets in version control

---

## 🆘 If You Accidentally Commit Secrets

### Immediate Actions

1. **Rotate the compromised secrets immediately**
   - Change passwords
   - Regenerate API keys
   - Revoke tokens

2. **Remove from git history**
   ```bash
   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch SENSITIVE_FILES/.env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (⚠️ dangerous - coordinate with team)
   git push origin --force --all
   ```

3. **Use BFG Repo-Cleaner (easier method)**
   ```bash
   # Download BFG
   brew install bfg  # macOS
   
   # Clone fresh copy
   git clone --mirror git@github.com:user/repo.git
   
   # Remove .env from history
   bfg --delete-files .env repo.git
   
   # Clean up
   cd repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Push
   git push
   ```

4. **Scan with tools**
   ```bash
   # Install gitleaks
   brew install gitleaks
   
   # Scan repository
   gitleaks detect --source . --verbose
   ```

---

## 🧪 Testing .gitignore

```bash
# Create a test .env file
echo "TEST_SECRET=abc123" > SENSITIVE_FILES/.env

# Check git status
git status
# Should NOT show SENSITIVE_FILES/.env

# Verify it's ignored
git check-ignore -v SENSITIVE_FILES/.env
# Should show: .gitignore:2:SENSITIVE_FILES/.env

# Clean up test
rm SENSITIVE_FILES/.env
```

---

## ❓ FAQ

### Q: Why not just use environment variables directly?
**A:** `.env` files are convenient for local development. For production, always use cloud secrets managers.

### Q: Can I commit `.env.example`?
**A:** Yes! `.env.example` should be committed as a template (with no real secrets).

### Q: What if team members need different port numbers?
**A:** Use `.env.local` (also gitignored) for personal overrides.

### Q: How do I share secrets with team members?
**A:** Use a secure password manager (1Password, LastPass, Bitwarden) or secret sharing service.

### Q: What's the difference between `.env` and `.env.local`?
**A:** `.env` is your base config. `.env.local` overrides specific values for your machine.

---

## 📞 Questions?

If you're unsure whether a file should go here, ask yourself:

> **"Would I be comfortable if this file was public on GitHub?"**

- If **NO** → Put it in `SENSITIVE_FILES/`
- If **YES** → It can go in the repo

When in doubt, **don't commit it.**

---

*Keep secrets secret. Trust through transparency, security through isolation.*
