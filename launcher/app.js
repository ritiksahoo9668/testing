/** Thinkspace module dial — matches product ThinkspaceModuleDial. */
const MODULES = [
  { id: 'action', label: 'Action', runnable: true, demo: 'action', route: '/thinkspace/task' },
  { id: 'docflow', label: 'DocFlow', runnable: false, route: '/thinkspace/dms' },
  { id: 'projects', label: 'Projects', runnable: true, demo: 'projects', route: '/thinkspace/projects' },
  { id: 'journaling', label: 'Journaling', runnable: false, route: '/thinkspace/journaling' },
  { id: 'library', label: 'Library', runnable: false, route: '/thinkspace/library' },
  { id: 'metalk', label: 'Metalk', runnable: false, route: '/thinkspace/metalk' },
  { id: 'thought', label: 'Thought · Meetings', runnable: true, demo: 'thought', route: '/thinkspace/thought' },
  { id: 'noticeboard', label: 'Noticeboard', runnable: false, route: '/thinkspace/noticeboard' },
  { id: 'travel', label: 'Travel', runnable: true, demo: 'travel', route: '/thinkspace/travel' },
  { id: 'expense', label: 'Expense', runnable: false, route: '/thinkspace/expense' },
  { id: 'legal', label: 'Legal', runnable: false, route: '/thinkspace/legal-guard' },
  { id: 'decision', label: 'Decision', runnable: false, route: '/thinkspace/decision' },
];

const hubView = document.getElementById('hub-view');
const flowView = document.getElementById('flow-view');
const dialEl = document.getElementById('module-dial');
const dockThinkspace = document.getElementById('dock-thinkspace');

const flowBack = document.getElementById('flow-back');
const flowTitle = document.getElementById('flow-title');
const flowBadge = document.getElementById('flow-badge');
const flowScope = document.getElementById('flow-scope');
const flowStepsEl = document.getElementById('flow-steps');
const flowProgressBar = document.getElementById('flow-progress-bar');
const flowCounter = document.getElementById('flow-counter');
const flowStatusPill = document.getElementById('flow-status-pill');
const flowIframe = document.getElementById('flow-iframe');
const flowLive = document.getElementById('flow-live');
const flowUrl = document.getElementById('flow-url');
const flowRun = document.getElementById('flow-run');
const flowStop = document.getElementById('flow-stop');

let erpBaseUrl = '';
let activeModule = null;
let flowSteps = [];
let completedStepOrders = new Set();
let currentStepOrder = null;
let activeJobId = null;
let pollTimer = null;
let liveFrameTimer = null;

function arcSlots(count) {
  const r = 168;
  const start = -70;
  const end = 70;
  const step = count > 1 ? (end - start) / (count - 1) : 0;
  return Array.from({ length: count }, (_, idx) => {
    const deg = start + step * idx;
    const rad = (deg * Math.PI) / 180;
    return { x: -r * Math.cos(rad), y: r * Math.sin(rad) };
  });
}

function renderDial(selectedId = null) {
  const slots = arcSlots(MODULES.length);
  dialEl.replaceChildren();

  MODULES.forEach((mod, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dial__btn';
    btn.dataset.moduleId = mod.id;
    btn.textContent = mod.label;
    btn.style.setProperty('--x', `${slots[idx].x}px`);
    btn.style.setProperty('--y', `${slots[idx].y}px`);

    if (mod.runnable) btn.classList.add('dial__btn--runnable');
    if (mod.id === (selectedId || 'projects')) btn.classList.add('dial__btn--active');

    if (!mod.runnable) {
      btn.disabled = true;
      btn.title = `${mod.label} — coming soon`;
    } else {
      btn.title = `Run ${mod.label} demo workflow`;
      btn.addEventListener('click', () => openFlowView(mod));
    }

    dialEl.appendChild(btn);
  });
}

