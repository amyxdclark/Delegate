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
      wireDashboardActions();
      break;
    case 'contracts':
      contentArea.innerHTML = renderContracts(state, currentUser);
      wireContractActions();
      break;
    case 'tasks':
      contentArea.innerHTML = renderTasks(state, currentUser);
      wireTasks();
      wireTaskActions();
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
      // Note: markNotificationRead mutates state in place
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
    
    // Note: addToCollection mutates state in place
    addToCollection(state.timeEntries, timeEntry);
    persist();
    setModal("");
    renderCurrentView();
  });
}

// Stub functions for wiring various views - placeholders for future implementation
function wireTasks(){
  // TODO: Wire up task editing, status transitions, hierarchy display
}

// Wire dashboard interactive features
function wireDashboardActions(){
  // Wire "View All" buttons
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.getAttribute('data-nav');
      if(view){
        currentView = view;
        renderCurrentView();
      }
    });
  });
  
  // Wire contract view buttons
  document.querySelectorAll('[data-view-contract]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const contractId = e.target.getAttribute('data-view-contract');
      openContractDetailModal(contractId);
    });
  });
  
  // Wire task view buttons
  document.querySelectorAll('[data-view-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = e.target.getAttribute('data-view-task');
      openTaskDetailModal(taskId);
    });
  });
  
  // Wire clickable contract cards
  document.querySelectorAll('[data-contract-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking a button
      if(e.target.tagName === 'BUTTON') return;
      const contractId = card.getAttribute('data-contract-id');
      openContractDetailModal(contractId);
    });
  });
  
  // Wire clickable task cards
  document.querySelectorAll('[data-task-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking a button or its children
      if(e.target.closest('button')) return;
      const taskId = card.getAttribute('data-task-id');
      openTaskDetailModal(taskId);
    });
  });
}

// Wire contract view interactive features
function wireContractActions(){
  // Wire create contract button
  const btnCreate = el("btnCreateContract");
  const btnCreateEmpty = el("btnCreateContractEmpty");
  if(btnCreate){
    btnCreate.addEventListener("click", () => openCreateContractModal());
  }
  if(btnCreateEmpty){
    btnCreateEmpty.addEventListener("click", () => openCreateContractModal());
  }
  
  // Wire view contract buttons
  document.querySelectorAll('[data-view-contract]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const contractId = e.target.getAttribute('data-view-contract');
      openContractDetailModal(contractId);
    });
  });
  
  // Wire edit contract buttons
  document.querySelectorAll('[data-edit-contract]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const contractId = e.target.getAttribute('data-edit-contract');
      openEditContractModal(contractId);
    });
  });
  
  // Wire clickable contract cards
  document.querySelectorAll('[data-contract-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking a button or its children
      if(e.target.closest('button')) return;
      const contractId = card.getAttribute('data-contract-id');
      openContractDetailModal(contractId);
    });
  });
}

// Wire task view interactive features
function wireTaskActions(){
  // Wire create task button
  const btnCreate = el("btnCreateTask");
  if(btnCreate){
    btnCreate.addEventListener("click", () => openCreateTaskModal());
  }
  
  // Wire view task buttons
  document.querySelectorAll('[data-view-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = e.target.getAttribute('data-view-task');
      openTaskDetailModal(taskId);
    });
  });
  
  // Wire edit task buttons
  document.querySelectorAll('[data-edit-task]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = e.target.getAttribute('data-edit-task');
      openEditTaskModal(taskId);
    });
  });
  
  // Wire clickable task cards
  document.querySelectorAll('[data-task-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking a button or its children
      if(e.target.closest('button')) return;
      const taskId = card.getAttribute('data-task-id');
      openTaskDetailModal(taskId);
    });
  });
}

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
        // Note: transitionTimeEntry mutates state in place
        transitionTimeEntry(state, entryId, 'Pending', currentUser.userId);
        persist();
        renderCurrentView();
      }
    });
  });
}

