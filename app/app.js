import { appShell, renderLoginScreen, renderDashboard, renderContracts, renderTasks, renderTimesheet, renderForum, renderChat, renderCalendar, renderUserProfile, renderReports, renderAIAssistant, renderPTO, renderAuditLog } from "./ui.js";
import { loadState, saveState, getCurrentUser, setCurrentUser, clearCurrentUser, resetToSeed, loadSeed, exportState, startWorkSession, stopWorkSession, pauseWorkSession, resumeWorkSession, markNotificationRead, isFeatureEnabled, getUserRoles, isAdmin, isProjectManager, isApprover, getTenantBranding, transitionTimeEntry, addToCollection } from "./state.js";
import { downloadJson, readJsonFile, uid } from "./utils.js";

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
      currentView = 'login';
      showLogin();
    } else {
      // Show main app
      currentView = 'dashboard';
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
  // Ensure we have a valid view
  if(!currentView || currentView === 'login'){
    currentView = 'dashboard';
  }
  
  const root = el("app");
  root.innerHTML = appShell(state, currentUser, currentView);
  
  // Set PWA badge
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  el("pwaBadge").textContent = isStandalone ? "PWA" : "Web";
  
  // Wire up buttons and navigation first
  wireGlobalButtons();
  wireNavigation();
  
  // Then render the current view
  renderCurrentView();
}

function renderCurrentView(){
  const contentArea = el("mainContent");
  if(!contentArea) return;
  
  switch(currentView){
    case 'dashboard':
      contentArea.innerHTML = renderDashboard(state, currentUser);
      break;
    case 'contracts':
      contentArea.innerHTML = renderContracts(state, currentUser);
      break;
    case 'tasks':
      contentArea.innerHTML = renderTasks(state, currentUser);
      wireTasks();
      break;
    case 'timesheet':
      contentArea.innerHTML = renderTimesheet(state, currentUser);
      wireTimerButtons();
      wireTimesheetActions();
      break;
    case 'forum':
      contentArea.innerHTML = renderForum(state, currentUser);
      wireForumActions();
      break;
    case 'chat':
      contentArea.innerHTML = renderChat(state, currentUser);
      wireChatActions();
      break;
    case 'calendar':
      contentArea.innerHTML = renderCalendar(state, currentUser);
      wireCalendarActions();
      break;
    case 'reports':
      contentArea.innerHTML = renderReports(state, currentUser);
      break;
    case 'ai':
      contentArea.innerHTML = renderAIAssistant(state, currentUser);
      break;
    case 'profile':
      contentArea.innerHTML = renderUserProfile(state, currentUser);
      wireProfileActions();
      break;
    case 'pto':
      contentArea.innerHTML = renderPTO(state, currentUser);
      wirePTOActions();
      break;
    case 'audit':
      contentArea.innerHTML = renderAuditLog(state, currentUser);
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
  
  // Notification button
  const btnNotifications = el("btnNotifications");
  if(btnNotifications){
    btnNotifications.addEventListener("click", () => openNotificationsPanel());
  }
  
  // User profile button
  const btnUserProfile = el("btnUserProfile");
  if(btnUserProfile){
    btnUserProfile.addEventListener("click", () => {
      currentView = 'profile';
      renderCurrentView();
    });
  }
}

function wireNavigation(){
  // Wire up navigation tabs
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.getAttribute('data-nav');
      if(view){
        currentView = view;
        renderCurrentView();
      }
    });
  });
}

function wireTimerButtons(){
  const btnStart = el("btnStartTimer");
  const btnPause = el("btnPauseTimer");
  const btnStop = el("btnStopTimer");
  const btnResume = el("btnResumeTimer");
  
  if(btnStart){
    btnStart.addEventListener("click", () => {
      // Start a new work session
      state = startWorkSession(state, currentUser.userId, currentUser.tenantId, null);
      persist();
      renderCurrentView();
      startTimerUpdate();
    });
  }
  
  if(btnPause){
    btnPause.addEventListener("click", () => {
      // Find active session and pause it
      const activeSession = (state.workSessions || []).find(ws => 
        ws.UserId === currentUser.userId && ws.State === 'Running'
      );
      if(activeSession){
        state = pauseWorkSession(state, activeSession.WorkSessionId);
        persist();
        renderCurrentView();
      }
    });
  }
  
  if(btnResume){
    btnResume.addEventListener("click", () => {
      // Find paused session and resume it
      const pausedSession = (state.workSessions || []).find(ws => 
        ws.UserId === currentUser.userId && ws.State === 'Paused'
      );
      if(pausedSession){
        state = resumeWorkSession(state, pausedSession.WorkSessionId);
        persist();
        renderCurrentView();
        startTimerUpdate();
      }
    });
  }
  
  if(btnStop){
    btnStop.addEventListener("click", () => {
      // Find active or paused session and stop it
      const activeSession = (state.workSessions || []).find(ws => 
        ws.UserId === currentUser.userId && (ws.State === 'Running' || ws.State === 'Paused')
      );
      if(activeSession){
        state = stopWorkSession(state, activeSession.WorkSessionId);
        persist();
        renderCurrentView();
      }
    });
  }
  
  // Start timer update if there's an active session
  const activeSession = (state.workSessions || []).find(ws => 
    ws.UserId === currentUser.userId && ws.State === 'Running'
  );
  if(activeSession){
    startTimerUpdate();
  }
}