function showView(name) {
  const isHub = name === 'hub';
  hubView.classList.toggle('view--active', isHub);
  hubView.classList.toggle('view--hidden', !isHub);
  flowView.classList.toggle('view--active', !isHub);
  flowView.classList.toggle('view--hidden', isHub);
  flowView.setAttribute('aria-hidden', isHub ? 'true' : 'false');
  document.body.classList.toggle('body--flow', !isHub);
}

function setStatusPill(text, kind = 'idle') {
  flowStatusPill.textContent = text;
  flowStatusPill.className = `top-bar__flow-status top-bar__flow-status--${kind}`;
}

function scrollStepIntoView(order) {
  const el = flowStepsEl.querySelector(`[data-order="${order}"]`);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderFlowSteps() {
  flowStepsEl.replaceChildren();

  flowSteps.forEach((step) => {
    const li = document.createElement('li');
    li.className = 'flow-step';
    li.dataset.order = String(step.order);

    let state = 'pending';
    if (completedStepOrders.has(step.order)) state = 'done';
    else if (currentStepOrder === step.order) state = 'active';

    li.classList.add(`flow-step--${state}`);
    li.innerHTML = `
      <span class="flow-step__num">${step.order}</span>
      <div class="flow-step__body">
        <span class="flow-step__section">[${step.section}] ${step.crud}</span>
        <span class="flow-step__title">${step.title}</span>
      </div>
    `;
    flowStepsEl.appendChild(li);
  });

  const total = flowSteps.length;
  const done = completedStepOrders.size;
  flowCounter.textContent = `${done} / ${total}`;
  flowProgressBar.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
}

function showLiveView() {
  flowIframe.classList.add('flow-stage__iframe--hidden');
  flowLive.classList.add('flow-stage__live--visible');
}

function showIdlePreview(route) {
  flowLive.classList.remove('flow-stage__live--visible');
  flowIframe.classList.remove('flow-stage__iframe--hidden');
  if (erpBaseUrl && route) {
    flowIframe.src = `${erpBaseUrl}${route}`;
    flowUrl.textContent = route;
  }
}

function startLiveFramePoll(jobId) {
  if (liveFrameTimer) window.clearInterval(liveFrameTimer);
  liveFrameTimer = window.setInterval(() => {
    if (!activeJobId) return;
    flowLive.src = `/api/live/${jobId}/frame.png?t=${Date.now()}`;
  }, 450);
}

async function loadConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load launcher config');
  const cfg = await res.json();
  erpBaseUrl = (cfg.erpUiBaseUrl || '').replace(/\/$/, '');
  if (!erpBaseUrl) throw new Error('Set E2E_ERP_UI_BASE_URL in testing/.env');
  return cfg;
}

async function loadFlowSteps(demoKey) {
  const res = await fetch(`/api/flows/${demoKey}`);
  if (!res.ok) throw new Error('Could not load flow steps');
  const data = await res.json();
  return data.steps || [];
}

function stopAutomation() {
  if (activeJobId) {
    fetch(`/api/cancel/${activeJobId}`, { method: 'POST' }).catch(() => {});
    activeJobId = null;
  }
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  if (liveFrameTimer) {
    window.clearInterval(liveFrameTimer);
    liveFrameTimer = null;
  }
  currentStepOrder = null;
  flowRun.disabled = false;
  flowRun.classList.remove('flow-rail__run--hidden');
  flowStop.classList.add('flow-rail__stop--hidden');
}

