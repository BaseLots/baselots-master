# BaseLots Deployment Workflow

## Branch Strategy

- **`main`** → Vercel (baselots-master.vercel.app) - Auto-deploys
- **`production`** → VPS (baselots.com) - Manual deploy

## How It Works

### Making Changes & Testing

1. **Work on `main` branch:**
   ```bash
   git checkout main
   # Make your changes
   git add -A
   git commit -m "your changes"
   git push
   ```

2. **Vercel auto-deploys** within 1-2 minutes
   - Live at: https://baselots-master.vercel.app
   - Test your changes here first

### Deploying to Production (baselots.com)

When you're ready to push tested changes to production:

1. **Merge main into production:**
   ```bash
   git checkout production
   git merge main
   git push
   ```

2. **Deploy to VPS:**
   - Ask Jax: "deploy to VPS" or "push to production"
   - Or run manually: `/Users/baselotsai/.openclaw/workspace/deploy-to-vps.sh`
   - Or use GitHub Actions: https://github.com/BaseLots/baselots-master/actions/workflows/deploy-vps.yml

## Quick Commands

**Test changes:**
```bash
git checkout main
git add -A && git commit -m "test: changes" && git push
# → Vercel auto-deploys
```

**Push to production:**
```bash
git checkout production
git merge main
git push
# Then ask Jax to deploy VPS
```

## Current Deployment Status

- **Vercel (staging)**: Auto-deploys from `main` branch
- **VPS (production)**: Manual deploy from `production` branch
