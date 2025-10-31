#!/usr/bin/env node
/**
 * Deployment Readiness Validation Script
 * 
 * Validates that all prerequisites are met before deployment.
 * Run this script to ensure your environment is ready for production deployment.
 * 
 * Usage:
 *   node scripts/validate-deployment-readiness.mjs [--check-k8s] [--check-services]
 * 
 * Options:
 *   --check-k8s       Also validate Kubernetes cluster access and configuration
 *   --check-services  Validate external service connectivity (database, redis, etc.)
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(rootDir);

// Parse command line arguments
const args = process.argv.slice(2);
const checkK8s = args.includes('--check-k8s');
const checkServices = args.includes('--check-services');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

/**
 * Run a command and return output
 */
function run(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options,
    });
  } catch (error) {
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

function extractCommandErrorDetails(error) {
  if (!error || typeof error !== 'object') {
    return 'Unknown error';
  }

  const stderr = typeof error.stderr === 'string' ? error.stderr : error.stderr?.toString?.();
  if (stderr && stderr.trim()) {
    return stderr.trim().split('\n')[0];
  }

  if (typeof error.status === 'number') {
    return `Exited with status ${error.status}`;
  }

  if (error.signal) {
    return `Terminated via signal ${error.signal}`;
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return 'Unknown error';
}

/**
 * Log a check result
 */
function logCheck(passed, message, details = '') {
  totalChecks++;
  const symbol = passed === 'warning' ? symbols.warning : passed ? symbols.success : symbols.error;
  const color = passed === 'warning' ? colors.yellow : passed ? colors.green : colors.red;
  
  if (passed === 'warning') {
    warningChecks++;
  } else if (passed) {
    passedChecks++;
  } else {
    failedChecks++;
  }
  
  console.log(`${color}${symbol}${colors.reset} ${message}`);
  if (details) {
    console.log(`  ${colors.cyan}→${colors.reset} ${details}`);
  }
}

/**
 * Print section header
 */
function printSection(title) {
  console.log(`\n${colors.bright}${colors.blue}▸ ${title}${colors.reset}`);
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  printSection('Required Files');
  
  const requiredFiles = [
    { path: 'package.json', desc: 'Package manifest' },
    { path: 'next.config.mjs', desc: 'Next.js configuration' },
    { path: 'tsconfig.json', desc: 'TypeScript configuration' },
    { path: 'Dockerfile', desc: 'Frontend Docker configuration' },
    { path: 'backend/Dockerfile', desc: 'Backend Docker configuration' },
    { path: 'k8s/namespace.yaml', desc: 'K8s namespace manifest' },
    { path: 'k8s/backend-deployment.yaml', desc: 'Backend deployment manifest' },
    { path: 'k8s/frontend-deployment.yaml', desc: 'Frontend deployment manifest' },
    { path: 'k8s/ingress.yaml', desc: 'Ingress manifest' },
  ];
  
  for (const file of requiredFiles) {
    const exists = existsSync(path.join(rootDir, file.path));
    logCheck(exists, file.desc, file.path);
  }
}

/**
 * Check Node.js and npm versions
 */
function checkNodeVersion() {
  printSection('Runtime Versions');
  
  try {
    const nodeVersion = process.version;
    const nodeVersionMatch = nodeVersion.match(/v(\d+)\./);
    const nodeMajor = nodeVersionMatch ? parseInt(nodeVersionMatch[1]) : 0;
    
    logCheck(
      nodeMajor >= 20,
      `Node.js version`,
      nodeMajor >= 20 ? `${nodeVersion} (OK)` : `${nodeVersion} (requires v20+)`
    );
    
    const npmVersion = run('npm --version', { silent: true })?.trim();
    logCheck(true, 'npm version', npmVersion);
  } catch (error) {
    logCheck(false, 'Failed to check Node.js version', error.message);
  }
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  printSection('Dependencies');
  
  const nodeModulesExists = existsSync(path.join(rootDir, 'node_modules'));
  logCheck(
    nodeModulesExists,
    'Dependencies installed',
    nodeModulesExists ? 'node_modules exists' : 'Run: npm ci'
  );
  
  if (nodeModulesExists) {
    try {
      run('npm ls --depth=0', { silent: true, throwOnError: false });
      logCheck(true, 'Dependency tree valid');
    } catch (error) {
      logCheck('warning', 'Some dependencies may have issues', 'Run: npm ls');
    }
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  printSection('Environment Configuration');
  
  const envExampleExists = existsSync(path.join(rootDir, '.env.example'));
  logCheck(envExampleExists, '.env.example exists');
  
  const envLocalExists = existsSync(path.join(rootDir, '.env.local'));
  logCheck(
    envLocalExists ? 'warning' : true,
    'Environment file',
    envLocalExists
      ? '.env.local present (ensure production uses secrets)'
      : 'Using system environment variables'
  );
  
  // Check for critical env vars (in example mode, just check if they're documented)
  // Note: DATABASE_URL and REDIS_URL are backend-only and documented in backend/.env.example
  const criticalEnvVars = [
    'NEXT_PUBLIC_BACKEND_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN',
  ];
  
  const missingDocs = [];
  if (envExampleExists) {
    try {
      const envExample = run('cat .env.example', { silent: true });
      for (const envVar of criticalEnvVars) {
        if (!envExample.includes(envVar)) {
          missingDocs.push(envVar);
        }
      }
      
      logCheck(
        missingDocs.length === 0,
        'Critical env vars documented',
        missingDocs.length > 0 ? `Missing: ${missingDocs.join(', ')}` : 'All critical vars in .env.example'
      );
    } catch (error) {
      logCheck(false, 'Failed to read .env.example', error.message);
    }
  }
}

/**
 * Run code quality checks
 */
function checkCodeQuality() {
  printSection('Code Quality');
  
  try {
    console.log('  Running linter...');
    run('npm run lint', { silent: false });
    logCheck(true, 'Linting passed');
  } catch (error) {
    logCheck(false, 'Linting failed', 'Run: npm run lint');
  }
  
  try {
    console.log('  Running type check...');
    run('npm run typecheck', { silent: false });
    logCheck(true, 'Type checking passed');
  } catch (error) {
    logCheck(false, 'Type checking failed', 'Run: npm run typecheck');
  }
}

/**
 * Check security
 */
function checkSecurity() {
  printSection('Security');
  
  try {
    const auditOutput = run('npm audit --json', { silent: true, throwOnError: false });
    if (!auditOutput) {
      logCheck('warning', 'Security audit', 'npm audit command failed');
      return;
    }
    
    const audit = JSON.parse(auditOutput);
    
    const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
    const highVulns = audit.metadata?.vulnerabilities?.high || 0;
    const moderateVulns = audit.metadata?.vulnerabilities?.moderate || 0;
    const lowVulns = audit.metadata?.vulnerabilities?.low || 0;
    
    logCheck(
      criticalVulns === 0 && highVulns === 0,
      'Critical/High vulnerabilities',
      criticalVulns + highVulns === 0
        ? 'None found'
        : `${criticalVulns} critical, ${highVulns} high - Run: npm audit fix`
    );
    
    if (moderateVulns > 0 || lowVulns > 0) {
      logCheck(
        'warning',
        'Moderate/Low vulnerabilities',
        `${moderateVulns} moderate, ${lowVulns} low - Review with: npm audit`
      );
    }
  } catch (error) {
    logCheck('warning', 'Security audit check failed', error.message);
  }
  
  // Check for exposed secrets in git
  try {
    const gitSecrets = run('git log --all --pretty=format: -S "password\\|secret\\|api_key\\|token" | head -5', {
      silent: true,
      throwOnError: false,
    });
    
    logCheck(
      !gitSecrets || gitSecrets.trim() === '',
      'No obvious secrets in git history',
      'Manual review recommended'
    );
  } catch (error) {
    logCheck('warning', 'Could not scan git history', 'Skipping');
  }
}

/**
 * Check Kubernetes configuration
 */
function checkKubernetes() {
  if (!checkK8s) {
    return;
  }
  
  printSection('Kubernetes');
  
  try {
    const kubectlVersion = run('kubectl version --client --short 2>/dev/null || kubectl version --client', {
      silent: true,
      throwOnError: false,
    });
    logCheck(!!kubectlVersion, 'kubectl installed', kubectlVersion?.trim() || 'Not found');
  } catch (error) {
    logCheck(false, 'kubectl not found', 'Install kubectl to deploy to K8s');
    return;
  }
  
  try {
    run('kubectl cluster-info', { silent: true });
    logCheck(true, 'Kubernetes cluster accessible');
    
    // Check for required resources
    const ingressControllers = run('kubectl get ingressclass -o name', {
      silent: true,
      throwOnError: false,
    });
    logCheck(!!ingressControllers?.trim(), 'Ingress controller installed', ingressControllers?.trim() || 'None found');
    
    // Check namespace
    const namespace = run('kubectl get namespace rayon -o name', {
      silent: true,
      throwOnError: false,
    });
    logCheck(
      !!namespace?.trim(),
      'rayon namespace exists',
      namespace?.trim() ? 'Found' : 'Run: kubectl apply -f k8s/namespace.yaml'
    );
  } catch (error) {
    logCheck(false, 'Cannot connect to Kubernetes cluster', error.message);
  }
}

/**
 * Check external services
 */
function checkExternalServices() {
  if (!checkServices) {
    return;
  }
  
  printSection('External Services');
  
  // Database check
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      // Simple connection test (requires psql or equivalent)
      run(`psql "${databaseUrl}" -c "SELECT 1;"`, { silent: true });
      logCheck(true, 'Database connection', 'Connected successfully');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        logCheck('warning', 'Database connection', 'psql command not found; skipping connectivity check.');
      } else {
        logCheck(false, 'Database connection', `Connection failed: ${extractCommandErrorDetails(error)}`);
      }
    }
  } else {
    logCheck('warning', 'Database configuration', 'DATABASE_URL not set');
  }

  // Redis check
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      run(`redis-cli -u "${redisUrl}" --no-auth-warning PING`, { silent: true });
      logCheck(true, 'Redis connection', 'Connected successfully');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        logCheck('warning', 'Redis connection', 'redis-cli command not found; skipping connectivity check.');
      } else {
        logCheck(false, 'Redis connection', `Connection failed: ${extractCommandErrorDetails(error)}`);
      }
    }
  } else {
    logCheck('warning', 'Redis configuration', 'REDIS_URL not set');
  }
  
  // Backend API check
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      run(`node scripts/check-backend-endpoint.mjs`, { silent: false });
      logCheck(true, 'Backend API reachable');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        logCheck('warning', 'Backend API', 'Node runtime not available; skipping reachability check.');
      } else {
        logCheck(false, 'Backend API', `Reachability check failed: ${extractCommandErrorDetails(error)}`);
      }
    }
  } else {
    logCheck('warning', 'Backend URL', 'NEXT_PUBLIC_BACKEND_URL not set');
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  console.log(`Total checks:    ${totalChecks}`);
  console.log(`${colors.green}Passed:         ${passedChecks}${colors.reset}`);
  console.log(`${colors.yellow}Warnings:       ${warningChecks}${colors.reset}`);
  console.log(`${colors.red}Failed:         ${failedChecks}${colors.reset}\n`);
  
  if (failedChecks === 0 && warningChecks === 0) {
    console.log(`${colors.green}${colors.bright}${symbols.success} All checks passed! Ready for deployment.${colors.reset}\n`);
    return true;
  } else if (failedChecks === 0) {
    console.log(`${colors.yellow}${symbols.warning} All critical checks passed with ${warningChecks} warnings.${colors.reset}`);
    console.log(`${colors.yellow}Review warnings before deploying to production.${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.red}${symbols.error} ${failedChecks} critical checks failed.${colors.reset}`);
    console.log(`${colors.red}Fix all failed checks before deploying.${colors.reset}\n`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   Deployment Readiness Validation            ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  console.log(`${colors.cyan}Options:${colors.reset}`);
  console.log(`  K8s checks:       ${checkK8s ? 'Enabled' : 'Disabled (use --check-k8s)'}`);
  console.log(`  Service checks:   ${checkServices ? 'Enabled' : 'Disabled (use --check-services)'}`);
  
  try {
    checkRequiredFiles();
    checkNodeVersion();
    checkDependencies();
    checkEnvironment();
    checkCodeQuality();
    checkSecurity();
    checkKubernetes();
    checkExternalServices();
    
    const success = printSummary();
    
    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n${colors.red}${symbols.error} Validation failed with error:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

main();