let timerInterval = null;

function startTimerUpdate(){
  // Clear any existing interval to prevent multiple timers
  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const activeSession = (state.workSessions || []).find(ws => 
    ws.UserId === currentUser.userId && ws.State === 'Running'
  );
  
  if(!activeSession){
    return;
  }
  
  // Cache the start time for better performance
  const startTime = new Date(activeSession.StartedUtc).getTime();
  
  // Update timer every second
  timerInterval = setInterval(() => {
    const timerDisplay = el("timerDisplay");
    if(!timerDisplay){
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    
    // Check if session is still active
    const currentSession = (state.workSessions || []).find(ws => 
      ws.UserId === currentUser.userId && ws.State === 'Running'
    );
    
    if(!currentSession){
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    
    const now = Date.now();
    const elapsedMs = now - startTime;
    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    
    timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
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

// Notification panel
function openNotificationsPanel(){
  const notifications = (state.notifications || [])
    .filter(n => n.UserId === currentUser.userId)
    .sort((a, b) => new Date(b.CreatedUtc) - new Date(a.CreatedUtc));
  
  const body = `
    <div class="space-y-2 max-h-96 overflow-y-auto">
      ${notifications.length === 0 ? `
        <div class="text-center py-8 text-slate-400">No notifications</div>
      ` : notifications.map(n => `
        <div class="p-3 rounded-xl ${n.IsRead ? 'bg-slate-900' : 'bg-slate-800'} border ${n.IsRead ? 'border-slate-800' : 'border-cyan-900'}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <div class="font-medium text-sm ${n.IsRead ? 'text-slate-300' : 'text-white'}">${escapeHtml(n.Title)}</div>
              <div class="text-sm text-slate-400 mt-1">${escapeHtml(n.Body)}</div>
              <div class="text-xs text-slate-500 mt-1">${new Date(n.CreatedUtc).toLocaleString()}</div>
            </div>
            ${!n.IsRead ? `
              <button class="px-2 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600" data-mark-read="${n.NotificationId}">Mark Read</button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  const footer = `<button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>`;
  setModal(modal("Notifications", body, footer));
  
  // Wire up mark read buttons
  document.querySelectorAll('[data-mark-read]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const notifId = e.target.getAttribute('data-mark-read');
      markNotificationRead(state, notifId);
      persist();
      setModal(""); // Close modal
      showApp(); // Refresh to update badge count
    });
  });
}

// Create time entry modal
function openCreateTimeEntryModal(){
  // Get user's assigned tasks
  const userTaskAssignments = (state.taskAssignments || []).filter(ta => 
    ta.UserId === currentUser.userId && ta.TenantId === currentUser.tenantId
  );
  const assignedTaskIds = userTaskAssignments.map(ta => ta.TaskNodeId);
  const assignedTasks = (state.taskNodes || []).filter(tn => 
    assignedTaskIds.includes(tn.TaskNodeId)
  );
  
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Task</div>
        <select id="teTaskSelect" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
          <option value="">Select a task...</option>
          ${assignedTasks.map(t => `<option value="${t.TaskNodeId}">${escapeHtml(t.Title)}</option>`).join('')}
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Work Date</div>
        <input type="date" id="teWorkDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${new Date().toISOString().slice(0,10)}" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Hours</div>
        <input type="number" id="teHours" min="0" max="24" step="0.5" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="8" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Notes</div>
        <textarea id="teNotes" rows="3" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="What did you work on?"></textarea>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnSaveTimeEntry" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create Entry</button>
  `;
  setModal(modal("Create Time Entry", body, footer));
  
  // Wire save button
  el("btnSaveTimeEntry").addEventListener("click", () => {
    const taskId = el("teTaskSelect").value;
    const workDate = el("teWorkDate").value;
    const hours = parseFloat(el("teHours").value);
    const notes = el("teNotes").value;
    
    if(!taskId || !workDate || !hours){
      alert("Please fill in all required fields");
      return;
    }
    
    const timeEntry = {
      TimeEntryId: uid('TE'),
      TenantId: currentUser.tenantId,
      UserId: currentUser.userId,
      TaskNodeId: taskId,
      WorkDate: workDate,
      NetMinutes: hours * 60,
      Hours: hours,
      State: 'Draft',
      Notes: notes,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.timeEntries, timeEntry);
    persist();
    setModal("");
    renderCurrentView();
  });
}

// Stub functions for wiring various views - will implement progressively
function wireTasks(){}

function wireTimesheetActions(){
  // Wire create time entry button
  const btnCreate = el("btnCreateTimeEntry");
  if(btnCreate){
    btnCreate.addEventListener("click", () => openCreateTimeEntryModal());
  }
  
  // Wire submit buttons
  document.querySelectorAll('[data-submit-entry]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const entryId = e.target.getAttribute('data-submit-entry');
      if(confirm('Submit this time entry for approval?')){
        transitionTimeEntry(state, entryId, 'Pending', currentUser.userId);
        persist();
        renderCurrentView();
      }
    });
  });
}

function wireForumActions(){}

function wireChatActions(){
  // Wire send message button
  const btnSend = el("btnSendChatMessage");
  if(btnSend){
    btnSend.addEventListener("click", () => sendChatMessage());
  }
  
  // Wire enter key to send
  const msgInput = el("chatMessageInput");
  if(msgInput){
    msgInput.addEventListener("keypress", (e) => {
      if(e.key === 'Enter'){
        sendChatMessage();
      }
    });
  }
  
  // Wire thread switching
  document.querySelectorAll('[data-chat-thread]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const threadId = e.currentTarget.getAttribute('data-chat-thread');
      switchChatThread(threadId);
    });
  });
}

