# DevOps Infrastructure & Deployment Strategy: Clickable Count Cards Enhancement

Taylor here. I've analyzed the project context and existing infrastructure. Since this is an enhancement to an existing Next.js application with Vercel deployment, I'll focus on improving the current CI/CD setup and ensuring robust deployment practices.

## Current Infrastructure Assessment

**Existing Setup:**
- **Platform:** Vercel (indicated by `vercel.json`)
- **Framework:** Next.js with TypeScript
- **Languages:** JavaScript, TypeScript, Go, Python, PHP, Ruby
- **Status:** No CI/CD pipeline, no automated testing

**Infrastructure Gap Analysis:**
- ❌ No CI/CD pipeline
- ❌ No automated testing infrastructure  
- ❌ No deployment validation
- ❌ No monitoring/alerting setup
- ✅ Vercel deployment configuration exists

## Deployment Architecture

### 1. CI/CD Pipeline Configuration

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  # Code Quality & Security Checks
  quality-checks:
    name: Code Quality & Security
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Security audit
        run: npm audit --audit-level=high

      - name: Check for vulnerabilities
        run: npx audit-ci --config audit-ci.json

  # Unit & Integration Tests
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: quality-checks
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:ci

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  # Build & Validate
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: .next/

  # E2E Testing
  e2e-test:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files
          path: .next/

      - name: Start application
        run: |
          npm run start &
          npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # Accessibility Testing
  accessibility:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files
          path: .next/

      - name: Start application
        run: |
          npm run start &
          npx wait-on http://localhost:3000

      - name: Run accessibility tests
        run: npm run test:a11y

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [e2e-test, accessibility]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://archpointlabs-staging.vercel.app
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [e2e-test, accessibility]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://archpointlabs.vercel.app
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '✅ Production deployment successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Enhanced Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/dashboard/(.*)",
      "destination": "/dashboard/$1",
      "permanent": false
    }
  ]
}
```

### 3. Package.json Scripts Enhancement

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "lint:check": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test e2e/accessibility.spec.ts",
    "analyze": "ANALYZE=true next build",
    "pre-commit": "lint-staged",
    "prepare": "husky install"
  }
}
```

## Monitoring & Observability

### 1. Application Performance Monitoring

```typescript
// lib/monitoring/analytics.ts
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  trackMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };
    
    this.metrics.push(metric);
    
    // Send to monitoring service (Vercel Analytics)
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', name, { value, ...metadata });
    }
  }

  trackFilterUsage(filterType: 'card' | 'dropdown', filterValue: string) {
    this.trackMetric('filter_usage', 1, {
      filterType,
      filterValue,
      timestamp: new Date().toISOString()
    });
  }

  trackCardClick(cardType: 'today' | 'thisWeek') {
    this.trackMetric('card_click', 1, {
      cardType,
      timestamp: new Date().toISOString()
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### 2. Error Tracking & Logging

```typescript
// lib/monitoring/errorTracking.ts
interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  props?: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

class ErrorTracker {
  reportError(error: Error, context?: Record<string, any>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      ...context
    };

    if (typeof window !== 'undefined') {
      report.userAgent = window.navigator.userAgent;
      report.url = window.location.href;
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', report);
    }

    // Send to error tracking service
    this.sendToErrorService(report);
  }

  private sendToErrorService(report: ErrorReport) {
    // Integration with error tracking service (Sentry, LogRocket, etc.)
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(err => {
        console.error('Failed to send error report:', err);
      });
    } catch (err) {
      console.error('Error reporting failed:', err);
    }
  }
}

export const errorTracker = new ErrorTracker();
```

### 3. Health Check API

```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database?: boolean;
    external_apis?: boolean;
    memory_usage?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks: {}
    });
  }

  try {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks: {
        memory_usage: memoryUsageMB
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks: {}
    });
  }
}
```

## Security Configuration

### 1. Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'archpointlabs.vercel.app'],
    formats: ['image/webp', 'image/avif']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' vitals.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

### 2. Security Audit Configuration

```json
// audit-ci.json
{
  "moderate": true,
  "allowlist": [],
  "report-type": "full",
  "advisories": [],
  "whitelist": [],
  "path-whitelist": []
}
```

## Development Tools & Quality Gates

### 1. Git Hooks with Husky

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm run lint:check
npm run test:ci --passWithNoTests
```

