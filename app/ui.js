import { clampText, fmtDate } from "./utils.js";

export function appShell(){
  return `
  <div class="flex flex-col min-h-screen">
    <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div class="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <img src="./assets/icons/icon-192.png" alt="Delegate" class="w-10 h-10 rounded-xl shadow" />
        <div class="flex-1">
          <div class="text-lg font-semibold leading-tight">Delegate</div>
          <div class="text-xs text-slate-400 -mt-0.5">Projects • Roles • Workflow • PWA</div>
        </div>
        <div class="flex items-center gap-2">
          <button id="btnNewProject" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">New Project</button>
          <button id="btnNewTask" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-sm">New Task</button>
          <button id="btnData" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Data</button>
        </div>
      </div>
    </header>

    <main class="flex-1 mx-auto max-w-7xl w-full px-4 py-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <aside class="lg:col-span-3 border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-3 border-b border-slate-800 flex items-center justify-between">
            <div class="font-semibold">Projects</div>
            <div id="pwaBadge" class="text-xs text-slate-400"></div>
          </div>
          <div id="projectList" class="p-2"></div>

          <div class="p-3 border-t border-slate-800">
            <div class="text-xs text-slate-400">
              Seed JSON loads from <code class="text-slate-200">/data/seed.json</code> and your edits save to <code class="text-slate-200">localStorage</code>.
            </div>
          </div>
        </aside>

        <section class="lg:col-span-9 space-y-4">
          <div id="projectHeader" class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden"></div>
          <div id="board" class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden"></div>
        </section>
      </div>
    </main>

    <footer class="border-t border-slate-800 bg-slate-950/50">
      <div class="mx-auto max-w-7xl px-4 py-3 text-xs text-slate-400 flex flex-wrap gap-3 items-center justify-between">
        <div>Offline-ready PWA • GitHub Pages friendly</div>
        <div class="flex gap-2">
          <a class="underline hover:text-slate-200" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
          <span>•</span>
          <button id="btnAbout" class="underline hover:text-slate-200">About</button>
        </div>
      </div>
    </footer>

    <div id="modalRoot"></div>
  </div>
  `;
}

export function renderProjectList(state, activeProjectId){
  const items = state.projects.map(p => {
    const isActive = p.id === activeProjectId;
    return `
      <button data-project="${p.id}" class="w-full text-left px-3 py-2 rounded-xl ${isActive ? "bg-slate-800" : "hover:bg-slate-800/60"}">
        <div class="font-medium">${escapeHtml(p.name)}</div>
        <div class="text-xs text-slate-400">${escapeHtml(p.category || "")}</div>
      </button>
    `;
  }).join("");

  return items || `<div class="p-4 text-sm text-slate-400">No projects yet. Click <b>New Project</b>.</div>`;
}

export function renderProjectHeader(project){
  if(!project) return `<div class="p-4 text-slate-400">Select a project.</div>`;
  return `
    <div class="p-4">
      <div class="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <div class="text-xl font-semibold">${escapeHtml(project.name)}</div>
          <div class="text-sm text-slate-400">${escapeHtml(project.description || "")}</div>
          <div class="mt-2 text-xs text-slate-400 flex flex-wrap gap-2">
            <span class="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700">Start: ${escapeHtml(fmtDate(project.startDate))}</span>
            <span class="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700">End: ${escapeHtml(fmtDate(project.absoluteEndDate))}</span>
            <span class="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700">Category: ${escapeHtml(project.category || "")}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button id="btnEditProject" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Edit</button>
          <button id="btnManageUsers" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Users</button>
        </div>
      </div>
      <div class="mt-4 text-xs text-slate-400">
        Drag tasks across steps to represent role handoffs and workflow movement.
      </div>
    </div>
  `;
}

export function renderBoard(state, project){
  if(!project) return `<div class="p-4 text-slate-400">Pick a project to see its workflow.</div>`;

  const steps = project.steps || [];
  const tasks = state.tasks.filter(t => t.projectId === project.id);

  const cols = steps.map(step => {
    const stepTasks = tasks.filter(t => t.statusStepId === step.id);
    return `
      <div class="min-w-[18rem] w-[18rem] shrink-0">
        <div class="p-3 border-b border-slate-800 flex items-center justify-between">
          <div class="font-semibold">${escapeHtml(step.name)}</div>
          <div class="text-xs text-slate-400">${stepTasks.length}</div>
        </div>
        <div class="p-3 space-y-2 min-h-[12rem]" data-dropzone="${step.id}">
          ${stepTasks.map(t => taskCard(state, t)).join("") || `<div class="text-xs text-slate-500">Drop tasks here</div>`}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="p-3 border-b border-slate-800 flex items-center justify-between">
      <div class="font-semibold">Workflow Board</div>
      <div class="text-xs text-slate-400">Drag & drop enabled</div>
    </div>
    <div class="p-3 overflow-x-auto">
      <div class="flex gap-3">
        ${cols}
      </div>
    </div>
  `;
}

function taskCard(state, t){
  const assignees = (t.assigneeUserIds || []).map(id => state.users.find(u => u.id === id)?.name).filter(Boolean);
  const due = t.dueDate ? `<span class="px-2 py-0.5 rounded-lg bg-slate-800/70 border border-slate-700">Due: ${escapeHtml(fmtDate(t.dueDate))}</span>` : "";
  const pri = t.priority ? `<span class="px-2 py-0.5 rounded-lg bg-slate-800/70 border border-slate-700">Pri: ${escapeHtml(t.priority)}</span>` : "";
  return `
    <div draggable="true" data-task="${t.id}"
      class="group cursor-grab active:cursor-grabbing p-3 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 shadow-sm">
      <div class="flex items-start justify-between gap-2">
        <div class="font-medium leading-snug">${escapeHtml(t.title)}</div>
        <button data-task-open="${t.id}" class="opacity-0 group-hover:opacity-100 transition text-xs text-slate-300 hover:text-white underline">Open</button>
      </div>
      <div class="text-xs text-slate-400 mt-1">${escapeHtml(clampText(t.description, 120))}</div>
      <div class="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-300">
        ${pri}${due}
        ${assignees.length ? `<span class="px-2 py-0.5 rounded-lg bg-slate-800/70 border border-slate-700">${escapeHtml(assignees.join(", "))}</span>` : ""}
      </div>
    </div>
  `;
}

export function modal(title, bodyHtml, footerHtml){
  return `
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70" data-close="1"></div>
    <div class="relative w-full max-w-2xl border border-slate-800 rounded-2xl bg-slate-950 shadow-xl overflow-hidden">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <div class="font-semibold">${escapeHtml(title)}</div>
        <button class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm" data-close="1">✕</button>
      </div>
      <div class="p-4">${bodyHtml}</div>
      <div class="p-4 border-t border-slate-800 flex flex-wrap gap-2 justify-end">${footerHtml || ""}</div>
    </div>
  </div>
  `;
}

export function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
