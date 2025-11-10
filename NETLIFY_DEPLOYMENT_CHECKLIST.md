# Netlify Deployment Checklist

## Pre-Deployment Setup

### Netlify Account & Site
- [ ] Create Netlify account (if not already done)
- [ ] Create new site from Git or link existing site
- [ ] Note down Site ID and save for CI/CD

### Repository Setup
- [ ] Push latest code to GitHub
- [ ] Verify all files are committed
- [ ] Ensure `.gitignore` excludes build artifacts

### Environment Variables
Configure in Netlify Dashboard (**Site settings > Environment variables**):

#### Required Public Variables
- [ ] `NEXT_PUBLIC_SITE_URL` (e.g., https://your-app.netlify.app)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Your Supabase project URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anonymous key)
- [ ] `NEXT_PUBLIC_BACKEND_URL` (Backend API URL)

#### Required Private Variables
- [ ] `SITE_SUPABASE_URL` (Same as public, for server functions)
- [ ] `SITE_SUPABASE_SECRET_KEY` (Supabase service role key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase service role key)
- [ ] `ONBOARDING_API_TOKEN` (API token for onboarding)
- [ ] `OPENAI_API_KEY` (OpenAI API key if using AI features)

#### Optional Variables
- [ ] `APP_ENABLE_CSP=1` (Content Security Policy)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (Sentry error tracking)
- [ ] `NEXT_TELEMETRY_DISABLED=1` (Disable Next.js telemetry)

### Supabase Setup
- [ ] Supabase project created and configured
- [ ] Database migrations run
- [ ] Edge Functions deployed (if any)
- [ ] Authentication configured
- [ ] Row Level Security (RLS) policies set up

## Netlify Configuration

### Build Settings
Configure in Netlify Dashboard (**Site settings > Build & deploy**):

- [ ] **Build command**: `npm run build:netlify`
- [ ] **Publish directory**: `.next`
- [ ] **Functions directory**: `netlify/functions`
- [ ] **Node version**: Set to `20` in netlify.toml (already configured)

### Deploy Settings
- [ ] Production branch: `main`
- [ ] Deploy previews: Enabled for pull requests
- [ ] Branch deploys: Enabled for `develop` branch (optional)

## CI/CD Setup

### GitHub Secrets
Add to GitHub repository secrets (**Settings > Secrets and variables > Actions**):

- [ ] `NETLIFY_AUTH_TOKEN` (Get from Netlify: User settings > Applications)
- [ ] `NETLIFY_SITE_ID` (From Netlify site settings)
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SITE_SUPABASE_URL`
- [ ] `SITE_SUPABASE_SECRET_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Workflow Verification
- [ ] `.github/workflows/netlify-deploy.yml` exists
- [ ] Workflow has correct branch triggers
- [ ] All required secrets referenced in workflow

## Local Testing

### Development Environment
- [ ] Clone repository: `git clone https://github.com/ikanisa/abareyo.git`
- [ ] Install dependencies: `npm ci`
- [ ] Copy environment template: `cp .env.example .env.local`
- [ ] Fill in `.env.local` with local values
- [ ] Run dev server: `npm run dev`
- [ ] Verify app loads at http://localhost:3000

### Netlify CLI Testing
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Link to site: `netlify link`
- [ ] Test locally: `netlify dev`
- [ ] Verify functions work: http://localhost:8888/.netlify/functions/api-handler/health

### Build Testing
- [ ] Run build: `npm run build:netlify`
- [ ] Verify no build errors
- [ ] Check `.next` directory created
- [ ] Run production server: `npm start`
- [ ] Test in browser

## Deployment

### Initial Deployment
- [ ] Push code to main branch
- [ ] Monitor GitHub Actions workflow
- [ ] Check Netlify deploy logs
- [ ] Verify deploy completes successfully
- [ ] Note deploy URL

### Post-Deployment Verification
- [ ] Visit deployed site URL
- [ ] Test main navigation
- [ ] Verify PWA manifest loads: `https://your-site.netlify.app/manifest.json`
- [ ] Check service worker registration in DevTools
- [ ] Test API endpoints: `/.netlify/functions/api-handler/health`
- [ ] Verify Supabase connection works
- [ ] Test authentication flow
- [ ] Check responsive design on mobile

### PWA Testing
- [ ] Open site in Chrome/Edge
- [ ] Check "Install app" prompt appears
- [ ] Install PWA to device
- [ ] Test PWA launches correctly
- [ ] Test offline mode (disable network)
- [ ] Verify offline page loads
- [ ] Test service worker caching

## Android APK Build

### Prerequisites
- [ ] Android Studio installed (for local builds)
- [ ] Java 17 installed
- [ ] Android SDK configured

### CI/CD APK Build
- [ ] Verify APK job runs on main branch
- [ ] Check GitHub Actions artifacts
- [ ] Download APK artifact
- [ ] Test APK on Android device

### Local APK Build (Optional)
- [ ] Mobile builds are not produced from this repo; skip the legacy APK step.
- [ ] Check APK location: `android/app/build/outputs/apk/release/`
- [ ] Test APK installation on device
- [ ] Verify app functionality

## Monitoring & Observability

### Netlify Dashboard
- [ ] Review deploy logs
- [ ] Check function logs
- [ ] Monitor bandwidth usage
- [ ] Review analytics

### Error Tracking
- [ ] Sentry configured (if using)
- [ ] Test error reporting
- [ ] Set up alerts

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify image optimization
- [ ] Test loading times

## Security

### Security Headers
- [ ] Verify security headers in `netlify.toml`
- [ ] Test CSP if enabled
- [ ] Check HTTPS redirect works
- [ ] Verify no mixed content warnings

### Environment Security
- [ ] No secrets committed to repository
- [ ] All sensitive data in environment variables
- [ ] Service role keys properly protected
- [ ] API tokens secured

## Documentation

### Team Documentation
- [ ] `DEPLOYMENT_GUIDE.md` reviewed and up-to-date
- [ ] `CODE_REVIEW_CHECKLIST.md` completed
- [ ] Team members briefed on new deployment process
- [ ] Runbooks updated for Netlify

### Knowledge Transfer
- [ ] Document Netlify dashboard access
- [ ] Share deployment procedures
- [ ] Update oncall/support documentation
- [ ] Create troubleshooting guide

## Rollback Plan

### Preparation
- [ ] Document current stable deployment
- [ ] Note stable commit SHA
- [ ] Keep previous deploy live (Netlify keeps history)

### Rollback Procedure
If deployment fails:
1. [ ] Go to Netlify dashboard > Deploys
2. [ ] Find last successful deploy
3. [ ] Click "Publish deploy"
4. [ ] Verify rollback successful
5. [ ] Investigate and fix issues
6. [ ] Redeploy when ready

## Post-Launch

### Monitoring (First 24 Hours)
- [ ] Monitor error rates
- [ ] Check function execution logs
- [ ] Review user feedback
- [ ] Watch performance metrics
- [ ] Verify all features working

### Optimization
- [ ] Review bundle size
- [ ] Optimize images if needed
- [ ] Fine-tune caching strategies
- [ ] Update service worker as needed

### Documentation Updates
- [ ] Document any issues encountered
- [ ] Update troubleshooting guide
- [ ] Note performance improvements
- [ ] Update team wiki/docs

## Success Criteria

Deployment is considered successful when:
- [ ] Site loads without errors
- [ ] All pages render correctly
- [ ] PWA installs and works offline
- [ ] API functions respond correctly
- [ ] Authentication works
- [ ] Mobile responsiveness verified
- [ ] Performance meets targets (Lighthouse score > 90)
- [ ] No critical errors in logs
- [ ] APK builds successfully (if applicable)
- [ ] Team can access and monitor site

## Support & Escalation

### Primary Contacts
- DevOps Team: [Contact details]
- Netlify Support: https://answers.netlify.com
- Supabase Support: https://supabase.com/support

### Emergency Rollback
If critical issues occur:
1. Immediately rollback via Netlify dashboard
2. Notify team in #incidents channel
3. Document the issue
4. Create fix branch
5. Test thoroughly before redeploying

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Deploy URL**: _______________
**Commit SHA**: _______________
**Notes**: _______________
