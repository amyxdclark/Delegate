import { appShell, renderLoginScreen, renderDashboard } from "./ui.js";
import { loadState, saveState, getCurrentUser, setCurrentUser, clearCurrentUser, resetToSeed, loadSeed, exportState } from "./state.js";
import { downloadJson, readJsonFile } from "./utils.js";

let state = null;
let currentUser = null;
let currentView = 'login';

const el = (id) => document.getElementById(id);

boot();

async function boot(){
  const root = el("app");
  
  // Show loading state
  root.innerHTML = '<div class="min-h-screen flex items-center justify-center"><div class="text-xl">Loading Delegate...</div></div>';
  
  try {
    state = await loadState();
    currentUser = getCurrentUser();
    
    if(!currentUser){
      // Show login screen
      showLogin();
    } else {
      // Show main app
      showApp();
    }
  } catch(error){
    root.innerHTML = `<div class="min-h-screen flex items-center justify-center"><div class="text-xl text-red-500">Error loading app: ${error.message}</div></div>`;
  }
}

function showLogin(){
  currentView = 'login';
  const root = el("app");
  root.innerHTML = renderLoginScreen(state);
  
  // Wire tenant selector
  const tenantSelect = el("loginTenantSelect");
  const userSelect = el("loginUserSelect");
  
  tenantSelect.addEventListener("change", () => {
    const selectedTenant = tenantSelect.value;
    updateUserList(selectedTenant);
  });
  
  // Initialize with first tenant
  if(state.tenants && state.tenants.length > 0){
    updateUserList(state.tenants[0].TenantId);
  }
  
  // Wire login button
  el("btnLogin").addEventListener("click", () => {
    const userId = userSelect.value;
    const tenantId = tenantSelect.value;
    if(!userId || !tenantId) return;
    
    setCurrentUser(userId, tenantId);
    currentUser = { userId, tenantId };
    showApp();
  });
}

function updateUserList(tenantId){
  const userSelect = el("loginUserSelect");
  const users = state.users.filter(u => u.TenantId === tenantId);
  
  userSelect.innerHTML = users.map(u => 
    `<option value="${u.UserId}">${escapeHtml(u.DisplayName)} (${escapeHtml(u.PartyType)})</option>`
  ).join('');
}

function showApp(){
  currentView = 'dashboard';
  const root = el("app");
  root.innerHTML = appShell(state, currentUser);
  
  // Set PWA badge
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  el("pwaBadge").textContent = isStandalone ? "PWA" : "Web";
  
  renderCurrentView();
  wireGlobalButtons();
}

function renderCurrentView(){
  const contentArea = el("mainContent");
  if(!contentArea) return;
  
  switch(currentView){
    case 'dashboard':
      contentArea.innerHTML = renderDashboard(state, currentUser);
      break;
    default:
      contentArea.innerHTML = '<div class="p-4">View not implemented yet</div>';
  }
}

function wireGlobalButtons(){
  // Logout button
  const btnLogout = el("btnLogout");
  if(btnLogout){
    btnLogout.addEventListener("click", () => {
      clearCurrentUser();
      currentUser = null;
      showLogin();
    });
  }
  
  // Data tools button
  const btnData = el("btnData");
  if(btnData){
    btnData.addEventListener("click", () => openDataTools());
  }
}

function persist(){
  saveState(state);
}

function openDataTools(){
  const body = `
    <div class="space-y-3 text-sm">
      <div class="text-slate-300">Data is stored in your browser's localStorage.</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button id="dt_export" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Export JSON</button>
        <label class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center cursor-pointer">
          Import JSON
          <input id="dt_import" type="file" accept="application/json" class="hidden" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button id="dt_reset" class="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600">Reset to seed data</button>
        <button id="dt_clear" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">Clear all data</button>
      </div>

      <div class="text-xs text-slate-400">
        Seed data is loaded from <code class="text-slate-200">/data/*.json</code> files.
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
      renderCurrentView();
    } catch(err){
      alert("Import failed: " + err.message);
    }
  });

  document.getElementById("dt_reset").addEventListener("click", async () => {
    if(!confirm("Reset your local data back to seed data?")) return;
    const seed = await loadSeed();
    state = resetToSeed(seed);
    setModal("");
    renderCurrentView();
  });

  document.getElementById("dt_clear").addEventListener("click", () => {
    if(!confirm("Clear all local data?")) return;
    localStorage.clear();
    location.reload();
  });
}

function setModal(html){
  const m = el("modalRoot");
  if(!m) return;
  m.innerHTML = html || "";
  if(html){
    m.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", () => setModal("")));
  }
}

function modal(title, bodyHtml, footerHtml){
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

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