async function pollLiveProgress(jobId) {
  try {
    const [statusRes, liveRes] = await Promise.all([
      fetch(`/api/status/${jobId}`),
      fetch(`/api/live/${jobId}/progress.json`),
    ]);
    const job = await statusRes.json();
    const live = liveRes.ok ? await liveRes.json() : {};

    if (live.completedSteps?.length) {
      completedStepOrders = new Set(live.completedSteps);
    } else if (job.completedSteps?.length) {
      completedStepOrders = new Set(job.completedSteps);
    }

    currentStepOrder = live.currentStep || job.currentStep || currentStepOrder;
    if (live.title) {
      setStatusPill(`Step ${currentStepOrder}/${flowSteps.length} — ${live.title}`, 'running');
    } else if (job.statusMessage) {
      setStatusPill(job.statusMessage, job.state === 'running' ? 'running' : 'idle');
    }

    if (live.url || job.liveUrl) {
      try {
        const u = new URL(live.url || job.liveUrl);
        flowUrl.textContent = u.pathname + u.search;
      } catch {
        flowUrl.textContent = activeModule?.route || '/';
      }
    }

    renderFlowSteps();
    if (currentStepOrder) scrollStepIntoView(currentStepOrder);

    if (job.state === 'running') return;

    window.clearInterval(pollTimer);
    pollTimer = null;
    activeJobId = null;

    const success = job.state === 'passed';
    setStatusPill(success ? 'Flow completed' : 'Failed — see test-results/', success ? 'done' : 'error');
    flowStop.classList.add('flow-rail__stop--hidden');
    flowRun.classList.remove('flow-rail__run--hidden');
    flowRun.disabled = false;
    flowRun.textContent = success ? 'Run again' : 'Retry';

    if (success) {
      flowSteps.forEach((s) => completedStepOrders.add(s.order));
      renderFlowSteps();
    }
  } catch (err) {
    console.error(err);
  }
}

async function startAutomation() {
  if (!activeModule || activeJobId) return;

  completedStepOrders = new Set();
  currentStepOrder = 1;
  renderFlowSteps();

  setStatusPill('Starting Playwright…', 'running');
  flowRun.disabled = true;
  flowRun.classList.add('flow-rail__run--hidden');
  flowStop.classList.remove('flow-rail__stop--hidden');
  showLiveView();

  try {
    const res = await fetch(`/api/run/${activeModule.demo}`, { method: 'POST' });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Could not start demo');

    activeJobId = body.jobId;
    startLiveFramePoll(body.jobId);
    pollTimer = window.setInterval(() => pollLiveProgress(body.jobId), 700);
    await pollLiveProgress(body.jobId);
  } catch (err) {
    setStatusPill('Failed to start', 'error');
    flowRun.disabled = false;
    flowRun.classList.remove('flow-rail__run--hidden');
    flowStop.classList.add('flow-rail__stop--hidden');
    showIdlePreview(activeModule.route);
    alert(err.message);
  }
}

async function openFlowView(mod) {
  stopAutomation();

  try {
    if (!erpBaseUrl) await loadConfig();
    flowSteps = await loadFlowSteps(mod.demo);
  } catch (err) {
    alert(err.message);
    return;
  }

  activeModule = mod;
  completedStepOrders = new Set();
  currentStepOrder = null;

  renderDial(mod.id);
  showView('flow');

  flowTitle.textContent = mod.label;
  flowBadge.textContent = `${mod.label} demo`;
  flowScope.textContent = `${flowSteps.length} steps — Playwright runs the real workflow`;
  flowRun.textContent = 'Run flow';
  flowRun.disabled = false;
  flowRun.classList.remove('flow-rail__run--hidden');
  flowStop.classList.add('flow-rail__stop--hidden');

  showIdlePreview(mod.route);
  renderFlowSteps();
  setStatusPill('Ready', 'idle');

  window.setTimeout(() => startAutomation(), 500);
}

function closeFlowView() {
  stopAutomation();
  flowLive.src = '';
  flowIframe.src = 'about:blank';
  activeModule = null;
  completedStepOrders = new Set();
  currentStepOrder = null;
  renderDial();
  showView('hub');
}

flowBack.addEventListener('click', closeFlowView);
dockThinkspace.addEventListener('click', () => {
  if (!flowView.classList.contains('view--hidden')) closeFlowView();
});
flowRun.addEventListener('click', startAutomation);
flowStop.addEventListener('click', () => {
  stopAutomation();
  setStatusPill('Stopped', 'idle');
  flowRun.textContent = 'Run flow';
  showIdlePreview(activeModule?.route);
  renderFlowSteps();
});

loadConfig().catch(() => {});
renderDial();
