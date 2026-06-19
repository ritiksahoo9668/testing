#!/usr/bin/env node
/**
 * Thinkspace-style test launcher — serves testing/launcher and runs demo flows on module click.
 *
 * Usage: npm run launcher
 * Open:  http://localhost:8090
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer, get as httpGet } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const launcherDir = join(rootDir, 'launcher');
const preferredPort = Number(process.env.E2E_LAUNCHER_PORT || 8090);

const DEMO_SCRIPTS = {
  projects: 'scripts/demo-thinkspace-projects.mjs',
  action: 'scripts/demo-thinkspace-action.mjs',
  thought: 'scripts/demo-thinkspace-thought.mjs',
  travel: 'scripts/demo-thinkspace-travel.mjs',
};

const FLOW_FILES = {
  action: 'src/data/thinkspace/action-flow-demo.json',
  projects: 'src/data/thinkspace/project-flow-demo.json',
  thought: 'src/data/thinkspace/thought-flow-demo.json',
  travel: 'src/data/thinkspace/travel-flow-demo.json',
};

/** @type {Map<string, { state: string, progress: number, statusMessage: string, log: string, error?: string, exitCode?: number, completedSteps: number[], currentStep: number, child?: import('node:child_process').ChildProcess }>} */
const jobs = new Map();

