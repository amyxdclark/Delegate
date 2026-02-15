import { appShell, renderProjectList, renderProjectHeader, renderBoard, modal } from "./ui.js";
import { loadState, saveState, loadSeed, resetToSeed, addProject, addTask, addUser, moveTask, updateTask, deleteTask, exportState } from "./state.js";
import { downloadJson, readJsonFile } from "./utils.js";

let state = null;
let activeProjectId = null;

const el = (id) => document.getElementById(id);

boot();

async function boot(){
  const root = el("app");
  root.innerHTML = appShell();

  // PWA badge
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  el("pwaBadge").textContent = isStandalone ? "PWA" : "Web";

  state = await loadState();
  activeProjectId = state.projects?.[0]?.id || null;

  renderAll();
  wireGlobalButtons();
  wireDnd();
}

function renderAll(){
  el("projectList").innerHTML = renderProjectList(state, activeProjectId);

  const project = state.projects.find(p => p.id === activeProjectId) || null;
  el("projectHeader").innerHTML = renderProjectHeader(project);
  el("board").innerHTML = renderBoard(state, project);

  wireProjectSelection();
  wireProjectHeaderButtons(project);
  wireTaskOpenButtons();
  wireDnd(); // re-bind after re-render
}

function persist(){
  saveState(state);
}

function wireProjectSelection(){
  el("projectList").querySelectorAll("[data-project]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeProjectId = btn.getAttribute("data-project");
      renderAll();
    });
  });
}

function wireGlobalButtons(){
  el("btnNewProject").addEventListener("click", () => openNewProject());
  el("btnNewTask").addEventListener("click", () => openNewTask());
  el("btnData").addEventListener("click", () => openDataTools());
  el("btnAbout").addEventListener("click", () => openAbout());
}

function wireProjectHeaderButtons(project){
  const edit = document.getElementById("btnEditProject");
  const users = document.getElementById("btnManageUsers");
  if(edit) edit.addEventListener("click", () => openEditProject(project));
  if(users) users.addEventListener("click", () => openUsers());
}

function wireTaskOpenButtons(){
  document.querySelectorAll("[data-task-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-task-open");
      openTask(id);
    });
  });
}

function setModal(html){
  const m = el("modalRoot");
  m.innerHTML = html || "";
  if(html){
    m.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", () => setModal("")));
  }
}

function openNewProject(){
  const body = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Project Name</div>
        <input id="np_name" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="e.g., Vendor Training Rollout" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Category</div>
        <input id="np_cat" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="e.g., Implementation" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Start Date</div>
        <input id="np_start" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Absolute End Date</div>
        <input id="np_end" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </label>
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Description</div>
        <textarea id="np_desc" rows="3" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="What is this project?"></textarea>
      </label>
    </div>
    <div class="mt-3 text-xs text-slate-400">
      Default steps will be created. You can edit steps afterwards.
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="np_create" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create</button>
  `;
  setModal(modal("New Project", body, footer));
  document.getElementById("np_create").addEventListener("click", () => {
    const p = addProject(state, {
      name: document.getElementById("np_name").value,
      category: document.getElementById("np_cat").value,
      startDate: document.getElementById("np_start").value,
      absoluteEndDate: document.getElementById("np_end").value,
      description: document.getElementById("np_desc").value
    });
    activeProjectId = p.id;
    persist();
    setModal("");
    renderAll();
  });
}

function openNewTask(){
  const project = state.projects.find(p => p.id === activeProjectId);
  if(!project){
    openNewProject();
    return;
  }
  const userOptions = state.users.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.role||"")})</option>`).join("");
  const stepOptions = project.steps.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
  const body = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Title</div>
        <input id="nt_title" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="e.g., Draft SOP" />
      </label>
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Description</div>
        <textarea id="nt_desc" rows="3" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="Details..."></textarea>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Step</div>
        <select id="nt_step" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${stepOptions}</select>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Priority</div>
        <select id="nt_pri" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">
          <option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option>
        </select>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Due Date</div>
        <input id="nt_due" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Assignees (Ctrl/⌘ click)</div>
        <select id="nt_assignees" multiple size="4" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${userOptions}</select>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="nt_create" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create</button>
  `;
  setModal(modal("New Task", body, footer));
  document.getElementById("nt_create").addEventListener("click", () => {
    const sel = document.getElementById("nt_assignees");
    const assignees = Array.from(sel.selectedOptions).map(o => o.value);
    addTask(state, project.id, {
      title: document.getElementById("nt_title").value,
      description: document.getElementById("nt_desc").value,
      statusStepId: document.getElementById("nt_step").value,
      priority: document.getElementById("nt_pri").value,
      dueDate: document.getElementById("nt_due").value,
      assigneeUserIds: assignees
    });
    persist();
    setModal("");
    renderAll();
  });
}

function openTask(taskId){
  const t = state.tasks.find(x => x.id === taskId);
  if(!t) return;
  const project = state.projects.find(p => p.id === t.projectId);
  const stepOptions = (project?.steps || []).map(s => `<option value="${s.id}" ${s.id===t.statusStepId?"selected":""}>${escapeHtml(s.name)}</option>`).join("");
  const userOptions = state.users.map(u => {
    const sel = (t.assigneeUserIds || []).includes(u.id) ? "selected" : "";
    return `<option value="${u.id}" ${sel}>${escapeHtml(u.name)} (${escapeHtml(u.role||"")})</option>`;
  }).join("");
  const tagString = (t.tags || []).join(", ");
  const body = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Title</div>
        <input id="et_title" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(t.title)}" />
      </label>
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Description</div>
        <textarea id="et_desc" rows="4" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${escapeHtml(t.description||"")}</textarea>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Step</div>
        <select id="et_step" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${stepOptions}</select>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Priority</div>
        <select id="et_pri" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">
          ${["Low","Medium","High","Critical"].map(x => `<option ${x===t.priority?"selected":""}>${x}</option>`).join("")}
        </select>
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Due Date</div>
        <input id="et_due" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(t.dueDate||"")}" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Assignees (Ctrl/⌘ click)</div>
        <select id="et_assignees" multiple size="5" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${userOptions}</select>
      </label>
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Tags (comma separated)</div>
        <input id="et_tags" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(tagString)}" />
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>
    <button id="et_delete" class="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600">Delete</button>
    <button id="et_save" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Save</button>
  `;
  setModal(modal("Edit Task", body, footer));

  document.getElementById("et_delete").addEventListener("click", () => {
    if(confirm("Delete this task?")){
      deleteTask(state, t.id);
      persist();
      setModal("");
      renderAll();
    }
  });

  document.getElementById("et_save").addEventListener("click", () => {
    const sel = document.getElementById("et_assignees");
    const assignees = Array.from(sel.selectedOptions).map(o => o.value);
    updateTask(state, t.id, {
      title: document.getElementById("et_title").value,
      description: document.getElementById("et_desc").value,
      statusStepId: document.getElementById("et_step").value,
      priority: document.getElementById("et_pri").value,
      dueDate: document.getElementById("et_due").value,
      assigneeUserIds: assignees,
      tags: (document.getElementById("et_tags").value || "").split(",").map(x => x.trim()).filter(Boolean)
    });
    persist();
    setModal("");
    renderAll();
  });
}

