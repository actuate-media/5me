# AI Code Quality Assurance Guide

**Purpose:** Ensure AI-generated code meets Actuate Hub's security, performance, and architectural standards.

**Philosophy:** Trust but verify. AI excels at following patterns but requires human oversight for security, performance, and cross-system consistency.

---

## Table of Contents

1. [Before Every Commit](#before-every-commit-developer-checks)
2. [Before Every PR](#before-every-pr-automated-ci)
3. [Before Deployment](#before-deployment-manual-checklist)
4. [Daily Checks](#daily-checks-5-minutes)
5. [Weekly Audits](#weekly-audits-30-minutes)
6. [Monthly Reviews](#monthly-reviews-2-hours)
7. [Prisma 7 + Postgres Specific Checks](#prisma-7--postgres-specific-checks)
8. [Vercel Deployment Checks](#vercel-deployment-checks)
9. [Next.js 16 App Router Specific Checks](#nextjs-16-app-router-specific-checks)
10. [Tool Setup](#tool-setup)
11. [Common AI Anti-Patterns](#common-ai-anti-patterns)
12. [Quick Reference](#quick-reference)
13. [Success Metrics](#success-metrics)
14. [Troubleshooting Common Issues](#troubleshooting-common-issues)
15. [Escalation Path](#escalation-path)

---

## Before Every Commit (Developer Checks)

**Time:** 30 seconds  
**Frequency:** Every commit  
**Automation:** Pre-commit hook

### Quick Manual Scan

Before committing, visually check the diff for:

```bash
# View your changes
git diff --cached

# Look for these red flags:
```

- [ ] ❌ `console.log()` statements (except in development utilities)
- [ ] ❌ `any` types without a justifying comment
- [ ] ❌ TODO/FIXME without a linked ticket
- [ ] ❌ Hardcoded URLs, API keys, or credentials
- [ ] ❌ Commented-out code blocks
- [ ] ✅ `export const dynamic = 'force-dynamic'` on new API routes

### Pre-Commit Hook (Automated)

```bash
# Install Husky for Git hooks
npm install --save-dev husky lint-staged

# Setup .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run these checks automatically
npx lint-staged
```

**`.lintstagedrc.json`:**
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.prisma": [
    "npx prisma format",
    "npx prisma validate"
  ]
}
```

---

## Before Every PR (Automated CI)

**Time:** 3-5 minutes (automated)  
**Frequency:** Every pull request  
**Automation:** GitHub Actions

### Required Checks (Must Pass)

Create `.github/workflows/ai-quality-gates.yml`:

```yaml
name: AI Code Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      # ===== TIER 1: BLOCKING CHECKS =====
      
      - name: TypeScript Strict Mode
        run: npx tsc --noEmit --strict
      
      - name: Lint Code
        run: npm run lint
      
      - name: Unit Tests
        run: npm test -- --coverage --passWithNoTests
      
      - name: Prisma Schema Validation
        run: |
          npx prisma validate --schema=src/generated/prisma-smtp/schema.prisma
          npx prisma validate --schema=src/generated/prisma-clients/schema.prisma
          npx prisma validate --schema=src/generated/prisma-core/schema.prisma
          npx prisma validate --schema=src/generated/prisma-social/schema.prisma
      
      - name: Database URL Validation
        run: npx tsx scripts/validate-db-urls.ts
      
      - name: Prisma Pattern Detection
        run: npx tsx scripts/check-prisma-patterns.ts
      
      - name: Next.js Pattern Detection
        run: npx tsx scripts/check-nextjs-patterns.ts
      
      - name: Security Audit
        run: npm audit --audit-level=moderate
      
      # ===== TIER 2: ANTI-PATTERN DETECTION =====
      
      - name: Detect Console Logs
        run: |
          echo "Checking for console.log in production code..."
          ! grep -r "console\.log\|console\.debug" src/app src/lib --include="*.ts" --include="*.tsx" || {
            echo "❌ Found console.log statements in production code"
            exit 1
          }
      
      - name: Detect Implicit Any Types
        run: |
          echo "Checking for implicit 'any' types..."
          npx tsc --noEmit --strict 2>&1 | grep -q "implicitly has an 'any' type" && {
            echo "❌ Found implicit 'any' types"
            exit 1
          } || echo "✅ No implicit 'any' types"
      
      - name: Verify API Route Configuration
        run: |
          echo "Checking API routes have 'force-dynamic'..."
          for file in $(find src/app/api -name "route.ts"); do
            if grep -q "export async function" "$file"; then
              if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
                echo "❌ Missing 'force-dynamic' in $file"
                exit 1
              fi
            fi
          done
          echo "✅ All API routes properly configured"
      
      - name: Detect SQL Injection Risks
        run: |
          echo "Checking for unsafe SQL patterns..."
          ! grep -r "\$queryRawUnsafe.*\\\${" src/ --include="*.ts" || {
            echo "❌ Found potential SQL injection risk"
            exit 1
          }
      
      - name: Detect Circular Dependencies
        run: |
          npx madge --circular src/ || {
            echo "❌ Circular dependencies detected"
            exit 1
          }
      
      # ===== TIER 3: WARNINGS (Non-blocking) =====
      
      - name: Check for Large Components
        continue-on-error: true
        run: |
          echo "Checking for components >500 lines..."
          find src/components -name "*.tsx" -exec wc -l {} \; | awk '$1 > 500 {print "⚠️  Large component:", $2, "("$1" lines)"}'
      
      - name: Check for Duplicate Code
        continue-on-error: true
        run: |
          npx jscpd src/ --threshold 10 --format "console"
      
      - name: Unused Exports
        continue-on-error: true
        run: npx ts-prune | head -20

  database-safety:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Check Prisma Migrations
        run: |
          # Ensure migrations are reversible (have both up and down)
          for migration in prisma/migrations/*/migration.sql; do
            if [ -f "$migration" ]; then
              echo "✅ Checking $migration"
              # Add custom checks here if needed
            fi
          done
      
      - name: Check for N+1 Query Patterns
        run: |
          echo "Scanning for potential N+1 queries..."
          # Look for loops with database queries inside
          grep -A 5 "for (" src/**/*.ts | grep -B 3 "await.*find\|await.*create" || echo "✅ No obvious N+1 patterns"
```

### PR Review Checklist

When reviewing AI-generated PRs, check:

**Architecture:**
- [ ] Uses correct DB wrapper (`smtpDb`, `clientsDb`, not raw `PrismaClient`)
- [ ] No cross-database relations (each DB is isolated)
- [ ] Follows domain-driven file structure

**Security:**
- [ ] All user input validated with Zod schemas
- [ ] Tenant isolation enforced (`where: { clientId }`)
- [ ] HMAC validation on webhook endpoints
- [ ] No secrets in code or comments

**Performance:**
- [ ] `findMany()` has `take` limits
- [ ] Appropriate use of `select` vs `include`
- [ ] No queries inside loops (N+1)
- [ ] Indexes exist for filtered columns

**Maintainability:**
- [ ] Component <300 lines
- [ ] Function <50 lines
- [ ] Descriptive variable names (not `data1`, `temp`, etc.)
- [ ] No duplicate logic (DRY principle)

---

## Before Deployment (Manual Checklist)

**Time:** 15-20 minutes  
**Frequency:** Before every production deploy  
**Reference:** See `PRE_DEPLOYMENT_CHECKLIST.md` for full list

### Critical Pre-Deploy Steps

Run this command sequence:

```bash
# 1. Full test suite
npm run test

# 2. Build verification
npm run build

# 3. Security audit
npm audit --audit-level=moderate

# 4. Database migration check (if applicable)
npx prisma migrate status --schema=src/generated/prisma-smtp/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-clients/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-core/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-social/schema.prisma

# 5. Environment variable verification
node scripts/verify-env.js  # Create this script
```

### AI-Specific Pre-Deploy Checks

**Security Deep Dive (5 min):**

```bash
# Check for accidentally committed secrets
git secrets --scan

# Verify no API keys in code
grep -r "sk-\|pk_\|API_KEY.*=" src/ --include="*.ts" --include="*.tsx"

# Check authentication on new routes
git diff main src/app/api/ | grep "export async function" -A 20 | grep "auth()"
```

**Database Safety (3 min):**

```bash
# Verify migrations are applied in correct order
ls -la prisma/migrations/

# Check for dangerous operations
grep -r "DROP TABLE\|TRUNCATE\|DELETE FROM.*WHERE" prisma/migrations/

# Verify all schemas are in sync
npx prisma format --schema=src/generated/prisma-smtp/schema.prisma
npx prisma format --schema=src/generated/prisma-clients/schema.prisma
git diff  # Should show no changes if schemas are formatted
```

**Performance Verification (2 min):**

```bash
# Check bundle size
npm run build
ls -lh .next/static/chunks/ | awk '{if ($5 ~ /M/) print $9, $5}'

# Verify no unoptimized images
find public/ -name "*.jpg" -o -name "*.png" | xargs file | grep -v "optimized"
```

**WordPress Plugin (if changed):**

```powershell
# Always use the package script
.\dist\wordpress-plugins\package-plugin.ps1

# Verify ZIP structure
unzip -l actuate-hub-client-*.zip | head -20
# Should show actuate-hub-client/actuate-hub-client.php at root
```

### Manual Smoke Tests (5 min)

After deploying to staging:

1. **Login Flow:**
   - [ ] Google SSO works
   - [ ] 2FA prompt appears (if enabled)
   - [ ] Session persists after reload

2. **Critical Paths:**
   - [ ] Dashboard loads
   - [ ] Can view SMTP profiles
   - [ ] Can create/edit client
   - [ ] Realtime status updates work (Ably)

3. **API Health:**
   ```bash
   curl https://staging.actuatehub.com/api/health
   # Should return 200 OK
   ```

---

## Daily Checks (5 minutes)

**Time:** 5 minutes  
**Frequency:** Start of each workday  
**Automation:** Optional Slack reminder

### Quick Quality Command

Create a single command for daily checks:

```json
// package.json
{
  "scripts": {
    "quality:daily": "npm run lint && npm run type-check && npm test -- --onlyChanged && npm run prisma:validate-all && npm run verify:db-urls"
  }
}
```

Run every morning:

```bash
npm run quality:daily
```

This runs:
1. ESLint (code style)
2. TypeScript strict mode (type safety)
3. Changed tests (unit tests)
4. All Prisma schema validations
5. Database URL validation

### Manual Scan

Quick review of recent changes:

```bash
# What changed yesterday?
git log --since="yesterday" --oneline --no-merges

# Any new dependencies?
git diff HEAD@{1} package.json

# New environment variables?
git diff HEAD@{1} .env.example

# Any schema changes?
git diff HEAD@{1} src/generated/prisma-*/schema.prisma
```

### Check Production Errors (2 min)

**Vercel Logs:**

```bash
# Check for errors in last 24 hours
vercel logs --since=24h | grep -i "error\|p2022\|timeout"

# Check for Prisma-specific errors
vercel logs --since=24h | grep -i "prisma\|p[0-9][0-9][0-9][0-9]"
```

**Common Issues to Look For:**

| Error Code | Meaning | Action |
|------------|---------|--------|
| `P2022` | Column doesn't exist | Accelerate cache issue - wait or use direct URL |
| `P5011` | Rate limit exceeded | Implement retry logic |
| `P6004` | Query timeout | Optimize query or increase timeout |
| `P6009` | Response too large | Add `take` limit or use pagination |

If using Sentry:

```bash
# Check Sentry for new errors
# Look for:
# - New error types
# - Spike in existing errors
# - Database connection errors
# - Timeout errors
```

---

## Weekly Audits (30 minutes)

**Time:** 30 minutes  
**Frequency:** Every Monday morning  
**Owner:** Tech lead or senior developer

### Architecture Drift Detection

Create `scripts/weekly-audit.ts`:

```typescript
#!/usr/bin/env tsx
import { glob } from 'glob';
import fs from 'fs/promises';
import chalk from 'chalk';

interface Issue {
  file: string;
  line?: number;
  severity: 'error' | 'warning';
  message: string;
}

async function weeklyAudit() {
  const issues: Issue[] = [];

  // 1. Check API routes use domain DB wrappers
  console.log(chalk.blue('\n📊 Checking database access patterns...\n'));
  const apiRoutes = await glob('src/app/api/**/*.ts');
  
  for (const route of apiRoutes) {
    const content = await fs.readFile(route, 'utf-8');
    
    if (content.includes('new PrismaClient()')) {
      issues.push({
        file: route,
        severity: 'error',
        message: 'Using raw PrismaClient instead of domain wrapper (smtpDb, clientsDb, etc.)'
      });
    }
  }

  // 2. Check for tenant isolation
  console.log(chalk.blue('🔒 Checking tenant isolation...\n'));
  const dbQueries = await glob('src/**/*.ts');
  
  for (const file of dbQueries) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/\.findMany\(/.test(line) && !/clientId|configId|userId/.test(line)) {
        // Check next 5 lines for where clause
        const context = lines.slice(index, index + 5).join('\n');
        if (!context.includes('clientId') && !context.includes('configId')) {
          issues.push({
            file,
            line: index + 1,
            severity: 'warning',
            message: 'Possible missing tenant filter in findMany()'
          });
        }
      }
    });
  }

  // 3. Check for performance anti-patterns
  console.log(chalk.blue('⚡ Checking performance patterns...\n'));
  
  for (const file of dbQueries) {
    const content = await fs.readFile(file, 'utf-8');
    
    // Check for queries without limits
    if (/\.findMany\(\{[^}]*\}\)/.test(content)) {
      const matches = content.match(/\.findMany\(\{[^}]*\}\)/g) || [];
      matches.forEach(match => {
        if (!match.includes('take:')) {
          issues.push({
            file,
            severity: 'warning',
            message: 'findMany() without take limit (potential memory issue)'
          });
        }
      });
    }
  }

  // 4. Report findings
  console.log(chalk.yellow('\n📋 Weekly Audit Results\n'));
  console.log(chalk.gray('─'.repeat(80)) + '\n');

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(chalk.red(`❌ ${errors.length} Errors:\n`));
    errors.forEach(issue => {
      console.log(chalk.red(`   ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
      console.log(chalk.gray(`   ${issue.message}\n`));
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  ${warnings.length} Warnings:\n`));
    warnings.forEach(issue => {
      console.log(chalk.yellow(`   ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
      console.log(chalk.gray(`   ${issue.message}\n`));
    });
  }

  if (issues.length === 0) {
    console.log(chalk.green('✅ No issues found! Code quality looks good.\n'));
  }

  console.log(chalk.gray('─'.repeat(80)) + '\n');
  
  return issues;
}

weeklyAudit().catch(console.error);
```

Run it:

```bash
npx tsx scripts/weekly-audit.ts
```

### Security Review

```bash
# 1. Check for new dependencies
npm outdated

# 2. Security audit
npm audit --audit-level=moderate

# 3. Check for exposed secrets in commits
git log --since="1 week ago" -p | grep -i "password\|api.key\|secret"

# 4. Review IAM and auth changes
git log --since="1 week ago" --oneline src/lib/auth/ src/middleware.ts
```

### Performance Metrics

```bash
# 1. Check bundle size trends
npm run build
ls -lh .next/static/chunks/*.js | awk '{print $5, $9}' | sort -h

# 2. Database query performance
npm run check:prisma

# 3. Check Prisma Accelerate metrics
# Visit: https://console.prisma.io
# Review:
# - Cache hit rate (target: >60%)
# - Query latency (p95 <100ms)
# - Connection pool usage (<80%)
# - Monthly query count vs 60K limit

# 4. Vercel function performance
# Visit: https://vercel.com/actuate-media/actuate-hub/analytics
# Check:
# - Function execution time (p95)
# - Cold start frequency
# - Error rate
```

### Prisma Accelerate Weekly Review

**Create `scripts/weekly-prisma-review.sh`:**

```bash
#!/bin/bash
echo "📊 Weekly Prisma Accelerate Review"
echo "===================================="

# 1. Check for P2022 errors in logs
echo -e "\n1️⃣ Checking for cache-related errors..."
CACHE_ERRORS=$(vercel logs --since=7d | grep -c "P2022")
if [ $CACHE_ERRORS -gt 0 ]; then
  echo "⚠️  Found $CACHE_ERRORS P2022 (stale cache) errors this week"
  echo "   Consider using direct URLs for local dev"
else
  echo "✅ No cache errors this week"
fi

# 2. Check for rate limiting
echo -e "\n2️⃣ Checking for rate limit errors..."
RATE_ERRORS=$(vercel logs --since=7d | grep -c "P5011")
if [ $RATE_ERRORS -gt 0 ]; then
  echo "⚠️  Found $RATE_ERRORS rate limit errors"
  echo "   Review query patterns and implement retry logic"
else
  echo "✅ No rate limit errors"
fi

# 3. Check for timeout errors
echo -e "\n3️⃣ Checking for query timeouts..."
TIMEOUT_ERRORS=$(vercel logs --since=7d | grep -c "P6004")
if [ $TIMEOUT_ERRORS -gt 0 ]; then
  echo "⚠️  Found $TIMEOUT_ERRORS timeout errors"
  echo "   Optimize slow queries or increase timeout"
else
  echo "✅ No timeout errors"
fi

# 4. Reminder to check Prisma Cloud dashboard
echo -e "\n4️⃣ Manual checks required:"
echo "   • Visit https://console.prisma.io"
echo "   • Check monthly query count vs 60K limit"
echo "   • Review cache hit rate (target >60%)"
echo "   • Check connection pool usage"
echo ""
```

### Vercel Weekly Checks

```bash
# 1. Check deployment frequency and success rate
vercel list actuate-hub --json | jq '.deployments[] | select(.created > (now - 604800000)) | {created, state, url}'

# 2. Check for failed deployments
vercel list actuate-hub --json | jq '.deployments[] | select(.state == "ERROR")'

# 3. Review function invocations vs limits
# Visit: https://vercel.com/actuate-media/actuate-hub/usage

# 4. Check environment variable drift
vercel env pull .env.vercel.production --environment=production
vercel env pull .env.vercel.preview --environment=preview
diff .env.vercel.production .env.vercel.preview | grep -E "^<|^>" || echo "✅ Prod and Preview env vars in sync"
```

---

## Monthly Reviews (2 hours)

**Time:** 2 hours  
**Frequency:** First Monday of each month  
**Attendees:** Full dev team

### Code Quality Trends

```bash
# 1. Technical debt assessment
npx ts-prune > monthly-unused-exports.txt
npx jscpd src/ --format "json" > monthly-duplicates.json

# 2. Test coverage trends
npm test -- --coverage --coverageReporters=json-summary
# Compare to last month's coverage

# 3. Complexity analysis
npx eslint src/ --format json --max-warnings=0 > monthly-complexity.json
```

### Security Deep Dive

**1. Dependency Audit:**

```bash
# Full dependency tree audit
npm audit --json > monthly-security-audit.json

# Check for unused dependencies
npx depcheck

# Update critical dependencies
npm outdated | grep -E "Major|Minor"
```

**2. Secret Scanning:**

```bash
# Scan entire repository history
git secrets --scan --scan-history

# Check for hardcoded IPs, URLs
grep -r "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" src/ --include="*.ts"
```

**3. Access Control Review:**

- [ ] Review Vercel team members and roles
- [ ] Review Prisma Cloud users
- [ ] Review Google Cloud IAM permissions
- [ ] Rotate HMAC secrets (if needed)
- [ ] Review Ably API keys

### Database Health

```bash
# 1. Check migration history
npx prisma migrate status --schema=src/generated/prisma-smtp/schema.prisma

# 2. Review slow queries (from logs)
# Look for queries >500ms

# 3. Check table sizes
# Run in PostgreSQL:
# SELECT schemaname, tablename, 
#        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
# FROM pg_tables 
# WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
# ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 4. Index usage analysis
# Check which indexes are actually being used
```

### Architecture Review

Review recent AI-generated code for:

**1. Pattern Compliance:**
- [ ] All API routes follow standard structure
- [ ] Components follow React development guidelines
- [ ] Database queries follow Prisma best practices

**2. Documentation Drift:**
- [ ] Update `copilot-instructions.md` with new patterns
- [ ] Document any new architectural decisions
- [ ] Update API documentation

**3. Refactoring Candidates:**
- [ ] Identify duplicate code for extraction
- [ ] Find large components to split
- [ ] Identify over-complicated logic

### Team Retrospective

Discuss:

1. **What AI did well this month?**
   - Which features were generated with minimal changes?
   - Which patterns is AI following correctly?

2. **What AI struggled with?**
   - Which areas required the most manual fixes?
   - What new patterns need to be documented?

3. **Quality Improvements:**
   - New checks to add to CI?
   - New patterns to add to documentation?
   - Tools or processes to improve?

---

## Tool Setup

### Install Required Dependencies

```bash
# Core development dependencies
npm install --save-dev \
  husky \
  lint-staged \
  @types/node \
  tsx \
  madge \
  jscpd \
  ts-prune \
  depcheck \
  chalk \
  glob \
  zod

# Playwright for E2E tests
npm install --save-dev @playwright/test
npx playwright install

# Bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

### Setup Git Hooks

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Create Directory Structure

```bash
# Create scripts directory
mkdir -p scripts

# Make scripts executable
chmod +x scripts/*.sh
```

### Required Scripts

Create these files in the `scripts/` directory:

1. **`verify-env.js`** - Environment variable checker (see Tool Setup section)
2. **`validate-db-urls.ts`** - Database URL validator (see Prisma section)
3. **`weekly-audit.ts`** - Architecture audit (see Weekly Audits section)
4. **`check-prisma-patterns.ts`** - Prisma anti-pattern detection (see Prisma section)
5. **`check-nextjs-patterns.ts`** - Next.js pattern validation (see Next.js section)
6. **`prisma-schema-update.sh`** - Safe schema update workflow (see Prisma section)
7. **`vercel-pre-deploy.sh`** - Vercel deployment validation (see Vercel section)
8. **`weekly-prisma-review.sh`** - Weekly Prisma health check (see Weekly Audits section)
9. **`check-accelerate-limits.ts`** - Accelerate usage monitor (see Prisma section)

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envExample = fs.readFileSync('.env.example', 'utf-8');
const envVars = envExample.match(/^[A-Z_]+=/gm) || [];

console.log('🔍 Checking environment variables...\n');

let missing = [];

envVars.forEach(varLine => {
  const varName = varLine.replace('=', '');
  if (!process.env[varName]) {
    missing.push(varName);
  }
});

if (missing.length > 0) {
  console.error('❌ Missing environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set\n');
}
```

**`package.json` Scripts:**

```json
{
  "scripts": {
    "type-check": "tsc --noEmit --strict",
    "quality:daily": "npm run lint && npm run type-check && npm test -- --onlyChanged",
    "quality:weekly": "tsx scripts/weekly-audit.ts && tsx scripts/check-prisma-patterns.ts",
    "quality:pre-deploy": "npm test && npm run build && npm audit --audit-level=moderate && tsx scripts/check-nextjs-patterns.ts",
    "verify:env": "node scripts/verify-env.js",
    "verify:db-urls": "tsx scripts/validate-db-urls.ts",
    "check:prisma": "tsx scripts/check-prisma-patterns.ts",
    "check:nextjs": "tsx scripts/check-nextjs-patterns.ts",
    "check:vercel": "bash scripts/vercel-pre-deploy.sh",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "analyze": "ANALYZE=true npm run build",
    "prisma:validate-all": "npm run prisma:validate:smtp && npm run prisma:validate:clients && npm run prisma:validate:core && npm run prisma:validate:social",
    "prisma:validate:smtp": "npx prisma validate --schema=src/generated/prisma-smtp/schema.prisma",
    "prisma:validate:clients": "npx prisma validate --schema=src/generated/prisma-clients/schema.prisma",
    "prisma:validate:core": "npx prisma validate --schema=src/generated/prisma-core/schema.prisma",
    "prisma:validate:social": "npx prisma validate --schema=src/generated/prisma-social/schema.prisma"
  }
}
```

---

## Prisma 7 + Postgres Specific Checks

### Understanding Your Database Setup

Your architecture uses:
- **Prisma 7** with multi-database configuration (smtp, clients, core, social)
- **Prisma Postgres** (hosted PostgreSQL) in production
- **Prisma Accelerate** for connection pooling and caching
- **Direct PostgreSQL** connections for local development

### Daily Prisma Checks (2 minutes)

```bash
# 1. Validate all schemas
npx prisma validate --schema=src/generated/prisma-smtp/schema.prisma
npx prisma validate --schema=src/generated/prisma-clients/schema.prisma
npx prisma validate --schema=src/generated/prisma-core/schema.prisma
npx prisma validate --schema=src/generated/prisma-social/schema.prisma

# 2. Check for pending migrations
npx prisma migrate status --schema=src/generated/prisma-smtp/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-clients/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-core/schema.prisma
npx prisma migrate status --schema=src/generated/prisma-social/schema.prisma

# 3. Verify generated clients are up to date
npm run postinstall  # Should run prisma generate for all schemas
```

### Prisma Accelerate Cache Issues (Critical)

**The P2022 Problem:**

When using Prisma Accelerate in production, schema changes can cause `P2022: "column does not exist"` errors due to cached schema. This is your most common Prisma issue.

**Prevention Checklist:**

```bash
# After EVERY schema change, run BOTH commands:
npx prisma db push --schema=src/generated/prisma-smtp/schema.prisma
npx prisma generate --schema=src/generated/prisma-smtp/schema.prisma

# For production deployments:
# 1. Push schema to Prisma Postgres FIRST
# 2. Wait 60 seconds for Accelerate cache to invalidate
# 3. Deploy application code
```

**Create a helper script** (`scripts/prisma-schema-update.sh`):

```bash
#!/bin/bash
# Usage: ./scripts/prisma-schema-update.sh smtp

SCHEMA=$1
SCHEMA_PATH="src/generated/prisma-${SCHEMA}/schema.prisma"

if [ -z "$SCHEMA" ]; then
  echo "Usage: ./scripts/prisma-schema-update.sh [smtp|clients|core|social]"
  exit 1
fi

echo "📊 Updating ${SCHEMA} schema..."

# 1. Format schema
echo "1️⃣ Formatting schema..."
npx prisma format --schema=$SCHEMA_PATH

# 2. Validate schema
echo "2️⃣ Validating schema..."
npx prisma validate --schema=$SCHEMA_PATH

# 3. Push to database (production)
echo "3️⃣ Pushing to database..."
if [ "$VERCEL_ENV" = "production" ]; then
  # Pull production env vars
  npx vercel env pull .env.production.local --environment=production
  npx prisma db push --schema=$SCHEMA_PATH --accept-data-loss
  echo "⏳ Waiting 60s for Accelerate cache invalidation..."
  sleep 60
else
  npx prisma db push --schema=$SCHEMA_PATH
fi

# 4. Generate client
echo "4️⃣ Generating Prisma Client..."
npx prisma generate --schema=$SCHEMA_PATH

echo "✅ ${SCHEMA} schema updated successfully!"
```

### Database Anti-Patterns Detection

**Create `scripts/check-prisma-patterns.ts`:**

```typescript
#!/usr/bin/env tsx
import { glob } from 'glob';
import fs from 'fs/promises';
import chalk from 'chalk';

interface PrismaIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning';
  pattern: string;
  message: string;
}

async function checkPrismaPatterns() {
  const issues: PrismaIssue[] = [];
  const files = await glob('src/**/*.ts');

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Check for unbounded findMany()
      if (/\.findMany\(/.test(line)) {
        const context = lines.slice(index, index + 10).join('\n');
        if (!context.includes('take:') && !file.includes('.test.ts')) {
          issues.push({
            file,
            line: lineNum,
            severity: 'error',
            pattern: 'UNBOUNDED_QUERY',
            message: 'findMany() without take limit - can cause memory issues'
          });
        }
      }

      // 2. Check for missing indexes on filtered columns
      if (/where:\s*\{/.test(line)) {
        // This is a simplification - would need AST parsing for accuracy
        const match = line.match(/(\w+):/);
        if (match && !['id', 'clientId', 'configId', 'userId'].includes(match[1])) {
          issues.push({
            file,
            line: lineNum,
            severity: 'warning',
            pattern: 'MISSING_INDEX',
            message: `Filtering on '${match[1]}' - ensure it has an @@index`
          });
        }
      }

      // 3. Check for N+1 queries (query inside loop)
      if (/for \(|\.forEach\(|\.map\(/.test(line)) {
        const loopContext = lines.slice(index, index + 15).join('\n');
        if (/await.*\.(find|create|update|delete)/.test(loopContext)) {
          issues.push({
            file,
            line: lineNum,
            severity: 'error',
            pattern: 'N_PLUS_ONE',
            message: 'Database query inside loop - N+1 problem'
          });
        }
      }

      // 4. Check for raw PrismaClient instantiation
      if (/new PrismaClient\(\)/.test(line)) {
        issues.push({
          file,
          line: lineNum,
          severity: 'error',
          pattern: 'RAW_PRISMA_CLIENT',
          message: 'Use domain wrapper (smtpDb, clientsDb) instead of new PrismaClient()'
        });
      }

      // 5. Check for problematic PostgreSQL types
      if (/@db\.(Money|Char|VarChar|Timestamp\(0\))/.test(line)) {
        const match = line.match(/@db\.(\w+)/);
        issues.push({
          file,
          line: lineNum,
          severity: 'warning',
          pattern: 'PROBLEMATIC_TYPE',
          message: `Avoid @db.${match?.[1]} - use String, Decimal, or DateTime instead`
        });
      }

      // 6. Check for missing tenant isolation
      if (/\.(findMany|findFirst|update|delete|count)\(/.test(line) && !file.includes('.test.ts')) {
        const context = lines.slice(index, index + 10).join('\n');
        if (!/clientId|configId|userId/.test(context)) {
          issues.push({
            file,
            line: lineNum,
            severity: 'error',
            pattern: 'MISSING_TENANT_FILTER',
            message: 'Query missing tenant isolation (clientId, configId, etc.)'
          });
        }
      }

      // 7. Check for using `include` without `select` on large relations
      if (/include:\s*\{/.test(line)) {
        const context = lines.slice(index, index + 10).join('\n');
        if (context.includes('posts:') || context.includes('clients:')) {
          issues.push({
            file,
            line: lineNum,
            severity: 'warning',
            pattern: 'OVERFETCH',
            message: 'Using include on large relation - consider select for specific fields'
          });
        }
      }
    });
  }

  // Report findings
  console.log(chalk.blue('\n🔍 Prisma Pattern Analysis\n'));
  console.log(chalk.gray('─'.repeat(80)) + '\n');

  const errorsByPattern = new Map<string, PrismaIssue[]>();
  issues.forEach(issue => {
    const existing = errorsByPattern.get(issue.pattern) || [];
    errorsByPattern.set(issue.pattern, [...existing, issue]);
  });

  errorsByPattern.forEach((issuesForPattern, pattern) => {
    const severity = issuesForPattern[0].severity;
    const color = severity === 'error' ? chalk.red : chalk.yellow;
    const icon = severity === 'error' ? '❌' : '⚠️';
    
    console.log(color(`${icon} ${pattern} (${issuesForPattern.length} occurrences):`));
    console.log(chalk.gray(`   ${issuesForPattern[0].message}\n`));
    
    issuesForPattern.slice(0, 5).forEach(issue => {
      console.log(chalk.gray(`   ${issue.file}:${issue.line}`));
    });
    
    if (issuesForPattern.length > 5) {
      console.log(chalk.gray(`   ... and ${issuesForPattern.length - 5} more\n`));
    } else {
      console.log('');
    }
  });

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  console.log(chalk.gray('─'.repeat(80)) + '\n');
  console.log(chalk.yellow(`Summary: ${errors.length} errors, ${warnings.length} warnings\n`));

  if (errors.length > 0) {
    console.log(chalk.red('⚠️  Fix errors before deploying to production\n'));
    process.exit(1);
  }
}

checkPrismaPatterns().catch(console.error);
```

**Add to package.json:**

```json
{
  "scripts": {
    "check:prisma": "tsx scripts/check-prisma-patterns.ts"
  }
}
```

### Schema Migration Checklist

**Before pushing schema changes to production:**

```bash
# 1. Test migration locally
npx prisma migrate dev --name descriptive_name --schema=src/generated/prisma-smtp/schema.prisma

# 2. Review generated SQL
cat prisma/migrations/TIMESTAMP_descriptive_name/migration.sql

# 3. Check for dangerous operations:
grep -E "DROP|TRUNCATE|ALTER.*DROP" prisma/migrations/*/migration.sql

# 4. Verify migration is reversible
# (Manually create a down migration if needed)

# 5. Test on staging with production-like data
vercel --env production-preview

# 6. Push to production (use the helper script)
./scripts/prisma-schema-update.sh smtp
```

### Prisma Accelerate Monitoring

**Check Accelerate performance weekly:**

1. Visit [Prisma Cloud Dashboard](https://console.prisma.io)
2. Review metrics:
   - Cache hit rate (target: >60%)
   - Query latency (target: <100ms p95)
   - Connection pool usage (target: <80%)
   - Failed queries

**Create alert script** (`scripts/check-accelerate-limits.ts`):

```typescript
#!/usr/bin/env tsx
// Check if we're approaching Prisma Accelerate limits

const LIMITS = {
  PRO_CONNECTIONS: 100,
  PRO_RESPONSE_SIZE: 10 * 1024 * 1024, // 10MB
  PRO_QUERY_TIMEOUT: 20000, // 20s
  PRO_MONTHLY_QUERIES: 60000,
  PRO_CACHE_INVALIDATIONS_DAY: 10000
};

async function checkAccelerateLimits() {
  console.log('📊 Checking Prisma Accelerate usage against limits...\n');
  
  // These would need to be fetched from Prisma Cloud API
  // For now, log warnings to check manually
  
  console.log('⚠️  Manual checks required:');
  console.log('1. Visit https://console.prisma.io');
  console.log('2. Check current connection count vs 100 limit');
  console.log('3. Check monthly query count vs 60,000 limit');
  console.log('4. Check cache invalidation count vs 10K/day limit');
  console.log('\nIf approaching limits, consider:');
  console.log('- Optimizing query patterns');
  console.log('- Reducing connection pool size');
  console.log('- Using cache more aggressively');
  console.log('- Upgrading to Business plan\n');
}

checkAccelerateLimits();
```

### Connection String Validation

**Create `scripts/validate-db-urls.ts`:**

```typescript
#!/usr/bin/env tsx
import chalk from 'chalk';

function isAccelerateUrl(url: string): boolean {
  return (
    url.includes('accelerate.prisma-data.net') ||
    url.startsWith('prisma://') ||
    url.startsWith('prisma+postgres://')
  );
}

function isDirectPostgresUrl(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

function validateDatabaseUrls() {
  console.log(chalk.blue('\n🔍 Validating Database Connection Strings\n'));

  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const databases = ['SMTP', 'CLIENTS', 'CORE', 'SOCIAL'];

  databases.forEach(db => {
    const url = process.env[`DATABASE_URL_${db}`];
    
    if (!url) {
      console.log(chalk.red(`❌ DATABASE_URL_${db} not set`));
      return;
    }

    const isAccelerate = isAccelerateUrl(url);
    const isDirect = isDirectPostgresUrl(url);

    if (env === 'production' && !isAccelerate) {
      console.log(chalk.red(`❌ ${db}: Production should use Accelerate URL (prisma://...)`));
      console.log(chalk.gray(`   Current: ${url.substring(0, 30)}...`));
    } else if (env === 'development' && isAccelerate) {
      console.log(chalk.yellow(`⚠️  ${db}: Local dev should use direct PostgreSQL URL`));
      console.log(chalk.gray(`   Using Accelerate locally may cause P2022 errors after schema changes`));
    } else {
      console.log(chalk.green(`✅ ${db}: Correct URL type for ${env}`));
    }
  });

  console.log('');
}

validateDatabaseUrls();
```

---

## Vercel Deployment Checks

### Pre-Deployment Vercel Validation

**Create `scripts/vercel-pre-deploy.sh`:**

```bash
#!/bin/bash
# Run before deploying to Vercel

echo "🚀 Vercel Pre-Deployment Checks"
echo "================================"

# 1. Check environment variables are synced
echo -e "\n1️⃣ Checking environment variables..."
vercel env pull .env.vercel.local --environment=production

# Compare with .env.example
missing_vars=$(comm -23 <(grep "^[A-Z]" .env.example | cut -d= -f1 | sort) <(grep "^[A-Z]" .env.vercel.local | cut -d= -f1 | sort))

if [ -n "$missing_vars" ]; then
  echo "❌ Missing environment variables in Vercel:"
  echo "$missing_vars"
  exit 1
else
  echo "✅ All required environment variables present"
fi

# 2. Check Vercel configuration
echo -e "\n2️⃣ Validating vercel.json..."
if [ ! -f "vercel.json" ]; then
  echo "⚠️  No vercel.json found"
else
  # Validate JSON syntax
  cat vercel.json | jq empty 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ vercel.json is valid JSON"
  else
    echo "❌ vercel.json has syntax errors"
    exit 1
  fi
fi

# 3. Check build output size (estimate)
echo -e "\n3️⃣ Checking build size..."
npm run build
BUILD_SIZE=$(du -sh .next | cut -f1)
echo "Build size: $BUILD_SIZE"

# Warn if build is very large
if [ $(du -s .next | cut -f1) -gt 500000 ]; then
  echo "⚠️  Build is >500MB - may cause deployment issues"
fi

# 4. Verify API routes have proper exports
echo -e "\n4️⃣ Checking API routes..."
for file in $(find src/app/api -name "route.ts"); do
  if grep -q "export async function" "$file"; then
    if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
      echo "❌ Missing 'force-dynamic' in $file"
      exit 1
    fi
  fi
done
echo "✅ All API routes properly configured"

# 5. Check for Edge Runtime compatibility
echo -e "\n5️⃣ Checking Edge Runtime compatibility..."
if grep -r "export const runtime = 'edge'" src/app --include="*.ts" | grep -v "middleware"; then
  echo "⚠️  Found Edge Runtime exports - ensure Prisma is compatible"
  echo "   Edge Runtime cannot use Prisma adapters"
fi

# 6. Verify middleware configuration
echo -e "\n6️⃣ Checking middleware..."
if [ -f "middleware.ts" ]; then
  if grep -q "new PrismaClient" middleware.ts; then
    echo "❌ Middleware uses PrismaClient - incompatible with Edge Runtime"
    exit 1
  fi
  echo "✅ Middleware is Edge-compatible"
fi

echo -e "\n✅ All Vercel pre-deployment checks passed!\n"
```

### Vercel-Specific Issues to Watch

**1. Environment Variable Mismatches:**

```bash
# Check for drift between local and Vercel
vercel env pull .env.vercel.local --environment=production
diff .env.local .env.vercel.local
```

**2. Function Timeout Issues:**

Vercel has different timeout limits:
- **Hobby:** 10s
- **Pro:** 60s (serverless), 300s (Edge)
- **Enterprise:** 300s

```typescript
// In long-running API routes, add timeout handling
export const maxDuration = 60; // Vercel Pro limit

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000); // 55s safety margin
  
  try {
    const result = await longRunningOperation({ signal: controller.signal });
    clearTimeout(timeout);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Operation timed out' },
        { status: 408 }
      );
    }
    throw error;
  }
}
```

**3. Build Cache Issues:**

```bash
# Clear Vercel build cache if builds fail mysteriously
vercel --force
```

**4. Edge Middleware Limitations:**

Your `middleware.ts` should NEVER import:
- Prisma Client
- Node.js built-ins (fs, path, etc.)
- Large dependencies

```typescript
// middleware.ts - GOOD
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/dashboard/:path*',
};

// BAD - will break Edge Runtime
// import { PrismaClient } from '@prisma/client';
// import fs from 'fs';
```

### Vercel Monitoring Integration

**Add to weekly checks:**

```bash
# 1. Check Vercel deployment logs
vercel logs --follow actuate-hub

# 2. Check for errors in the last 24 hours
vercel logs actuate-hub --since 24h | grep -i error

# 3. Monitor Vercel Analytics
# Visit: https://vercel.com/actuate-media/actuate-hub/analytics

# 4. Check function invocations vs limits
# Visit: https://vercel.com/actuate-media/actuate-hub/usage
```

### Vercel Deployment Checklist

**Before deploying to production:**

```bash
# 1. Preview deployment
vercel --preview

# 2. Test preview URL
curl https://actuate-hub-preview-xyz.vercel.app/api/health

# 3. Check preview logs for errors
vercel logs actuate-hub-preview-xyz

# 4. If all good, promote to production
vercel --prod

# 5. Immediate post-deploy health check
curl https://actuatehub.com/api/health
```

---

## Next.js 16 App Router Specific Checks

### Server Component vs Client Component Issues

**Common AI mistakes with App Router:**

```typescript
// ❌ BAD - AI often forgets 'use client'
import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0); // Error: useState in Server Component
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ✅ GOOD
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Create detection script** (`scripts/check-nextjs-patterns.ts`):

```typescript
#!/usr/bin/env tsx
import { glob } from 'glob';
import fs from 'fs/promises';
import chalk from 'chalk';

async function checkNextJsPatterns() {
  const issues: Array<{ file: string; issue: string; severity: 'error' | 'warning' }> = [];
  const files = await glob('src/**/*.{ts,tsx}');

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    
    // Check for hooks without 'use client'
    if (!hasUseClient && file.endsWith('.tsx')) {
      if (/useState|useEffect|useContext|useReducer|useCallback|useMemo/.test(content)) {
        issues.push({
          file,
          issue: 'React hooks used without "use client" directive',
          severity: 'error'
        });
      }
      
      // Check for browser APIs without 'use client'
      if (/window\.|document\.|localStorage|sessionStorage/.test(content)) {
        issues.push({
          file,
          issue: 'Browser APIs used without "use client" directive',
          severity: 'error'
        });
      }
    }

    // Check for async Server Components exporting wrong thing
    if (file.includes('app/') && file.endsWith('page.tsx')) {
      if (/export default function.*\(/.test(content) && !/async/.test(content)) {
        // Page component should usually be async for data fetching
        if (!/use client/.test(content) && /fetch\(|prisma/.test(content)) {
          issues.push({
            file,
            issue: 'Page component with data fetching should be async',
            severity: 'warning'
          });
        }
      }
    }

    // Check for improper API route exports
    if (file.includes('app/api') && file.endsWith('route.ts')) {
      const hasExportedHandler = /export async function (GET|POST|PUT|DELETE|PATCH)/.test(content);
      const hasDynamicExport = /export const dynamic = ['"]force-dynamic['"]/.test(content);
      
      if (hasExportedHandler && !hasDynamicExport) {
        issues.push({
          file,
          issue: 'API route missing "export const dynamic = \'force-dynamic\'"',
          severity: 'error'
        });
      }
    }

    // Check for metadata in wrong place
    if (file.endsWith('.tsx') && hasUseClient) {
      if (/export const metadata/.test(content)) {
        issues.push({
          file,
          issue: 'metadata export in Client Component (should be in Server Component)',
          severity: 'error'
        });
      }
    }

    // Check for improper loading.tsx usage
    if (file.endsWith('loading.tsx')) {
      if (hasUseClient) {
        issues.push({
          file,
          issue: 'loading.tsx should be a Server Component',
          severity: 'warning'
        });
      }
    }

    // Check for improper error.tsx usage
    if (file.endsWith('error.tsx')) {
      if (!hasUseClient) {
        issues.push({
          file,
          issue: 'error.tsx must be a Client Component ("use client")',
          severity: 'error'
        });
      }
    }
  }

  // Report
  console.log(chalk.blue('\n⚛️  Next.js App Router Pattern Analysis\n'));
  console.log(chalk.gray('─'.repeat(80)) + '\n');

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(chalk.red(`❌ ${errors.length} Errors:\n`));
    errors.forEach(({ file, issue }) => {
      console.log(chalk.red(`   ${file}`));
      console.log(chalk.gray(`   ${issue}\n`));
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  ${warnings.length} Warnings:\n`));
    warnings.forEach(({ file, issue }) => {
      console.log(chalk.yellow(`   ${file}`));
      console.log(chalk.gray(`   ${issue}\n`));
    });
  }

  if (issues.length === 0) {
    console.log(chalk.green('✅ No Next.js pattern issues found!\n'));
  }

  console.log(chalk.gray('─'.repeat(80)) + '\n');

  if (errors.length > 0) {
    process.exit(1);
  }
}

checkNextJsPatterns().catch(console.error);
```

### Route Handler Best Practices

**Every API route should follow this pattern:**

```typescript
// src/app/api/example/route.ts
export const dynamic = 'force-dynamic'; // REQUIRED

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { smtpDb } from '@/lib/db/smtp-db';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const validatedData = schema.parse(body);

    // 3. Business logic
    const result = await smtpDb.profile.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    // 4. Return success
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Image Optimization Checks

```bash
# Check for unoptimized images
find public/ -type f \( -name "*.jpg" -o -name "*.png" \) -size +500k

# Should use Next.js Image component
grep -r "<img" src/app src/components --include="*.tsx" | grep -v "next/image"
```

### Build Analysis

```bash
# Analyze bundle size
npm run build

# Check for large chunks (>500KB)
ls -lh .next/static/chunks/ | awk '$5 ~ /[5-9][0-9][0-9]K|[0-9]M/ {print $9, $5}'

# Find what's making chunks large
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

**Add to `package.json`:**

```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "check:nextjs": "tsx scripts/check-nextjs-patterns.ts"
  }
}
```

### Server Actions Security

If using Server Actions (experimental in Next.js 16):

```typescript
// app/actions.ts
'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createProfile(formData: FormData) {
  // ALWAYS check auth in server actions
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const name = formData.get('name') as string;
  if (!name || name.length < 1) {
    throw new Error('Name is required');
  }

  // Do work...
  const result = await db.profile.create({ data: { name } });

  // Revalidate if needed
  revalidatePath('/profiles');

  return result;
}
```

**Security check for Server Actions:**

```bash
# Ensure all Server Actions check auth
grep -A 20 "'use server'" src/app --include="*.ts" | grep -B 15 "export async function" | grep -L "auth()"
```

---

## Common AI Anti-Patterns

### Anti-Pattern Detection Reference

Run these searches regularly to catch AI mistakes:

```bash
# 1. Overly complex nested ternaries
grep -r "? .* ? .* :" src/ --include="*.tsx"

# 2. Magic numbers without explanation
grep -r "[^a-zA-Z][0-9]\{3,\}[^a-zA-Z]" src/ --include="*.ts" | grep -v "test"

# 3. Empty catch blocks (error swallowing)
grep -A 1 "} catch" src/ --include="*.ts" | grep -B 1 "^\s*}\s*$"

# 4. Duplicate imports
grep -r "^import.*from" src/ --include="*.ts" | sort | uniq -d

# 5. Unused function parameters
npx eslint src/ --rule "no-unused-vars: error"

# 6. Missing error handling
grep -r "async function" src/ --include="*.ts" -A 10 | grep -v "try\|catch" | grep "await"

# 7. Hardcoded values that should be constants
grep -r "localhost:3000\|http://\|https://" src/ --include="*.ts" --exclude="*.test.ts"
```

### Known AI Tendencies

**AI often:**
- ✅ Follows established patterns well
- ✅ Writes clean, formatted code
- ✅ Generates comprehensive tests
- ❌ Forgets edge cases in error handling
- ❌ Over-engineers simple solutions
- ❌ Copies patterns without understanding context
- ❌ Misses security implications of code
- ❌ Creates duplicate code instead of extracting

**Watch for:**
- Missing tenant isolation in database queries
- Unvalidated user input
- Missing rate limiting on public endpoints
- Overly permissive CORS settings
- Missing indexes on filtered columns
- N+1 query patterns

---

## Quick Reference

### Daily (5 min)
```bash
npm run quality:daily
# Runs: lint, type-check, tests, prisma validation, db URL validation
```

### Before Every PR (Automated)
```bash
# CI runs automatically, but you can run locally:
npm run lint
npm run type-check
npm test
npm run check:prisma
npm run check:nextjs
```

### Weekly (30 min)
```bash
npm run quality:weekly
npm audit
bash scripts/weekly-prisma-review.sh
git log --since="1 week ago" --oneline

# Manual checks:
# - Prisma Cloud dashboard (https://console.prisma.io)
# - Vercel Analytics (https://vercel.com/actuate-media/actuate-hub/analytics)
```

### Before Deployment (15 min)
```bash
npm run quality:pre-deploy
npm run verify:env
npm run check:vercel

# For schema changes:
./scripts/prisma-schema-update.sh [smtp|clients|core|social]

# Manual smoke tests on staging
vercel --preview
curl https://preview-url/api/health
```

### Monthly (2 hours)
```bash
npm outdated
npx depcheck
npm test -- --coverage
bash scripts/weekly-prisma-review.sh

# Manual checks:
# - Prisma Accelerate usage vs limits
# - Vercel function invocations vs limits
# - Database table sizes
# - Team retrospective
```

### Emergency Debugging

**Prisma Issues:**
```bash
# P2022 (column doesn't exist)
npm run verify:db-urls  # Check if using Accelerate locally

# Connection pool exhausted
# Check Prisma Cloud dashboard for connection count

# Slow queries
vercel logs --since=1h | grep "duration"
```

**Vercel Issues:**
```bash
# Function timeout
vercel logs --since=1h | grep "FUNCTION_INVOCATION_TIMEOUT"

# Build failures
vercel --force  # Clear cache and rebuild

# Environment variables
vercel env pull .env.vercel.local --environment=production
```

**Next.js Issues:**
```bash
# Server Component errors
npm run check:nextjs

# Bundle too large
npm run analyze
```

---

## Success Metrics

Track these metrics to measure AI code quality improvement:

| Metric | Target | Review Frequency |
|--------|--------|------------------|
| Test Coverage | >80% | Weekly |
| TypeScript Strict Compliance | 100% | Daily |
| Security Audit Warnings | 0 critical | Weekly |
| Bundle Size | <500KB main chunk | Weekly |
| Failed Deployments | <5% | Monthly |
| Production Errors | <10/day | Daily |
| Code Review Iterations | <2 avg | Weekly |
| Tech Debt Issues | Trending down | Monthly |

### Prisma-Specific Metrics

| Metric | Target | Review Frequency |
|--------|--------|------------------|
| Prisma Accelerate Cache Hit Rate | >60% | Weekly |
| Query Latency (p95) | <100ms | Weekly |
| Connection Pool Usage | <80% | Daily |
| Monthly Query Count | <60,000 (Pro limit) | Weekly |
| P2022 Errors (stale cache) | 0 | Daily |
| P5011 Errors (rate limit) | 0 | Daily |
| Queries without `take` limit | 0 | Weekly |
| N+1 Query Patterns | 0 | Weekly |

### Vercel-Specific Metrics

| Metric | Target | Review Frequency |
|--------|--------|------------------|
| Function Execution Time (p95) | <5s | Weekly |
| Cold Start Frequency | <10% | Weekly |
| Build Time | <3min | Weekly |
| Failed Deployments | 0 | Weekly |
| Function Invocations | Within plan limits | Monthly |
| Edge Function Compatibility | 100% | Monthly |

---

## Troubleshooting Common Issues

### Prisma Issues

#### P2022: Column does not exist (Cache Issue)

**Symptoms:**
- Query fails with "column X does not exist"
- Schema shows the column exists
- Only happens with Prisma Accelerate URLs

**Solution:**
```bash
# Option 1: Use direct PostgreSQL URL for local development
DATABASE_URL_SMTP="postgresql://user:pass@localhost:5432/db"

# Option 2: Wait for Accelerate cache to refresh (60 seconds)
sleep 60
npm run dev

# Option 3: Force schema push
npx prisma db push --schema=src/generated/prisma-smtp/schema.prisma --accept-data-loss
npx prisma generate --schema=src/generated/prisma-smtp/schema.prisma
```

**Prevention:**
- Use direct PostgreSQL URLs in local development
- Always run both `db push` AND `generate` after schema changes
- Wait 60s after production schema changes before deploying code

#### P5011: Rate Limit Exceeded

**Symptoms:**
- Queries fail with "Too many requests"
- Happens during high traffic

**Solution:**
```typescript
// Implement retry with exponential backoff
async function queryWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 'P5011' && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Prevention:**
- Use Prisma Accelerate caching (`cacheStrategy: { ttl: 60 }`)
- Optimize query patterns to reduce total query count
- Consider upgrading to Business plan (1000 connections vs 100)

#### P6004: Query Timeout

**Symptoms:**
- Query takes longer than 20s (Pro plan limit)
- Complex queries with multiple JOINs

**Solution:**
```typescript
// Break into smaller queries
const users = await prisma.user.findMany({ take: 100 });
const postIds = users.flatMap(u => u.postIds);
const posts = await prisma.post.findMany({
  where: { id: { in: postIds } }
});

// Or optimize with indexes
// Add @@index([fieldName]) to schema
```

**Prevention:**
- Always use `take` limits
- Add indexes to filtered columns
- Avoid N+1 patterns
- Use `select` instead of fetching all columns

#### Connection Pool Exhausted

**Symptoms:**
- Errors about "Can't reach database server"
- Happens during traffic spikes

**Solution:**
```bash
# Check current connection count in Prisma Cloud dashboard
# Reduce per-instance connections in DATABASE_URL:
DATABASE_URL="...?connection_limit=2&pool_timeout=20"

# Or use Cloud SQL Managed Connection Pooling (port 6432)
```

**Prevention:**
- Use Prisma Accelerate for automatic pooling
- Set appropriate `connection_limit` in URL
- Use singleton pattern for Prisma Client

### Vercel Issues

#### Function Timeout

**Symptoms:**
- 504 Gateway Timeout
- Functions exceed 60s limit (Pro plan)

**Solution:**
```typescript
// Add timeout handling
export const maxDuration = 60;

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  
  try {
    const result = await longOperation({ signal: controller.signal });
    clearTimeout(timeout);
    return Response.json({ success: true, result });
  } catch (error) {
    if (error.name === 'AbortError') {
      return Response.json({ success: false, message: 'Timeout' }, { status: 408 });
    }
    throw error;
  }
}
```

**Prevention:**
- Break long operations into smaller chunks
- Use background jobs for processing >30s
- Consider Cloud Run for longer timeouts

#### Build Failures

**Symptoms:**
- Build fails with "ENOENT" or dependency errors
- Works locally but fails in Vercel

**Solution:**
```bash
# Clear build cache
vercel --force

# Check for platform-specific dependencies
npm ls | grep "fsevents\|node-gyp"

# Ensure all dependencies in package.json
npm ci  # Clean install
```

**Prevention:**
- Don't use devDependencies for runtime code
- Test builds locally with `npm run build`
- Keep dependencies up to date

#### Environment Variable Issues

**Symptoms:**
- "Required env var not set" in production
- Works in preview but not production

**Solution:**
```bash
# Pull and compare environments
vercel env pull .env.vercel.production --environment=production
vercel env pull .env.vercel.preview --environment=preview
diff .env.vercel.production .env.vercel.preview

# Add missing variables
vercel env add DATABASE_URL_SMTP production
```

**Prevention:**
- Use `scripts/verify-env.js` before deployment
- Keep `.env.example` up to date
- Document all required env vars

#### Edge Middleware Errors

**Symptoms:**
- "Dynamic Code Evaluation not allowed" in middleware
- Prisma errors in middleware

**Solution:**
```typescript
// middleware.ts - Use separate auth config
import { auth } from '@/lib/auth/config.edge';  // Edge-compatible config

// NEVER in middleware:
// import { PrismaClient } from '@prisma/client';  // ❌
// import fs from 'fs';  // ❌
```

**Prevention:**
- Keep middleware minimal and Edge-compatible
- Use separate config for Edge vs Node.js runtime
- Test middleware with `vercel dev`

### Next.js Issues

#### "use client" Directive Missing

**Symptoms:**
- "You're importing a component that needs useState..."
- Hooks errors in Server Components

**Solution:**
```typescript
// Add to top of file
'use client';

import { useState } from 'react';
```

**Prevention:**
- Run `npm run check:nextjs` regularly
- Use ESLint rule to catch this

#### API Routes Not Responding

**Symptoms:**
- 404 on API routes
- Routes work in dev but not production

**Solution:**
```bash
# Check route.ts file structure
# Must be: app/api/[route]/route.ts
# NOT: app/api/[route].ts

# Check exports
export async function GET(request: NextRequest) { }  # ✅
export function handler(req, res) { }  # ❌ Wrong pattern
```

**Prevention:**
- Follow App Router conventions strictly
- Every API route needs `export const dynamic = 'force-dynamic'`

#### Metadata in Client Components

**Symptoms:**
- Build error "Metadata cannot be used in Client Components"

**Solution:**
```typescript
// Remove from Client Component:
// export const metadata = { ... };  // ❌

// Move to parent Server Component or layout.tsx
```

**Prevention:**
- Run `npm run check:nextjs`
- Only use metadata in Server Components

---

## Escalation Path

**If checks fail:**

1. **CI Failures** → Fix immediately before merge
2. **Security Issues** → Stop deployment, fix, security review
3. **Performance Regressions** → Investigate, optimize, or revert
4. **Architecture Violations** → Refactor before merge

**Critical Issues:**
- Security vulnerability → Immediate patch + post-mortem
- Data breach → Follow incident response plan
- Production outage → Rollback + root cause analysis

---

*Last Updated: December 2024*  
*Version: 1.0*