function loadEnvFile() {
  const envPath = join(rootDir, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function mime(path) {
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
  };
  return map[extname(path)] || 'application/octet-stream';
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function tailLog(text, max = 4800) {
  return text.length > max ? text.slice(-max) : text;
}

function parseCompletedSteps(logText) {
  const completed = new Set();
  let currentStep = 1;
  for (const line of logText.split('\n')) {
    const stepMatch = line.match(/(\d+)\.\s+\[[A-Z]\]/);
    if (!stepMatch) continue;
    const order = Number(stepMatch[1]);
    if (/✓|passed/i.test(line)) {
      completed.add(order);
      currentStep = order + 1;
    } else if (line.includes('…') || /running/i.test(line)) {
      currentStep = order;
    }
  }
  return { completedSteps: [...completed].sort((a, b) => a - b), currentStep };
}

function readLiveProgress(job) {
  const progressPath = join(job.liveDir, 'progress.json');
  if (!existsSync(progressPath)) return null;
  try {
    return JSON.parse(readFileSync(progressPath, 'utf-8'));
  } catch {
    return null;
  }
}

function syncJobFromLive(job) {
  const live = readLiveProgress(job);
  if (!live) return;
  if (live.completedSteps?.length) job.completedSteps = live.completedSteps;
  if (live.currentStep) job.currentStep = live.currentStep;
  if (live.title) {
    job.statusMessage = `Step ${live.currentStep}/${job.totalSteps || '?'} — ${live.title}`;
  }
  if (live.url) job.liveUrl = live.url;
  const total = job.totalSteps || 1;
  job.progress = Math.min(99, Math.round((job.completedSteps.length / total) * 100));
}

function startDemoJob(moduleId) {
  const scriptRel = DEMO_SCRIPTS[moduleId];
  if (!scriptRel) {
    throw new Error(`Unknown demo module: ${moduleId}`);
  }

  const scriptPath = join(rootDir, scriptRel);
  if (!existsSync(scriptPath)) {
    throw new Error(`Missing script: ${scriptRel}`);
  }

  const flowPath = join(rootDir, FLOW_FILES[moduleId] ?? '');
  let totalSteps = 0;
  if (existsSync(flowPath)) {
    try {
      const flow = JSON.parse(readFileSync(flowPath, 'utf-8'));
      totalSteps = flow.steps?.length ?? 0;
    } catch {
      totalSteps = 0;
    }
  }

  const jobId = randomUUID();
  const liveDir = join(launcherDir, 'live', jobId);
  mkdirSync(liveDir, { recursive: true });

  const job = {
    state: 'running',
    progress: 5,
    statusMessage: 'Starting Playwright demo…',
    log: '',
    completedSteps: [],
    currentStep: 1,
    totalSteps,
    liveDir,
  };
  jobs.set(jobId, job);

  const child = spawn(process.execPath, [scriptPath], {
    cwd: rootDir,
    env: {
      ...process.env,
      E2E_LAUNCHER_INLINE: '1',
      E2E_LAUNCHER_LIVE_DIR: liveDir,
      E2E_HEADLESS: 'true',
      E2E_VIDEO: 'retain-on-failure',
      E2E_SLOW_MO: process.env.E2E_SLOW_MO || '250',
      E2E_DEMO_PAUSE_MS: process.env.E2E_DEMO_PAUSE_MS || '900',
    },
    shell: false,
  });
  job.child = child;

  child.stdout.on('data', (chunk) => {
    job.log += chunk.toString();
    job.log = tailLog(job.log);
    syncJobFromLive(job);
    if (job.log.includes('playwright test')) {
      job.statusMessage = job.statusMessage || 'Running Playwright demo spec…';
      job.progress = Math.max(job.progress, 10);
    }
  });

  child.stderr.on('data', (chunk) => {
    job.log += chunk.toString();
    job.log = tailLog(job.log);
    syncJobFromLive(job);
  });

  child.on('close', (code) => {
    job.child = undefined;
    job.exitCode = code ?? 1;
    syncJobFromLive(job);
    if (code === 0) {
      job.state = 'passed';
      job.progress = 100;
      job.statusMessage = 'Demo flow completed successfully.';
      if (job.totalSteps) {
        job.completedSteps = Array.from({ length: job.totalSteps }, (_, i) => i + 1);
      }
    } else {
      job.state = 'failed';
      job.progress = 100;
      job.error = `Demo exited with code ${code}`;
      job.statusMessage = 'Demo flow failed — see test-results/.';
    }
  });

  return jobId;
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = resolve(launcherDir, `.${urlPath}`);
  if (!filePath.startsWith(launcherDir) || !existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime(filePath) });
  createReadStream(filePath).pipe(res);
}

loadEnvFile();

function createRequestHandler() {
  return (req, res) => {
    if (req.method === 'GET' && req.url === '/api/config') {
      sendJson(res, 200, {
        erpUiBaseUrl: process.env.E2E_ERP_UI_BASE_URL || '',
      });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/flows/')) {
      const moduleId = req.url.replace('/api/flows/', '').replace(/\/$/, '');
      const rel = FLOW_FILES[moduleId];
      if (!rel) {
        sendJson(res, 404, { error: 'Unknown flow' });
        return;
      }
      const flowPath = join(rootDir, rel);
      if (!existsSync(flowPath)) {
        sendJson(res, 404, { error: 'Flow file missing' });
        return;
      }
      try {
        const flow = JSON.parse(readFileSync(flowPath, 'utf-8'));
        sendJson(res, 200, flow);
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith('/api/cancel/')) {
      const jobId = req.url.replace('/api/cancel/', '').replace(/\/$/, '');
      const job = jobs.get(jobId);
      if (!job) {
        sendJson(res, 404, { error: 'Job not found' });
        return;
      }
      if (job.child && !job.child.killed) {
        job.child.kill('SIGTERM');
      }
      job.state = 'cancelled';
      job.statusMessage = 'Cancelled';
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith('/api/run/')) {
      const moduleId = req.url.replace('/api/run/', '').replace(/\/$/, '');
      try {
        if (!existsSync(join(rootDir, '.env'))) {
          sendJson(res, 400, { error: 'Missing testing/.env — copy .env.example and set credentials.' });
          return;
        }
        const jobId = startDemoJob(moduleId);
        sendJson(res, 202, { jobId, moduleId });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/live/')) {
      const rest = req.url.replace('/api/live/', '').split('?')[0];
      const [jobId, file] = rest.split('/');
      const job = jobs.get(jobId);
      if (!job?.liveDir) {
        sendJson(res, 404, { error: 'Live session not found' });
        return;
      }
      if (file === 'progress.json') {
        const live = readLiveProgress(job);
        if (!live) {
          sendJson(res, 200, { currentStep: 0, completedSteps: [], state: 'running' });
          return;
        }
        sendJson(res, 200, live);
        return;
      }
      if (file === 'frame.png') {
        const framePath = join(job.liveDir, 'frame.png');
        if (!existsSync(framePath)) {
          res.writeHead(204);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        createReadStream(framePath).pipe(res);
        return;
      }
      sendJson(res, 404, { error: 'Unknown live asset' });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/status/')) {
      const jobId = req.url.replace('/api/status/', '').replace(/\/$/, '');
      const job = jobs.get(jobId);
      if (!job) {
        sendJson(res, 404, { error: 'Job not found' });
        return;
      }
      syncJobFromLive(job);
      sendJson(res, 200, {
        state: job.state,
        progress: job.progress,
        statusMessage: job.statusMessage,
        logTail: job.log,
        error: job.error,
        exitCode: job.exitCode,
        completedSteps: job.completedSteps,
        currentStep: job.currentStep,
        totalSteps: job.totalSteps,
        liveUrl: job.liveUrl,
      });
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res);
      return;
    }

    res.writeHead(405);
    res.end('Method not allowed');
  };
}

function printStartupBanner(actualPort, note) {
  console.log('\n--- Thinkspace Test Launcher ---\n');
  console.log(`  UI:  http://localhost:${actualPort}`);
  if (note) console.log(`  (${note})`);
  console.log('  Click a module on the dial — demo flow opens on the same page.\n');
  if (!existsSync(join(rootDir, '.env'))) {
    console.log('  ⚠ Missing testing/.env — demos will fail until configured.\n');
  }
}

function probeLauncher(portToProbe) {
  return new Promise((resolve) => {
    const req = httpGet(`http://127.0.0.1:${portToProbe}/`, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 4096) req.destroy();
      });
      res.on('end', () => {
        resolve(res.statusCode === 200 && body.includes('Thinkspace Test Launcher'));
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function listenOnPort(portToTry) {
  const server = createServer(createRequestHandler());

  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      server.close();
      reject(err);
    });

    server.listen(portToTry, () => {
      server.removeAllListeners('error');
      server.on('error', (err) => {
        console.error(err);
        process.exit(1);
      });
      resolve({ server, port: portToTry });
    });
  });
}

async function startLauncher() {
  const maxTries = 6;

  for (let offset = 0; offset < maxTries; offset++) {
    const portToTry = preferredPort + offset;
    try {
      const { port } = await listenOnPort(portToTry);
      const note = port !== preferredPort ? `port ${preferredPort} was busy` : null;
      printStartupBanner(port, note);
      return;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') {
        console.error(err);
        process.exit(1);
      }

      if (offset === 0) {
        const alreadyOurs = await probeLauncher(preferredPort);
        if (alreadyOurs) {
          const msg = [
            '',
            '--- Thinkspace Test Launcher ---',
            '',
            `  Already running at http://localhost:${preferredPort}`,
            '  Open that URL in your browser.',
            '',
          ].join('\n');
          process.stdout.write(`${msg}\n`);
          process.exit(0);
        }
      }
    }
  }

  console.error(`\n❌ No free port found (${preferredPort}–${preferredPort + maxTries - 1}).`);
  console.error(`   Stop the process on ${preferredPort} or set E2E_LAUNCHER_PORT.\n`);
  process.exit(1);
}

startLauncher();