function openEditProject(project){
  if(!project) return;
  const stepsHtml = (project.steps || []).map((s, idx) => `
    <div class="flex gap-2 items-center">
      <input data-step-name="${s.id}" class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(s.name)}" />
      <button data-step-del="${s.id}" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Remove</button>
    </div>
  `).join("");

  const body = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Project Name</div>
        <input id="ep_name" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(project.name)}" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Category</div>
        <input id="ep_cat" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(project.category||"")}" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Start Date</div>
        <input id="ep_start" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(project.startDate||"")}" />
      </label>
      <label class="text-sm">
        <div class="text-slate-300 mb-1">Absolute End Date</div>
        <input id="ep_end" type="date" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" value="${escapeAttr(project.absoluteEndDate||"")}" />
      </label>
      <label class="text-sm md:col-span-2">
        <div class="text-slate-300 mb-1">Description</div>
        <textarea id="ep_desc" rows="3" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">${escapeHtml(project.description||"")}</textarea>
      </label>
    </div>

    <div class="mt-4">
      <div class="font-semibold mb-2">Workflow Steps</div>
      <div class="space-y-2" id="ep_steps">${stepsHtml}</div>
      <button id="ep_add_step" class="mt-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Add Step</button>
      <div class="mt-2 text-xs text-slate-400">Steps define the Kanban columns and the role handoff flow.</div>
    </div>
  `;

  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="ep_save" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Save</button>
  `;

  setModal(modal("Edit Project", body, footer));

  document.getElementById("ep_add_step").addEventListener("click", () => {
    project.steps.push({ id: cryptoId("s"), name: "New Step", color: "slate" });
    persist();
    setModal("");
    renderAll();
    openEditProject(project);
  });

  document.querySelectorAll("[data-step-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-step-del");
      if(project.steps.length <= 1) return;
      project.steps = project.steps.filter(s => s.id !== id);
      // Move tasks in deleted step to first step
      const fallback = project.steps[0]?.id;
      state.tasks.filter(t => t.projectId === project.id && t.statusStepId === id)
        .forEach(t => t.statusStepId = fallback);
      persist();
      setModal("");
      renderAll();
      openEditProject(project);
    });
  });

  document.getElementById("ep_save").addEventListener("click", () => {
    // update project
    project.name = document.getElementById("ep_name").value;
    project.category = document.getElementById("ep_cat").value;
    project.startDate = document.getElementById("ep_start").value;
    project.absoluteEndDate = document.getElementById("ep_end").value;
    project.description = document.getElementById("ep_desc").value;

    // step names
    document.querySelectorAll("[data-step-name]").forEach(inp => {
      const stepId = inp.getAttribute("data-step-name");
      const s = project.steps.find(x => x.id === stepId);
      if(s) s.name = inp.value || s.name;
    });

    persist();
    setModal("");
    renderAll();
  });
}