### 2. Lint Staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### 3. Environment Configuration

```bash
# .env.example
# Application
NEXT_PUBLIC_APP_NAME=ArchPoint Labs
NEXT_PUBLIC_APP_VERSION=1.0.0

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Monitoring
NEXT_PUBLIC_ERROR_TRACKING_DSN=

# Feature Flags
NEXT_PUBLIC_ENABLE_CLICKABLE_CARDS=true

# API Configuration
API_BASE_URL=https://api.archpointlabs.com
```

## Deployment Runbook

### Pre-Deployment Checklist
- [ ] All tests passing in CI/CD pipeline
- [ ] Code coverage meets minimum threshold (80%)
- [ ] Accessibility tests passing
- [ ] Performance benchmarks validated
- [ ] Security scan completed
- [ ] Environment variables configured

### Deployment Steps

#### Staging Deployment
```bash
# 1. Create feature branch
git checkout -b feature/clickable-cards

# 2. Implement changes following implementation plan
# ... development work ...

# 3. Run local tests
npm run test:coverage
npm run test:e2e
npm run lint

# 4. Create pull request to develop
git push origin feature/clickable-cards
# Create PR via GitHub UI

# 5. Automatic staging deployment on merge to develop
```

#### Production Deployment
```bash
# 1. Create release PR from develop to main
# 2. Final review and approval
# 3. Merge triggers automatic production deployment
# 4. Monitor deployment health
```

### Post-Deployment Monitoring

```typescript
// scripts/deployment-monitor.js
const https = require('https');

async function checkDeploymentHealth() {
  const endpoints = [
    'https://archpointlabs.vercel.app/api/health',
    'https://archpointlabs.vercel.app/dashboard'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK`);
      } else {
        console.error(`❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Run health check every 30 seconds for 5 minutes after deployment
const interval = setInterval(checkDeploymentHealth, 30000);
setTimeout(() => clearInterval(interval), 300000);
```

## Backup & Disaster Recovery

### 1. Code Repository Backup
- **Primary:** GitHub repository with branch protection
- **Backup:** Automated daily exports to secure storage
- **Recovery Time:** < 5 minutes (git clone)

### 2. Vercel Project Configuration Backup
```json
// vercel-config-backup.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "envVars": {
    "NODE_ENV": "production"
  }
}
```

### 3. Recovery Procedures

#### Application Recovery (Complete Outage)
1. **Immediate (< 5 minutes)**
   - Check Vercel status dashboard
   - Verify DNS configuration
   - Check recent deployments

2. **Short-term (< 30 minutes)**
   - Rollback to previous deployment via Vercel dashboard
   - Deploy from last known good commit

3. **Long-term (< 2 hours)**
   - Recreate Vercel project from backup configuration
   - Restore environment variables
   - Redeploy from main branch

## Cost Optimization

### Vercel Optimization
- **Function Duration**: Optimize API routes to < 10 seconds
- **Bundle Size**: Monitor and minimize bundle size
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching headers

### Monitoring Costs
```typescript
// lib/monitoring/costTracking.ts
export function trackResourceUsage() {
  if (typeof performance !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    // Track page load metrics
    const metrics = {
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      domLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      pageLoad: navigation.loadEventEnd - navigation.navigationStart
    };

    // Send to analytics for cost analysis
    performanceMonitor.trackMetric('page_performance', 1, metrics);
  }
}
```

## Environment-Specific Configurations

### Development
```bash
# .env.development
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_TELEMETRY_DISABLED=1
```

### Staging
```bash
# .env.staging
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_API_URL=https://archpointlabs-staging.vercel.app/api
```

### Production
```bash
# .env.production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://archpointlabs.vercel.app/api
```

---

This DevOps architecture provides a robust, scalable deployment pipeline for the clickable count cards enhancement while establishing best practices for ongoing development. The infrastructure is cost-effective, leveraging Vercel's strengths while adding comprehensive monitoring and quality gates.

The deployment strategy ensures zero-downtime deployments with automatic rollback capabilities, while the monitoring setup provides real-time visibility into application performance and user interactions.

**Taylor**  
*DevOps Architect, Claude Dev Team*