function wireForumActions(){
  // Wire create thread buttons
  const btnCreate = el("btnCreateForumThread");
  const btnCreateEmpty = el("btnCreateForumThreadEmpty");
  if(btnCreate){
    btnCreate.addEventListener("click", () => openCreateForumThreadModal());
  }
  if(btnCreateEmpty){
    btnCreateEmpty.addEventListener("click", () => openCreateForumThreadModal());
  }
  
  // Wire view thread buttons
  document.querySelectorAll('[data-view-thread]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const threadId = e.target.getAttribute('data-view-thread');
      openForumThreadDetailModal(threadId);
    });
  });
  
  // Wire reply buttons
  document.querySelectorAll('[data-reply-thread]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const threadId = e.target.getAttribute('data-reply-thread');
      openReplyToThreadModal(threadId);
    });
  });
  
  // Wire clickable thread cards
  document.querySelectorAll('[data-thread-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking a button or its children
      if(e.target.closest('button')) return;
      const threadId = card.getAttribute('data-thread-id');
      openForumThreadDetailModal(threadId);
    });
  });
}

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
  
  // Note: addToCollection mutates state in place
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
  
  // Re-render the whole view to show the selected thread
  renderCurrentView();
}

function wireCalendarActions(){
  // TODO: Wire up meeting creation, deadline reminders
}

function wireProfileActions(){
  // TODO: Add skill editing, profile updates
}

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
    
    // Note: addToCollection mutates state in place
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

// ===== Contract Modals =====
function openContractDetailModal(contractId){
  const contract = state.contracts.find(c => c.ContractId === contractId);
  if(!contract) return;
  
  const body = `
    <div class="space-y-4">
      <div>
        <div class="text-sm text-slate-400 mb-1">Contract Name</div>
        <div class="font-semibold">${escapeHtml(contract.Name)}</div>
      </div>
      
      <div>
        <div class="text-sm text-slate-400 mb-1">Customer</div>
        <div>${escapeHtml(contract.CustomerName)}</div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-slate-400 mb-1">Contract Number</div>
          <div class="font-mono text-sm">${escapeHtml(contract.ContractNumber)}</div>
        </div>
        <div>
          <div class="text-sm text-slate-400 mb-1">Status</div>
          <div><span class="px-2 py-1 rounded-lg text-xs ${contract.Status === 'Active' ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}">${contract.Status}</span></div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-slate-400 mb-1">Start Date</div>
          <div>${new Date(contract.PopStartDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div class="text-sm text-slate-400 mb-1">End Date</div>
          <div>${new Date(contract.PopEndDate).toLocaleDateString()}</div>
        </div>
      </div>
      
      ${contract.TotalValue ? `
        <div>
          <div class="text-sm text-slate-400 mb-1">Total Value</div>
          <div class="text-xl font-bold">$${contract.TotalValue.toLocaleString()}</div>
        </div>
      ` : ''}
      
      ${contract.Description ? `
        <div>
          <div class="text-sm text-slate-400 mb-1">Description</div>
          <div class="text-sm">${escapeHtml(contract.Description)}</div>
        </div>
      ` : ''}
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>
    <button id="btnEditContractFromDetail" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Edit Contract</button>
  `;
  setModal(modal("Contract Details", body, footer));
  
  const btnEdit = el("btnEditContractFromDetail");
  if(btnEdit){
    btnEdit.addEventListener("click", () => {
      setModal("");
      openEditContractModal(contractId);
    });
  }
}