function openUsers(){
  const rows = state.users.map(u => `
    <div class="flex gap-2 items-center">
      <div class="flex-1">
        <div class="font-medium">${escapeHtml(u.name)}</div>
        <div class="text-xs text-slate-400">${escapeHtml(u.email || "")} • ${escapeHtml(u.role || "")}</div>
      </div>
    </div>
  `).join("");

  const body = `
    <div class="space-y-2">${rows || `<div class="text-slate-400 text-sm">No users</div>`}</div>
    <div class="mt-4 border-t border-slate-800 pt-4">
      <div class="font-semibold mb-2">Add User</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label class="text-sm">
          <div class="text-slate-300 mb-1">Name</div>
          <input id="nu_name" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" />
        </label>
        <label class="text-sm">
          <div class="text-slate-300 mb-1">Role</div>
          <input id="nu_role" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="Worker / QA / PM / ..." />
        </label>
        <label class="text-sm md:col-span-2">
          <div class="text-slate-300 mb-1">Email</div>
          <input id="nu_email" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="optional" />
        </label>
      </div>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>
    <button id="nu_add" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Add</button>
  `;
  setModal(modal("Users", body, footer));
  document.getElementById("nu_add").addEventListener("click", () => {
    addUser(state, {
      name: document.getElementById("nu_name").value,
      role: document.getElementById("nu_role").value,
      email: document.getElementById("nu_email").value
    });
    persist();
    setModal("");
    renderAll();
    openUsers();
  });
}

function openDataTools(){
  const body = `
    <div class="space-y-3 text-sm">
      <div class="text-slate-300">Because GitHub Pages is static, edits are stored in your browser.</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button id="dt_export" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Export JSON</button>
        <label class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center cursor-pointer">
          Import JSON
          <input id="dt_import" type="file" accept="application/json" class="hidden" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button id="dt_reset" class="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600">Reset to seed.json</button>
        <button id="dt_clear" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Clear local data</button>
      </div>

      <div class="text-xs text-slate-400">
        Tip: Put shared seed data in <code class="text-slate-200">/data/seed.json</code>. Everyone gets the same defaults.
      </div>
    </div>
  `;
  const footer = `<button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>`;
  setModal(modal("Data Tools", body, footer));

  document.getElementById("dt_export").addEventListener("click", () => {
    downloadJson("delegate-export.json", exportState(state));
  });

  document.getElementById("dt_import").addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    try{
      const obj = await readJsonFile(f);
      state = obj;
      persist();
      setModal("");
      activeProjectId = state.projects?.[0]?.id || null;
      renderAll();
    } catch(err){
      alert("Import failed: " + err.message);
    }
  });

  document.getElementById("dt_reset").addEventListener("click", async () => {
    if(!confirm("Reset your local data back to seed.json?")) return;
    const seed = await loadSeed();
    state = resetToSeed(seed);
    activeProjectId = state.projects?.[0]?.id || null;
    setModal("");
    renderAll();
  });

  document.getElementById("dt_clear").addEventListener("click", () => {
    if(!confirm("Clear local data?")) return;
    localStorage.removeItem("delegate:data:v1");
    location.reload();
  });
}

function openAbout(){
  const body = `
    <div class="space-y-2 text-sm text-slate-300">
      <div><b>Delegate</b> is a lightweight workflow + task tool built to run on GitHub Pages.</div>
      <ul class="list-disc pl-5 text-slate-300">
        <li>Customize steps per project</li>
        <li>Drag tasks across steps</li>
        <li>Assign roles/users to tasks</li>
        <li>Export/Import JSON for collaboration</li>
      </ul>
      <div class="text-xs text-slate-400 mt-2">
        This build is: <code class="text-slate-200">${window.__DELEGATE_BUILD__}</code>
      </div>
    </div>
  `;
  const footer = `<button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>`;
  setModal(modal("About", body, footer));
}

function wireDnd(){
  // draggable task cards
  document.querySelectorAll("[data-task]").forEach(card => {
    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", card.getAttribute("data-task"));
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  // drop zones
  document.querySelectorAll("[data-dropzone]").forEach(zone => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drop-target");
      e.dataTransfer.dropEffect = "move";
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drop-target"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drop-target");
      const taskId = e.dataTransfer.getData("text/plain");
      const toStep = zone.getAttribute("data-dropzone");
      moveTask(state, taskId, toStep);
      persist();
      renderAll();
    });
  });
}

// helpers for escaping in app.js templates
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str){ return escapeHtml(str).replaceAll("\n"," "); }
function cryptoId(prefix){
  // uid-like, but deterministic enough
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}