function sendChatMessage(){
  const msgInput = el("chatMessageInput");
  if(!msgInput) return;
  
  const body = msgInput.value.trim();
  const threadId = msgInput.getAttribute('data-thread-id');
  
  if(!body || !threadId) return;
  
  const message = {
    MessageId: uid('MSG'),
    ThreadId: threadId,
    TenantId: currentUser.tenantId,
    SentBy: currentUser.userId,
    Body: body,
    SentUtc: new Date().toISOString()
  };
  
  addToCollection(state.chatMessages, message);
  
  // Update thread's last message time
  const thread = state.chatThreads.find(t => t.ThreadId === threadId);
  if(thread){
    thread.LastMessageUtc = message.SentUtc;
  }
  
  persist();
  
  // Clear input and re-render to show new message
  msgInput.value = '';
  renderCurrentView();
}

function switchChatThread(threadId){
  const thread = state.chatThreads.find(t => t.ThreadId === threadId);
  if(!thread) return;
  
  // Re-render just the messages container
  const container = el("chatMessagesContainer");
  if(container){
    // Import renderChatMessages - we need to expose it or inline it here
    // For now, just re-render the whole view
    renderCurrentView();
  }
}

function wireCalendarActions(){}
function wireProfileActions(){}

function wirePTOActions(){
  // Wire create PTO button
  const btnCreate = el("btnCreatePTO");
  if(btnCreate){
    btnCreate.addEventListener("click", () => openCreatePTOModal());
  }
  
  // Wire approve/deny buttons
  document.querySelectorAll('[data-approve-pto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ptoId = e.target.getAttribute('data-approve-pto');
      approvePTO(ptoId);
    });
  });
  
  document.querySelectorAll('[data-deny-pto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ptoId = e.target.getAttribute('data-deny-pto');
      denyPTO(ptoId);
    });
  });
}

// PTO helpers
function openCreatePTOModal(){
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Category</div>
        <select id="ptoCategory" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700">
          <option>Vacation</option>
          <option>Sick</option>
          <option>Training</option>
          <option>Personal</option>
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Start Date</div>
        <input type="date" id="ptoStartDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">End Date</div>
        <input type="date" id="ptoEndDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Hours</div>
        <input type="number" id="ptoHours" min="1" max="200" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700" value="8" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Notes</div>
        <textarea id="ptoNotes" rows="2" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700"></textarea>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnSavePTO" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Submit Request</button>
  `;
  setModal(modal("Request PTO", body, footer));
  
  el("btnSavePTO").addEventListener("click", () => {
    const ptoEntry = {
      PtoEntryId: uid('PTO'),
      TenantId: currentUser.tenantId,
      UserId: currentUser.userId,
      Type: 'Planned',
      Category: el("ptoCategory").value,
      StartUtc: el("ptoStartDate").value + 'T00:00:00Z',
      EndUtc: el("ptoEndDate").value + 'T23:59:59Z',
      Hours: parseInt(el("ptoHours").value),
      Status: 'Submitted',
      Notes: el("ptoNotes").value,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.ptoEntries, ptoEntry);
    persist();
    setModal("");
    renderCurrentView();
  });
}

function approvePTO(ptoId){
  const pto = state.ptoEntries.find(p => p.PtoEntryId === ptoId);
  if(pto){
    pto.Status = 'Approved';
    pto.ApprovedByUserId = currentUser.userId;
    pto.ApprovedUtc = new Date().toISOString();
    persist();
    renderCurrentView();
  }
}

function denyPTO(ptoId){
  const pto = state.ptoEntries.find(p => p.PtoEntryId === ptoId);
  if(pto){
    pto.Status = 'Denied';
    persist();
    renderCurrentView();
  }
}