function openCreateContractModal(){
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Contract Name *</div>
        <input type="text" id="contractName" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter contract name" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Customer Name *</div>
        <input type="text" id="contractCustomer" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter customer name" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Contract Number *</div>
        <input type="text" id="contractNumber" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="e.g., GS-35F-0123A" />
      </label>
      
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <div class="text-sm text-slate-300 mb-2">Start Date *</div>
          <input type="date" id="contractStartDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" />
        </label>
        
        <label class="block">
          <div class="text-sm text-slate-300 mb-2">End Date *</div>
          <input type="date" id="contractEndDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" />
        </label>
      </div>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Total Value</div>
        <input type="number" id="contractValue" min="0" step="1000" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="0" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Status</div>
        <select id="contractStatus" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
          <option>Pending</option>
          <option>Active</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Description</div>
        <textarea id="contractDescription" rows="3" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter contract description"></textarea>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnSaveContract" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create Contract</button>
  `;
  setModal(modal("Create New Contract", body, footer));
  
  el("btnSaveContract").addEventListener("click", () => {
    const name = el("contractName").value.trim();
    const customer = el("contractCustomer").value.trim();
    const number = el("contractNumber").value.trim();
    const startDate = el("contractStartDate").value;
    const endDate = el("contractEndDate").value;
    const value = parseFloat(el("contractValue").value) || null;
    const status = el("contractStatus").value;
    const description = el("contractDescription").value.trim();
    
    if(!name || !customer || !number || !startDate || !endDate){
      alert("Please fill in all required fields");
      return;
    }
    
    const contract = {
      ContractId: uid('CONT'),
      TenantId: currentUser.tenantId,
      Name: name,
      CustomerName: customer,
      ContractNumber: number,
      PopStartDate: startDate,
      PopEndDate: endDate,
      TotalValue: value,
      Status: status,
      Description: description,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.contracts, contract);
    persist();
    setModal("");
    renderCurrentView();
  });
}

function openEditContractModal(contractId){
  const contract = state.contracts.find(c => c.ContractId === contractId);
  if(!contract) return;
  
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Contract Name *</div>
        <input type="text" id="contractName" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${escapeHtml(contract.Name)}" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Customer Name *</div>
        <input type="text" id="contractCustomer" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${escapeHtml(contract.CustomerName)}" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Contract Number *</div>
        <input type="text" id="contractNumber" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${escapeHtml(contract.ContractNumber)}" />
      </label>
      
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <div class="text-sm text-slate-300 mb-2">Start Date *</div>
          <input type="date" id="contractStartDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${contract.PopStartDate}" />
        </label>
        
        <label class="block">
          <div class="text-sm text-slate-300 mb-2">End Date *</div>
          <input type="date" id="contractEndDate" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${contract.PopEndDate}" />
        </label>
      </div>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Total Value</div>
        <input type="number" id="contractValue" min="0" step="1000" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${contract.TotalValue || ''}" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Status</div>
        <select id="contractStatus" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
          <option ${contract.Status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option ${contract.Status === 'Active' ? 'selected' : ''}>Active</option>
          <option ${contract.Status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option ${contract.Status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Description</div>
        <textarea id="contractDescription" rows="3" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">${escapeHtml(contract.Description || '')}</textarea>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnUpdateContract" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Update Contract</button>
  `;
  setModal(modal("Edit Contract", body, footer));
  
  el("btnUpdateContract").addEventListener("click", () => {
    const name = el("contractName").value.trim();
    const customer = el("contractCustomer").value.trim();
    const number = el("contractNumber").value.trim();
    const startDate = el("contractStartDate").value;
    const endDate = el("contractEndDate").value;
    const value = parseFloat(el("contractValue").value) || null;
    const status = el("contractStatus").value;
    const description = el("contractDescription").value.trim();
    
    if(!name || !customer || !number || !startDate || !endDate){
      alert("Please fill in all required fields");
      return;
    }
    
    contract.Name = name;
    contract.CustomerName = customer;
    contract.ContractNumber = number;
    contract.PopStartDate = startDate;
    contract.PopEndDate = endDate;
    contract.TotalValue = value;
    contract.Status = status;
    contract.Description = description;
    
    persist();
    setModal("");
    renderCurrentView();
  });
}

// ===== Task Modals =====
function openTaskDetailModal(taskId){
  const task = state.taskNodes.find(t => t.TaskNodeId === taskId);
  if(!task) return;
  
  const body = `
    <div class="space-y-4">
      <div>
        <div class="text-sm text-slate-400 mb-1">Task Title</div>
        <div class="font-semibold">${escapeHtml(task.Title)}</div>
      </div>
      
      <div>
        <div class="text-sm text-slate-400 mb-1">Status</div>
        <div><span class="px-2 py-1 rounded-lg text-xs ${statusColor(task.Status)}">${task.Status}</span></div>
      </div>
      
      ${task.Description ? `
        <div>
          <div class="text-sm text-slate-400 mb-1">Description</div>
          <div class="text-sm">${escapeHtml(task.Description)}</div>
        </div>
      ` : ''}
      
      ${task.ScopedHours ? `
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-slate-400 mb-1">Scoped Hours</div>
            <div>${task.ScopedHours} hrs</div>
          </div>
          <div>
            <div class="text-sm text-slate-400 mb-1">Charged Hours</div>
            <div>${task.ChargedHours || 0} hrs</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>
    <button id="btnEditTaskFromDetail" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Edit Task</button>
  `;
  setModal(modal("Task Details", body, footer));
  
  const btnEdit = el("btnEditTaskFromDetail");
  if(btnEdit){
    btnEdit.addEventListener("click", () => {
      setModal("");
      openEditTaskModal(taskId);
    });
  }
}

function openCreateTaskModal(){
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Task Title *</div>
        <input type="text" id="taskTitle" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter task title" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Description</div>
        <textarea id="taskDescription" rows="3" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter task description"></textarea>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Status</div>
        <select id="taskStatus" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
          <option>NotStarted</option>
          <option>InProgress</option>
          <option>Blocked</option>
          <option>Done</option>
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Scoped Hours</div>
        <input type="number" id="taskHours" min="0" step="0.5" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="0" />
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnSaveTask" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create Task</button>
  `;
  setModal(modal("Create New Task", body, footer));
  
  el("btnSaveTask").addEventListener("click", () => {
    const title = el("taskTitle").value.trim();
    const description = el("taskDescription").value.trim();
    const status = el("taskStatus").value;
    const hours = parseFloat(el("taskHours").value) || null;
    
    if(!title){
      alert("Please enter a task title");
      return;
    }
    
    const task = {
      TaskNodeId: uid('TASK'),
      TenantId: currentUser.tenantId,
      Title: title,
      Description: description,
      Status: status,
      ScopedHours: hours,
      ChargedHours: 0,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.taskNodes, task);
    
    // Auto-assign to current user
    const assignment = {
      TaskAssignmentId: uid('TA'),
      TenantId: currentUser.tenantId,
      TaskNodeId: task.TaskNodeId,
      UserId: currentUser.userId,
      AssignedUtc: new Date().toISOString()
    };
    addToCollection(state.taskAssignments, assignment);
    
    persist();
    setModal("");
    renderCurrentView();
  });
}

function openEditTaskModal(taskId){
  const task = state.taskNodes.find(t => t.TaskNodeId === taskId);
  if(!task) return;
  
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Task Title *</div>
        <input type="text" id="taskTitle" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${escapeHtml(task.Title)}" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Description</div>
        <textarea id="taskDescription" rows="3" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">${escapeHtml(task.Description || '')}</textarea>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Status</div>
        <select id="taskStatus" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
          <option ${task.Status === 'NotStarted' ? 'selected' : ''}>NotStarted</option>
          <option ${task.Status === 'InProgress' ? 'selected' : ''}>InProgress</option>
          <option ${task.Status === 'Blocked' ? 'selected' : ''}>Blocked</option>
          <option ${task.Status === 'Done' ? 'selected' : ''}>Done</option>
        </select>
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Scoped Hours</div>
        <input type="number" id="taskHours" min="0" step="0.5" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" value="${task.ScopedHours || ''}" />
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnUpdateTask" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Update Task</button>
  `;
  setModal(modal("Edit Task", body, footer));
  
  el("btnUpdateTask").addEventListener("click", () => {
    const title = el("taskTitle").value.trim();
    const description = el("taskDescription").value.trim();
    const status = el("taskStatus").value;
    const hours = parseFloat(el("taskHours").value) || null;
    
    if(!title){
      alert("Please enter a task title");
      return;
    }
    
    task.Title = title;
    task.Description = description;
    task.Status = status;
    task.ScopedHours = hours;
    
    persist();
    setModal("");
    renderCurrentView();
  });
}

// ===== Forum Modals =====
function openForumThreadDetailModal(threadId){
  const thread = state.forumThreads.find(t => t.ThreadId === threadId);
  if(!thread) return;
  
  const posts = (state.forumPosts || []).filter(p => p.ThreadId === threadId);
  const author = state.users?.find(u => u.UserId === thread.CreatedBy);
  
  const body = `
    <div class="space-y-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-lg font-semibold">${escapeHtml(thread.Title)}</h3>
          ${thread.IsBlocking ? '<span class="px-2 py-1 rounded-lg text-xs bg-rose-900 text-rose-300">🚫 Blocker</span>' : ''}
          ${thread.RequiresDecision ? '<span class="px-2 py-1 rounded-lg text-xs bg-amber-900 text-amber-300">⚠️ Decision Required</span>' : ''}
        </div>
        <div class="text-sm text-slate-400">
          Posted by ${escapeHtml(author?.DisplayName || 'Unknown')} • ${new Date(thread.CreatedUtc).toLocaleString()}
        </div>
      </div>
      
      <div class="border-t border-slate-800 pt-4">
        <div class="text-sm font-semibold mb-3">${posts.length} ${posts.length === 1 ? 'Reply' : 'Replies'}</div>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${posts.map(post => {
            const postAuthor = state.users?.find(u => u.UserId === post.CreatedBy);
            return `
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div class="text-sm font-medium mb-1">${escapeHtml(postAuthor?.DisplayName || 'Unknown')}</div>
                <div class="text-sm text-slate-300 mb-2">${escapeHtml(post.Body)}</div>
                <div class="text-xs text-slate-500">${new Date(post.CreatedUtc).toLocaleString()}</div>
              </div>
            `;
          }).join('')}
          ${posts.length === 0 ? '<div class="text-sm text-slate-400 text-center py-4">No replies yet</div>' : ''}
        </div>
      </div>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Close</button>
    <button id="btnReplyFromDetail" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Add Reply</button>
  `;
  setModal(modal("Forum Thread", body, footer));
  
  const btnReply = el("btnReplyFromDetail");
  if(btnReply){
    btnReply.addEventListener("click", () => {
      setModal("");
      openReplyToThreadModal(threadId);
    });
  }
}

function openCreateForumThreadModal(){
  const body = `
    <div class="space-y-4">
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Thread Title *</div>
        <input type="text" id="threadTitle" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Enter thread title" />
      </label>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Initial Message *</div>
        <textarea id="threadBody" rows="4" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Start the discussion..."></textarea>
      </label>
      
      <div class="flex gap-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" id="threadBlocking" class="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-600 focus:ring-offset-slate-950" />
          <span class="text-sm">Mark as blocker</span>
        </label>
        
        <label class="flex items-center gap-2">
          <input type="checkbox" id="threadDecision" class="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-600 focus:ring-offset-slate-950" />
          <span class="text-sm">Requires decision</span>
        </label>
      </div>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnCreateThread" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Create Thread</button>
  `;
  setModal(modal("Create Forum Thread", body, footer));
  
  el("btnCreateThread").addEventListener("click", () => {
    const title = el("threadTitle").value.trim();
    const body = el("threadBody").value.trim();
    const isBlocking = el("threadBlocking").checked;
    const requiresDecision = el("threadDecision").checked;
    
    if(!title || !body){
      alert("Please fill in all required fields");
      return;
    }
    
    const thread = {
      ThreadId: uid('THREAD'),
      TenantId: currentUser.tenantId,
      Title: title,
      IsBlocking: isBlocking,
      RequiresDecision: requiresDecision,
      IsClosed: false,
      CreatedBy: currentUser.userId,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.forumThreads, thread);
    
    // Add initial post
    const post = {
      PostId: uid('POST'),
      ThreadId: thread.ThreadId,
      TenantId: currentUser.tenantId,
      Body: body,
      CreatedBy: currentUser.userId,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.forumPosts, post);
    
    persist();
    setModal("");
    renderCurrentView();
  });
}

function openReplyToThreadModal(threadId){
  const thread = state.forumThreads.find(t => t.ThreadId === threadId);
  if(!thread) return;
  
  const body = `
    <div class="space-y-4">
      <div>
        <div class="text-sm text-slate-400 mb-1">Replying to</div>
        <div class="font-semibold">${escapeHtml(thread.Title)}</div>
      </div>
      
      <label class="block">
        <div class="text-sm text-slate-300 mb-2">Your Reply *</div>
        <textarea id="replyBody" rows="4" class="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none" placeholder="Write your reply..."></textarea>
      </label>
    </div>
  `;
  const footer = `
    <button class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700" data-close="1">Cancel</button>
    <button id="btnPostReply" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600">Post Reply</button>
  `;
  setModal(modal("Reply to Thread", body, footer));
  
  el("btnPostReply").addEventListener("click", () => {
    const body = el("replyBody").value.trim();
    
    if(!body){
      alert("Please enter a reply");
      return;
    }
    
    const post = {
      PostId: uid('POST'),
      ThreadId: threadId,
      TenantId: currentUser.tenantId,
      Body: body,
      CreatedBy: currentUser.userId,
      CreatedUtc: new Date().toISOString()
    };
    
    addToCollection(state.forumPosts, post);
    
    persist();
    setModal("");
    renderCurrentView();
  });
}

function statusColor(status){
  const colors = {
    'NotStarted': 'bg-slate-800 text-slate-400',
    'InProgress': 'bg-cyan-900 text-cyan-300',
    'Blocked': 'bg-rose-900 text-rose-300',
    'Done': 'bg-emerald-900 text-emerald-300'
  };
  return colors[status] || 'bg-slate-800 text-slate-400';
}


