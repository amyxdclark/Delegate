import { clampText, fmtDate, fmtDateTime, fmtHours } from "./utils.js";
import { filterByTenant, getUnreadNotifications, isFeatureEnabled, getTenantBranding } from "./state.js";

export function renderLoginScreen(state){
  const tenants = state.tenants || [];
  
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div class="w-full max-w-md p-8 border border-slate-800 rounded-2xl bg-slate-950/90 shadow-2xl">
        <div class="text-center mb-8">
          <div class="text-3xl font-bold mb-2">Delegate</div>
          <div class="text-sm text-slate-400">Multi-Tenant Contract Execution Platform</div>
        </div>
        
        <div class="space-y-4">
          <label class="block">
            <div class="text-sm text-slate-300 mb-2">Select Tenant</div>
            <select id="loginTenantSelect" class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
              ${tenants.map(t => `<option value="${t.TenantId}">${escapeHtml(t.Name)}</option>`).join('')}
            </select>
          </label>
          
          <label class="block">
            <div class="text-sm text-slate-300 mb-2">Select User</div>
            <select id="loginUserSelect" class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-600 focus:outline-none">
            </select>
          </label>
          
          <button id="btnLogin" class="w-full px-4 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition">
            Log In
          </button>
        </div>
        
        <div class="mt-6 text-xs text-slate-500 text-center">
          Demo login - select any user to enter the platform
        </div>
      </div>
    </div>
  `;
}

export function appShell(state, currentUser, currentView){
  const user = state.users.find(u => u.UserId === currentUser.userId);
  const tenant = state.tenants.find(t => t.TenantId === currentUser.tenantId);
  const unreadCount = getUnreadNotifications(state, currentUser.userId).length;
  const branding = getTenantBranding(state, currentUser.tenantId);
  
  // Apply tenant branding colors
  const primaryColor = branding?.PrimaryColor || '#0e7490'; // Default cyan
  const headerStyle = branding ? `style="border-bottom-color: ${primaryColor}20;"` : '';
  
  // Check feature flags for navigation
  const hasChat = isFeatureEnabled(state, currentUser.tenantId, 'FF_CHAT_INTEGRATION');
  const hasCalendar = isFeatureEnabled(state, currentUser.tenantId, 'FF_CALENDAR_SYNC');
  const hasReporting = isFeatureEnabled(state, currentUser.tenantId, 'FF_ADVANCED_REPORTING');
  const hasAI = isFeatureEnabled(state, currentUser.tenantId, 'FF_AI_ASSISTANT');
  
  return `
    <div class="flex flex-col min-h-screen">
      <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur" ${headerStyle}>
        <div class="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <img src="./assets/icons/icon-192.png" alt="Delegate" class="w-10 h-10 rounded-xl shadow" />
          <div class="flex-1">
            <div class="text-lg font-semibold leading-tight">Delegate</div>
            <div class="text-xs text-slate-400 -mt-0.5">${escapeHtml(tenant?.Name || 'Platform')}</div>
            ${branding ? `<div class="text-xs text-slate-500 -mt-0.5">${escapeHtml(branding.ThemeName)}</div>` : ''}
          </div>
          
          <div class="flex items-center gap-3">
            <button id="btnNotifications" class="relative px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">
              <span class="text-sm">🔔</span>
              ${unreadCount > 0 ? `<span class="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-600 rounded-full">${unreadCount}</span>` : ''}
            </button>
            
            <button id="btnUserProfile" class="text-sm text-left hover:bg-slate-800 px-3 py-2 rounded-xl">
              <div class="font-medium">${escapeHtml(user?.DisplayName || 'User')}</div>
              <div class="text-xs text-slate-400">${escapeHtml(user?.PartyType || '')}</div>
            </button>
            
            <button id="btnData" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Data</button>
            <button id="btnLogout" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Logout</button>
            <div id="pwaBadge" class="px-2 py-1 rounded-lg bg-slate-800 text-xs"></div>
          </div>
        </div>
        
        <!-- Navigation tabs -->
        <nav class="mx-auto max-w-7xl px-4 border-b border-slate-800">
          <div class="flex gap-1 -mb-px overflow-x-auto">
            ${navTab('dashboard', '📊 Dashboard', currentView)}
            ${navTab('contracts', '📄 Contracts', currentView)}
            ${navTab('tasks', '✅ Tasks', currentView)}
            ${navTab('timesheet', '⏱️ Timesheet', currentView)}
            ${navTab('forum', '💬 Forum', currentView)}
            ${hasChat ? navTab('chat', '💭 Chat', currentView) : ''}
            ${hasCalendar ? navTab('calendar', '📅 Calendar', currentView) : ''}
            ${hasReporting ? navTab('reports', '📊 Reports', currentView) : ''}
            ${hasAI ? navTab('ai', '🤖 AI Assistant', currentView) : ''}
            ${navTab('pto', '🏖️ PTO', currentView)}
          </div>
        </nav>
      </header>

      <main id="mainContent" class="flex-1">
        <!-- Content rendered here -->
      </main>

      <footer class="border-t border-slate-800 bg-slate-950/50">
        <div class="mx-auto max-w-7xl px-4 py-3 text-xs text-slate-400 text-center">
          Delegate Multi-Tenant Platform • Offline-ready PWA • GitHub Pages friendly
        </div>
      </footer>

      <div id="modalRoot"></div>
    </div>
  `;
}

function navTab(view, label, currentView){
  const active = view === currentView;
  return `
    <button data-nav="${view}" class="px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
      active 
        ? 'text-cyan-400 border-b-2 border-cyan-400' 
        : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
    }">
      ${label}
    </button>
  `;
}

export function renderDashboard(state, currentUser){
  const user = state.users.find(u => u.UserId === currentUser.userId);
  const tenant = state.tenants.find(t => t.TenantId === currentUser.tenantId);
  
  // Get user's contracts
  const userContracts = filterByTenant(state.contracts, currentUser.tenantId) || [];
  
  // Get user's task assignments
  const userTaskAssignments = (state.taskAssignments || []).filter(ta => 
    ta.UserId === currentUser.userId && ta.TenantId === currentUser.tenantId
  );
  
  // Get assigned tasks
  const assignedTaskIds = userTaskAssignments.map(ta => ta.TaskNodeId);
  const assignedTasks = (state.taskNodes || []).filter(tn => 
    assignedTaskIds.includes(tn.TaskNodeId) && tn.Status !== 'Done'
  );
  
  // Get pending time entries (if PM)
  const pendingTimeEntries = user?.PartyType === 'Contractor' 
    ? (state.timeEntries || []).filter(te => te.State === 'Pending' && te.TenantId === currentUser.tenantId)
    : [];
  
  // Get active work sessions
  const activeWorkSessions = (state.workSessions || []).filter(ws => 
    ws.UserId === currentUser.userId && ws.State === 'Running'
  );
  
  // Get recent notifications
  const recentNotifications = (state.notifications || [])
    .filter(n => n.UserId === currentUser.userId)
    .sort((a, b) => new Date(b.CreatedUtc) - new Date(a.CreatedUtc))
    .slice(0, 5);
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Dashboard</h1>
        <p class="text-slate-400">Welcome back, ${escapeHtml(user?.DisplayName || 'User')}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div class="text-sm text-slate-400 mb-1">Active Contracts</div>
          <div class="text-2xl font-bold">${userContracts.filter(c => c.Status === 'Active').length}</div>
        </div>
        
        <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div class="text-sm text-slate-400 mb-1">My Tasks</div>
          <div class="text-2xl font-bold">${assignedTasks.length}</div>
        </div>
        
        <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div class="text-sm text-slate-400 mb-1">Pending Time Entries</div>
          <div class="text-2xl font-bold">${pendingTimeEntries.length}</div>
        </div>
        
        <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div class="text-sm text-slate-400 mb-1">Active Timers</div>
          <div class="text-2xl font-bold">${activeWorkSessions.length}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- My Contracts -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800 flex items-center justify-between">
            <div class="font-semibold">My Contracts</div>
            <button data-nav="contracts" class="px-3 py-1.5 rounded-lg text-xs bg-cyan-700 hover:bg-cyan-600">View All</button>
          </div>
          <div class="p-4">
            ${userContracts.length === 0 
              ? '<div class="text-sm text-slate-400">No contracts assigned</div>'
              : userContracts.map(c => `
                <div class="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer" data-contract-id="${c.ContractId}">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="font-medium">${escapeHtml(c.Name)}</div>
                      <div class="text-xs text-slate-400 mt-1">${escapeHtml(c.CustomerName)}</div>
                      <div class="text-xs text-slate-500 mt-1">
                        ${fmtDate(c.PopStartDate)} - ${fmtDate(c.PopEndDate)}
                      </div>
                      <div class="mt-2">
                        <span class="px-2 py-1 rounded-lg text-xs ${c.Status === 'Active' ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
                          ${c.Status}
                        </span>
                      </div>
                    </div>
                    <button data-view-contract="${c.ContractId}" class="px-2 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600">View</button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
        
        <!-- My Tasks -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800 flex items-center justify-between">
            <div class="font-semibold">My Active Tasks</div>
            <button data-nav="tasks" class="px-3 py-1.5 rounded-lg text-xs bg-cyan-700 hover:bg-cyan-600">View All</button>
          </div>
          <div class="p-4">
            ${assignedTasks.length === 0
              ? '<div class="text-sm text-slate-400">No active tasks</div>'
              : assignedTasks.slice(0, 5).map(t => `
                <div class="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer" data-task-id="${t.TaskNodeId}">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="font-medium text-sm">${escapeHtml(t.Title)}</div>
                      <div class="text-xs text-slate-400 mt-1">${escapeHtml(clampText(t.Description, 80))}</div>
                      <div class="mt-2">
                        <span class="px-2 py-1 rounded-lg text-xs ${statusColor(t.Status)}">
                          ${t.Status}
                        </span>
                      </div>
                    </div>
                    <button data-view-task="${t.TaskNodeId}" class="px-2 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600">View</button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
        
        <!-- Recent Notifications -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden lg:col-span-2">
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">Recent Notifications</div>
          </div>
          <div class="p-4">
            ${recentNotifications.length === 0
              ? '<div class="text-sm text-slate-400">No notifications</div>'
              : recentNotifications.map(n => `
                <div class="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 ${n.IsRead ? 'opacity-60' : ''}">
                  <div class="flex items-start gap-3">
                    <div class="flex-1">
                      <div class="font-medium text-sm">${escapeHtml(n.Title)}</div>
                      <div class="text-xs text-slate-400 mt-1">${escapeHtml(n.Body)}</div>
                      <div class="text-xs text-slate-500 mt-1">${fmtDateTime(n.CreatedUtc)}</div>
                    </div>
                    ${!n.IsRead ? '<div class="w-2 h-2 rounded-full bg-cyan-500"></div>' : ''}
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;
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

// ===== Contracts View =====
export function renderContracts(state, currentUser){
  const contracts = (state.contracts || []).filter(c => c.TenantId === currentUser.tenantId);
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">Contracts</h1>
          <p class="text-slate-400">Manage your active and past contracts</p>
        </div>
        <button id="btnCreateContract" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition flex items-center gap-2">
          <span>+</span> New Contract
        </button>
      </div>
      
      <div class="grid grid-cols-1 gap-4">
        ${contracts.map(c => `
          <div class="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition cursor-pointer" data-contract-id="${c.ContractId}">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-xl font-semibold mb-2">${escapeHtml(c.Name)}</h3>
                <div class="text-slate-400 mb-3">${escapeHtml(c.CustomerName)}</div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div class="text-slate-500 text-xs mb-1">Contract #</div>
                    <div class="font-mono">${escapeHtml(c.ContractNumber)}</div>
                  </div>
                  <div>
                    <div class="text-slate-500 text-xs mb-1">Period of Performance</div>
                    <div>${fmtDate(c.PopStartDate)} - ${fmtDate(c.PopEndDate)}</div>
                  </div>
                  <div>
                    <div class="text-slate-500 text-xs mb-1">Contract Value</div>
                    <div class="font-semibold">$${c.TotalValue?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <div class="text-slate-500 text-xs mb-1">Status</div>
                    <span class="px-2 py-1 rounded-lg text-xs ${c.Status === 'Active' ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
                      ${c.Status}
                    </span>
                  </div>
                </div>
                
                ${c.Description ? `<div class="text-sm text-slate-400 mt-3">${escapeHtml(c.Description)}</div>` : ''}
              </div>
              <div class="flex flex-col gap-2">
                <button data-view-contract="${c.ContractId}" class="px-3 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 whitespace-nowrap">View Details</button>
                <button data-edit-contract="${c.ContractId}" class="px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 whitespace-nowrap">Edit</button>
              </div>
            </div>
          </div>
        `).join('')}
        
        ${contracts.length === 0 ? `
          <div class="text-center py-12">
            <div class="text-slate-400 mb-4">No contracts found</div>
            <button id="btnCreateContractEmpty" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition">
              Create Your First Contract
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ===== Tasks View =====
export function renderTasks(state, currentUser){
  const userTaskAssignments = (state.taskAssignments || []).filter(ta => 
    ta.UserId === currentUser.userId && ta.TenantId === currentUser.tenantId
  );
  const assignedTaskIds = userTaskAssignments.map(ta => ta.TaskNodeId);
  const tasks = (state.taskNodes || []).filter(tn => assignedTaskIds.includes(tn.TaskNodeId));
  
  const groupedByStatus = {
    'NotStarted': tasks.filter(t => t.Status === 'NotStarted'),
    'InProgress': tasks.filter(t => t.Status === 'InProgress'),
    'Blocked': tasks.filter(t => t.Status === 'Blocked'),
    'Done': tasks.filter(t => t.Status === 'Done')
  };
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">My Tasks</h1>
          <p class="text-slate-400">Tasks assigned to you</p>
        </div>
        <button id="btnCreateTask" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition flex items-center gap-2">
          <span>+</span> New Task
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${Object.entries(groupedByStatus).map(([status, statusTasks]) => `
          <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
            <div class="p-4 border-b border-slate-800 flex items-center justify-between">
              <div class="font-semibold">${status.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div class="px-2 py-1 rounded-lg text-xs ${statusColor(status)}">${statusTasks.length}</div>
            </div>
            <div class="p-3 space-y-2 max-h-[600px] overflow-y-auto kanban-column" data-status="${status}">
              ${statusTasks.map(t => `
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-move group task-card" 
                     data-task-id="${t.TaskNodeId}" 
                     draggable="true">
                  <div class="font-medium text-sm mb-1">${escapeHtml(t.Title)}</div>
                  <div class="text-xs text-slate-400 mb-2">${escapeHtml(clampText(t.Description || '', 60))}</div>
                  ${t.ScopedHours ? `
                    <div class="text-xs text-slate-500 mb-2">
                      ${fmtHours(t.ChargedHours || 0)} / ${fmtHours(t.ScopedHours)} hrs
                    </div>
                  ` : ''}
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button data-view-task="${t.TaskNodeId}" class="px-2 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 flex-1">View</button>
                    <button data-edit-task="${t.TaskNodeId}" class="px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 flex-1">Edit</button>
                  </div>
                </div>
              `).join('')}
              ${statusTasks.length === 0 ? '<div class="text-sm text-slate-400 text-center py-4">No tasks</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== Timesheet View =====
export function renderTimesheet(state, currentUser){
  const timeEntries = (state.timeEntries || []).filter(te => 
    te.UserId === currentUser.userId && te.TenantId === currentUser.tenantId
  ).sort((a, b) => new Date(b.WorkDate) - new Date(a.WorkDate));
  
  const workSessions = (state.workSessions || []).filter(ws => 
    ws.UserId === currentUser.userId
  );
  
  const activeSession = workSessions.find(ws => ws.State === 'Running');
  const pausedSession = workSessions.find(ws => ws.State === 'Paused');
  
  // Get user's assigned tasks for time entry creation
  const userTaskAssignments = (state.taskAssignments || []).filter(ta => 
    ta.UserId === currentUser.userId && ta.TenantId === currentUser.tenantId
  );
  const assignedTaskIds = userTaskAssignments.map(ta => ta.TaskNodeId);
  const assignedTasks = (state.taskNodes || []).filter(tn => 
    assignedTaskIds.includes(tn.TaskNodeId)
  );
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">Timesheet</h1>
          <p class="text-slate-400">Track your time and manage work sessions</p>
        </div>
        <button id="btnCreateTimeEntry" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold">
          + New Time Entry
        </button>
      </div>
      
      <!-- Active Timer -->
      ${activeSession ? (() => {
        const timerTask = activeSession.TaskNodeId ? 
          (state.taskNodes || []).find(t => t.TaskNodeId === activeSession.TaskNodeId) : null;
        return `
        <div class="mb-6 p-6 rounded-2xl border-2 border-cyan-600 bg-cyan-950/20">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="text-sm text-slate-400 mb-1">Active Timer${timerTask ? ` - ${escapeHtml(timerTask.Title)}` : ''}</div>
              <div class="text-2xl font-bold mb-1" id="timerDisplay">00:00:00</div>
              <div class="text-sm text-slate-400">Started: ${fmtDateTime(activeSession.StartedUtc)}</div>
            </div>
            <div class="flex gap-2">
              <button id="btnPauseTimer" class="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 font-semibold">
                ⏸️ Pause
              </button>
              <button id="btnStopTimer" class="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 font-semibold">
                ⏹️ Stop
              </button>
            </div>
          </div>
        </div>
        `;
      })() : pausedSession ? `
        <div class="mb-6 p-6 rounded-2xl border-2 border-amber-600 bg-amber-950/20">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="text-sm text-slate-400 mb-1">Timer Paused</div>
              <div class="text-lg font-semibold mb-1">Session paused</div>
              <div class="text-sm text-slate-400">Started: ${fmtDateTime(pausedSession.StartedUtc)}</div>
            </div>
            <div class="flex gap-2">
              <button id="btnResumeTimer" class="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-semibold">
                ▶️ Resume
              </button>
              <button id="btnStopTimer" class="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 font-semibold">
                ⏹️ Stop
              </button>
            </div>
          </div>
        </div>
      ` : `
        <div class="mb-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="text-lg font-semibold mb-1">No active timer</div>
              <div class="text-sm text-slate-400 mb-3">Start a timer to track your work</div>
              ${assignedTasks.length > 0 ? `
                <select id="timerTaskSelect" class="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none text-sm">
                  <option value="">Select a task...</option>
                  ${assignedTasks.map(t => `
                    <option value="${t.TaskNodeId}">${escapeHtml(t.Title)}</option>
                  `).join('')}
                </select>
              ` : ''}
            </div>
            <button id="btnStartTimer" class="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-semibold">
              ▶️ Start Timer
            </button>
          </div>
        </div>
      `}
      
      <!-- Time Entries -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
        <div class="p-4 border-b border-slate-800">
          <div class="font-semibold">Time Entries</div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-900/40 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Task</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Hours</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">State</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Notes</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${timeEntries.slice(0, 20).map(te => {
                const task = state.taskNodes?.find(tn => tn.TaskNodeId === te.TaskNodeId);
                return `
                  <tr class="border-b border-slate-800/50 hover:bg-slate-900/30">
                    <td class="px-4 py-3">${fmtDate(te.WorkDate)}</td>
                    <td class="px-4 py-3">${escapeHtml(task?.Title || 'Unknown Task')}</td>
                    <td class="px-4 py-3 font-semibold">${fmtHours(te.NetMinutes)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 rounded-lg text-xs ${stateColor(te.State)}">
                        ${te.State}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-400">${escapeHtml(clampText(te.Notes || '', 50))}</td>
                    <td class="px-4 py-3">
                      ${te.State === 'Draft' ? `
                        <button class="px-2 py-1 text-xs rounded-lg bg-cyan-700 hover:bg-cyan-600" data-submit-entry="${te.TimeEntryId}">Submit</button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
              ${timeEntries.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-slate-400">No time entries yet</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function stateColor(state){
  const colors = {
    'Draft': 'bg-slate-800 text-slate-400',
    'Pending': 'bg-amber-900 text-amber-300',
    'Concurred': 'bg-emerald-900 text-emerald-300',
    'Rejected': 'bg-rose-900 text-rose-300'
  };
  return colors[state] || 'bg-slate-800 text-slate-400';
}

// ===== Forum View =====
export function renderForum(state, currentUser){
  const threads = (state.forumThreads || []).filter(t => t.TenantId === currentUser.tenantId)
    .sort((a, b) => new Date(b.CreatedUtc) - new Date(a.CreatedUtc));
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">Forum</h1>
          <p class="text-slate-400">Discussions, blockers, and decisions</p>
        </div>
        <button id="btnCreateForumThread" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition flex items-center gap-2">
          <span>+</span> New Thread
        </button>
      </div>
      
      <div class="space-y-4">
        ${threads.map(thread => {
          const posts = (state.forumPosts || []).filter(p => p.ThreadId === thread.ThreadId);
          const author = state.users?.find(u => u.UserId === thread.CreatedBy);
          
          return `
            <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden hover:border-slate-700 transition cursor-pointer" data-thread-id="${thread.ThreadId}">
              <div class="p-4 border-b border-slate-800">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold">${escapeHtml(thread.Title)}</h3>
                      ${thread.IsBlocking ? '<span class="px-2 py-1 rounded-lg text-xs bg-rose-900 text-rose-300">🚫 Blocker</span>' : ''}
                      ${thread.RequiresDecision ? '<span class="px-2 py-1 rounded-lg text-xs bg-amber-900 text-amber-300">⚠️ Decision Required</span>' : ''}
                      ${thread.IsClosed ? '<span class="px-2 py-1 rounded-lg text-xs bg-slate-800 text-slate-400">Closed</span>' : ''}
                    </div>
                    <div class="text-sm text-slate-400">
                      Posted by ${escapeHtml(author?.DisplayName || 'Unknown')} • ${fmtDateTime(thread.CreatedUtc)}
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <button data-view-thread="${thread.ThreadId}" class="px-3 py-1.5 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 whitespace-nowrap">View Thread</button>
                    <button data-reply-thread="${thread.ThreadId}" class="px-3 py-1.5 rounded-lg text-xs bg-cyan-800 hover:bg-cyan-700 whitespace-nowrap">Reply</button>
                  </div>
                </div>
              </div>
              
              ${posts.length > 0 ? `
                <div class="p-4 space-y-3">
                  ${posts.slice(0, 3).map(post => {
                    const postAuthor = state.users?.find(u => u.UserId === post.CreatedBy);
                    return `
                      <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div class="flex items-start gap-3">
                          <div class="flex-1">
                            <div class="text-sm font-medium mb-1">${escapeHtml(postAuthor?.DisplayName || 'Unknown')}</div>
                            <div class="text-sm text-slate-300">${escapeHtml(post.Body)}</div>
                            <div class="text-xs text-slate-500 mt-2">${fmtDateTime(post.CreatedUtc)}</div>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                  ${posts.length > 3 ? `<div class="text-sm text-slate-400 text-center">+ ${posts.length - 3} more replies</div>` : ''}
                </div>
              ` : `
                <div class="p-4 text-sm text-slate-400 text-center">No replies yet. Be the first to reply!</div>
              `}
            </div>
          `;
        }).join('')}
        
        ${threads.length === 0 ? `
          <div class="text-center py-12">
            <div class="text-slate-400 mb-4">No forum threads yet</div>
            <button id="btnCreateForumThreadEmpty" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold transition">
              Start a Discussion
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ===== Chat View =====
export function renderChat(state, currentUser){
  const chatThreads = (state.chatThreads || []).filter(t => t.TenantId === currentUser.tenantId)
    .sort((a, b) => new Date(b.LastMessageUtc) - new Date(a.LastMessageUtc));
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Chat</h1>
        <p class="text-slate-400">Team conversations and direct messages</p>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Thread list -->
        <div class="lg:col-span-1 border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">Conversations</div>
          </div>
          <div class="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            ${chatThreads.map((thread, idx) => `
              <button class="w-full text-left p-4 hover:bg-slate-900/40 ${idx === 0 ? 'bg-slate-900/40' : ''}" data-chat-thread="${thread.ThreadId}" aria-label="Select conversation: ${escapeHtml(thread.Title)}">
                <div class="font-medium text-sm mb-1">${escapeHtml(thread.Title)}</div>
                <div class="text-xs text-slate-400">${fmtDateTime(thread.LastMessageUtc)}</div>
              </button>
            `).join('')}
            ${chatThreads.length === 0 ? '<div class="p-4 text-sm text-slate-400 text-center">No conversations</div>' : ''}
          </div>
        </div>
        
        <!-- Chat messages -->
        <div id="chatMessagesContainer" class="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          ${chatThreads.length > 0 ? renderChatMessages(state, chatThreads[0]) : `
            <div class="p-8 text-center text-slate-400">
              Select a conversation to view messages
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderChatMessages(state, thread){
  const messages = (state.chatMessages || []).filter(m => m.ThreadId === thread.ThreadId)
    .sort((a, b) => new Date(a.SentUtc) - new Date(b.SentUtc));
  
  // Get participants
  const participants = (state.chatParticipants || []).filter(p => p.ThreadId === thread.ThreadId);
  const participantUsers = participants.map(p => {
    const user = (state.users || []).find(u => u.UserId === p.UserId);
    return user ? user.DisplayName : 'Unknown';
  }).join(', ');
  
  return `
    <div class="flex flex-col h-[600px]">
      <div class="p-4 border-b border-slate-800">
        <div class="font-semibold">${escapeHtml(thread.Title)}</div>
        ${participantUsers ? `<div class="text-xs text-slate-400 mt-1">Participants: ${escapeHtml(participantUsers)}</div>` : ''}
      </div>
      
      <div id="chatMessagesList" class="flex-1 p-4 space-y-3 overflow-y-auto">
        ${messages.map(msg => {
          const author = state.users?.find(u => u.UserId === msg.SentBy);
          return `
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                ${(author?.DisplayName || 'U').charAt(0).toUpperCase()}
              </div>
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-sm font-medium">${escapeHtml(author?.DisplayName || 'Unknown')}</span>
                  <span class="text-xs text-slate-500">${fmtDateTime(msg.SentUtc)}</span>
                </div>
                <div class="text-sm text-slate-300">${escapeHtml(msg.Body)}</div>
              </div>
            </div>
          `;
        }).join('')}
        ${messages.length === 0 ? '<div class="text-sm text-slate-400 text-center py-8">No messages yet</div>' : ''}
      </div>
      
      <div class="p-4 border-t border-slate-800">
        <div class="flex gap-2">
          <input type="text" id="chatMessageInput" data-thread-id="${thread.ThreadId}" placeholder="Type a message..." class="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none text-sm" />
          <button id="btnSendChatMessage" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold text-sm">Send</button>
        </div>
      </div>
    </div>
  `;
}

// ===== Calendar View =====
export function renderCalendar(state, currentUser){
  const meetings = (state.meetings || []).filter(m => m.TenantId === currentUser.tenantId)
    .sort((a, b) => new Date(a.StartUtc) - new Date(b.StartUtc));
  
  const deadlines = (state.deadlines || []).filter(d => d.TenantId === currentUser.tenantId)
    .sort((a, b) => new Date(a.DeadlineUtc) - new Date(b.DeadlineUtc));
  
  const upcomingMeetings = meetings.filter(m => new Date(m.StartUtc) > new Date());
  const upcomingDeadlines = deadlines.filter(d => new Date(d.DeadlineUtc) > new Date());
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">Calendar</h1>
          <p class="text-slate-400">Meetings and deadlines</p>
        </div>
        <div class="flex gap-2">
          <button id="btnCreateMeeting" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold text-sm">
            + New Meeting
          </button>
          <button id="btnCreateDeadline" class="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 font-semibold text-sm">
            + New Deadline
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Upcoming Meetings -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">Upcoming Meetings</div>
          </div>
          <div class="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            ${upcomingMeetings.slice(0, 10).map(meeting => {
              const organizer = state.users?.find(u => u.UserId === meeting.Organizer);
              const attendees = (state.meetingAttendees || []).filter(a => a.MeetingId === meeting.MeetingId);
              
              return `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div class="font-medium mb-1">${escapeHtml(meeting.Title)}</div>
                  <div class="text-sm text-slate-400 mb-2">
                    📅 ${fmtDateTime(meeting.StartUtc)}
                  </div>
                  ${meeting.Location ? `<div class="text-sm text-slate-400 mb-2">📍 ${escapeHtml(meeting.Location)}</div>` : ''}
                  <div class="text-xs text-slate-500">
                    Organized by ${escapeHtml(organizer?.DisplayName || 'Unknown')} • ${attendees.length} attendees
                  </div>
                </div>
              `;
            }).join('')}
            ${upcomingMeetings.length === 0 ? '<div class="text-sm text-slate-400 text-center py-8">No upcoming meetings</div>' : ''}
          </div>
        </div>
        
        <!-- Upcoming Deadlines -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">Upcoming Deadlines</div>
          </div>
          <div class="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            ${upcomingDeadlines.slice(0, 10).map(deadline => {
              const task = state.taskNodes?.find(t => t.TaskNodeId === deadline.TaskNodeId);
              const contract = state.contracts?.find(c => c.ContractId === deadline.ContractId);
              
              return `
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div class="font-medium mb-1">${escapeHtml(deadline.Title)}</div>
                  <div class="text-sm text-slate-400 mb-2">
                    🕒 ${fmtDateTime(deadline.DeadlineUtc)}
                  </div>
                  ${task ? `<div class="text-sm text-slate-400 mb-1">Task: ${escapeHtml(task.Title)}</div>` : ''}
                  ${contract ? `<div class="text-sm text-slate-400">Contract: ${escapeHtml(contract.Name)}</div>` : ''}
                </div>
              `;
            }).join('')}
            ${upcomingDeadlines.length === 0 ? '<div class="text-sm text-slate-400 text-center py-8">No upcoming deadlines</div>' : ''}
          </div>
        </div>
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

// User Profile Page
export function renderUserProfile(state, currentUser){
  const user = state.users.find(u => u.UserId === currentUser.userId);
  if(!user) return '<div class="p-4">User not found</div>';
  
  // Get user roles
  const userRoles = (state.userRoles || []).filter(ur => 
    ur.UserId === currentUser.userId && ur.TenantId === currentUser.tenantId && ur.IsActive
  );
  const roles = userRoles.map(ur => {
    const role = (state.roles || []).find(r => r.RoleId === ur.RoleId);
    return role?.Name || ur.RoleId;
  });
  
  // Get user skills
  const userSkills = (state.userSkills || []).filter(us => 
    us.UserId === currentUser.userId && us.TenantId === currentUser.tenantId
  );
  const skills = userSkills.map(us => {
    const skill = (state.skills || []).find(s => s.SkillId === us.SkillId);
    return { skill, proficiency: us.ProficiencyLevel };
  });
  
  // Get recent time entries
  const recentTimeEntries = (state.timeEntries || [])
    .filter(te => te.UserId === currentUser.userId)
    .sort((a, b) => new Date(b.WorkDate) - new Date(a.WorkDate))
    .slice(0, 5);
  
  return `
    <div class="p-4 space-y-6 mx-auto max-w-5xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">User Profile</h1>
      </div>
      
      <!-- User Info Card -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-slate-400">Display Name</div>
            <div class="text-lg font-semibold">${escapeHtml(user.DisplayName)}</div>
          </div>
          <div>
            <div class="text-sm text-slate-400">Email</div>
            <div>${escapeHtml(user.Email)}</div>
          </div>
          <div>
            <div class="text-sm text-slate-400">Party Type</div>
            <div>${escapeHtml(user.PartyType)}</div>
          </div>
          <div>
            <div class="text-sm text-slate-400">Timezone</div>
            <div>${escapeHtml(user.TimezoneIANA || 'Not set')}</div>
          </div>
        </div>
      </div>
      
      <!-- Roles -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">Roles</h2>
        <div class="flex flex-wrap gap-2">
          ${roles.length === 0 ? '<div class="text-slate-400">No roles assigned</div>' : ''}
          ${roles.map(r => `
            <span class="px-3 py-1 rounded-lg bg-slate-800 text-sm">${escapeHtml(r)}</span>
          `).join('')}
        </div>
      </div>
      
      <!-- Skills -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Skills</h2>
          <button id="btnManageSkills" class="px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-sm font-semibold">
            + Add Skill
          </button>
        </div>
        ${skills.length === 0 ? '<div class="text-slate-400">No skills recorded</div>' : ''}
        <div class="space-y-3">
          ${skills.map(s => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800">
              <div>
                <div class="font-medium">${escapeHtml(s.skill?.Name || 'Unknown Skill')}</div>
                <div class="text-sm text-slate-400">${escapeHtml(s.skill?.Category || '')}</div>
              </div>
              <div class="flex items-center gap-2">
                <div class="px-3 py-1 rounded-lg ${
                  s.proficiency === 'Expert' ? 'bg-emerald-900 text-emerald-300' :
                  s.proficiency === 'Advanced' ? 'bg-cyan-900 text-cyan-300' :
                  s.proficiency === 'Intermediate' ? 'bg-blue-900 text-blue-300' :
                  'bg-slate-700 text-slate-300'
                } text-xs font-semibold">${escapeHtml(s.proficiency)}</div>
                <button data-remove-skill="${s.skill?.SkillId}" class="px-2 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Recent Time Entries -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">Recent Time Entries</h2>
        ${recentTimeEntries.length === 0 ? '<div class="text-slate-400">No time entries</div>' : ''}
        <div class="space-y-2">
          ${recentTimeEntries.map(te => {
            const task = (state.taskNodes || []).find(t => t.TaskNodeId === te.TaskNodeId);
            return `
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800">
                <div class="flex-1">
                  <div class="font-medium text-sm">${escapeHtml(task?.Title || 'Unknown Task')}</div>
                  <div class="text-xs text-slate-400">${fmtDate(te.WorkDate)}</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-sm">${fmtHours(te.NetMinutes)}</div>
                  <span class="px-2 py-1 rounded-lg text-xs ${
                    te.State === 'Concurred' ? 'bg-emerald-900 text-emerald-300' :
                    te.State === 'Pending' ? 'bg-amber-900 text-amber-300' :
                    te.State === 'Draft' ? 'bg-slate-700 text-slate-300' :
                    'bg-slate-700 text-slate-300'
                  }">${escapeHtml(te.State)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Reports Page (Advanced Reporting feature)
export function renderReports(state, currentUser){
  const tenantContracts = (state.contracts || []).filter(c => c.TenantId === currentUser.tenantId);
  const tenantTasks = (state.taskNodes || []).filter(t => t.TenantId === currentUser.tenantId);
  const tenantTimeEntries = (state.timeEntries || []).filter(te => te.TenantId === currentUser.tenantId);
  
  // Calculate hours by task
  const taskHours = {};
  tenantTimeEntries.forEach(te => {
    if(!taskHours[te.TaskNodeId]) taskHours[te.TaskNodeId] = 0;
    taskHours[te.TaskNodeId] += (te.NetMinutes || 0) / 60;
  });
  
  const topTasks = Object.entries(taskHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([taskId, hours]) => {
      const task = tenantTasks.find(t => t.TaskNodeId === taskId);
      return { task, hours };
    });
  
  // Calculate total hours
  const totalHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  
  // Calculate hours by user
  const userHours = {};
  tenantTimeEntries.forEach(te => {
    if(!userHours[te.UserId]) userHours[te.UserId] = 0;
    userHours[te.UserId] += (te.NetMinutes || 0) / 60;
  });
  
  const topUsers = Object.entries(userHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, hours]) => {
      const user = (state.users || []).find(u => u.UserId === userId);
      return { user, hours };
    });
  
  return `
    <div class="p-4 space-y-6 mx-auto max-w-7xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">📊 Advanced Reports</h1>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-4">
          <div class="text-sm text-slate-400">Total Contracts</div>
          <div class="text-2xl font-bold">${tenantContracts.length}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-4">
          <div class="text-sm text-slate-400">Total Tasks</div>
          <div class="text-2xl font-bold">${tenantTasks.length}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-4">
          <div class="text-sm text-slate-400">Total Hours</div>
          <div class="text-2xl font-bold">${totalHours.toFixed(1)}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-4">
          <div class="text-sm text-slate-400">Time Entries</div>
          <div class="text-2xl font-bold">${tenantTimeEntries.length}</div>
        </div>
      </div>
      
      <!-- Top Tasks by Hours -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">Top Tasks by Hours</h2>
        <div class="space-y-2">
          ${topTasks.map(t => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800">
              <div class="flex-1">
                <div class="font-medium text-sm">${escapeHtml(t.task?.Title || 'Unknown Task')}</div>
                <div class="text-xs text-slate-400">${escapeHtml(t.task?.TaskNodeId || '')}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold">${t.hours.toFixed(1)} hrs</div>
                <div class="text-xs text-slate-400">${((t.hours / totalHours) * 100).toFixed(1)}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Top Users by Hours -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">Team Utilization</h2>
        <div class="space-y-2">
          ${topUsers.map(u => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800">
              <div class="flex-1">
                <div class="font-medium text-sm">${escapeHtml(u.user?.DisplayName || 'Unknown User')}</div>
                <div class="text-xs text-slate-400">${escapeHtml(u.user?.PartyType || '')}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold">${u.hours.toFixed(1)} hrs</div>
                <div class="text-xs text-slate-400">${((u.hours / totalHours) * 100).toFixed(1)}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// AI Assistant Page
export function renderAIAssistant(state, currentUser){
  const aiPolicy = state.aiPolicy?.[0];
  const conversations = (state.aiConversations || []).filter(c => c.UserId === currentUser.userId);
  
  return `
    <div class="p-4 space-y-6 mx-auto max-w-4xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">🤖 AI Assistant</h1>
      </div>
      
      <!-- AI Policy Notice -->
      ${aiPolicy ? `
        <div class="border border-cyan-800 rounded-2xl bg-cyan-950/30 p-6">
          <h2 class="text-lg font-semibold mb-2">AI Usage Policy</h2>
          <div class="text-sm text-slate-300 space-y-2">
            <div><strong>Allowed:</strong> ${escapeHtml(aiPolicy.AllowedUseCases || 'Not specified')}</div>
            <div><strong>Prohibited:</strong> ${escapeHtml(aiPolicy.ProhibitedUseCases || 'Not specified')}</div>
            <div><strong>Data Retention:</strong> ${escapeHtml(aiPolicy.DataRetentionPolicy || 'Not specified')}</div>
            ${aiPolicy.RequiresApproval ? '<div class="text-amber-400">⚠️ AI usage requires approval</div>' : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Placeholder Interface -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">AI Chat Interface</h2>
        <div class="space-y-4">
          <div class="h-64 border border-slate-700 rounded-xl bg-slate-950 p-4 overflow-y-auto">
            <div class="text-center text-slate-500 py-8">
              AI Assistant conversation interface<br/>
              <span class="text-sm">Coming soon</span>
            </div>
          </div>
          <div class="flex gap-2">
            <input type="text" placeholder="Ask the AI assistant..." class="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-600 focus:outline-none" disabled />
            <button class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold" disabled>Send</button>
          </div>
        </div>
      </div>
      
      <!-- Conversation History -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">Conversation History</h2>
        ${conversations.length === 0 ? `
          <div class="text-center text-slate-400 py-8">No conversations yet</div>
        ` : `
          <div class="space-y-2">
            ${conversations.map(c => `
              <div class="p-3 rounded-xl bg-slate-800">
                <div class="font-medium text-sm">${escapeHtml(c.Title || 'Untitled Conversation')}</div>
                <div class="text-xs text-slate-400">${fmtDateTime(c.CreatedUtc)}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// PTO / Leave Management
export function renderPTO(state, currentUser){
  const ptoEntries = (state.ptoEntries || []).filter(p => 
    p.TenantId === currentUser.tenantId
  ).sort((a, b) => new Date(b.CreatedUtc) - new Date(a.CreatedUtc));
  
  const myEntries = ptoEntries.filter(p => p.UserId === currentUser.userId);
  const pendingApprovals = ptoEntries.filter(p => p.Status === 'Submitted');
  
  return `
    <div class="p-4 space-y-6 mx-auto max-w-7xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">PTO / Leave Management</h1>
        <button id="btnCreatePTO" class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold">
          + Request PTO
        </button>
      </div>
      
      <!-- My PTO Requests -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
        <h2 class="text-xl font-semibold mb-4">My PTO Requests</h2>
        ${myEntries.length === 0 ? '<div class="text-slate-400">No PTO requests</div>' : ''}
        <div class="space-y-2">
          ${myEntries.map(p => `
            <div class="flex items-center justify-between p-4 rounded-xl bg-slate-800">
              <div class="flex-1">
                <div class="font-medium">${escapeHtml(p.Category)} - ${escapeHtml(p.Type)}</div>
                <div class="text-sm text-slate-400">${fmtDate(p.StartUtc)} to ${fmtDate(p.EndUtc)} (${p.Hours}h)</div>
                ${p.Notes ? `<div class="text-sm text-slate-400 mt-1">${escapeHtml(p.Notes)}</div>` : ''}
              </div>
              <span class="px-3 py-1 rounded-lg text-sm ${
                p.Status === 'Approved' ? 'bg-emerald-900 text-emerald-300' :
                p.Status === 'Submitted' ? 'bg-amber-900 text-amber-300' :
                'bg-slate-700 text-slate-300'
              }">${escapeHtml(p.Status)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Pending Approvals (for approvers) -->
      ${pendingApprovals.length > 0 ? `
        <div class="border border-slate-800 rounded-2xl bg-slate-900/50 p-6">
          <h2 class="text-xl font-semibold mb-4">Pending Approvals</h2>
          <div class="space-y-2">
            ${pendingApprovals.map(p => {
              const user = (state.users || []).find(u => u.UserId === p.UserId);
              return `
                <div class="flex items-center justify-between p-4 rounded-xl bg-slate-800">
                  <div class="flex-1">
                    <div class="font-medium">${escapeHtml(user?.DisplayName || 'Unknown User')}</div>
                    <div class="text-sm text-slate-400">${escapeHtml(p.Category)} - ${fmtDate(p.StartUtc)} to ${fmtDate(p.EndUtc)} (${p.Hours}h)</div>
                    ${p.Notes ? `<div class="text-sm text-slate-400 mt-1">${escapeHtml(p.Notes)}</div>` : ''}
                  </div>
                  <div class="flex gap-2">
                    <button class="px-3 py-1 text-sm rounded-lg bg-emerald-700 hover:bg-emerald-600" data-approve-pto="${p.PtoEntryId}">Approve</button>
                    <button class="px-3 py-1 text-sm rounded-lg bg-rose-700 hover:bg-rose-600" data-deny-pto="${p.PtoEntryId}">Deny</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Audit Log Viewer
export function renderAuditLog(state, currentUser){
  const auditLogs = (state.auditLogs || [])
    .filter(log => log.TenantId === currentUser.tenantId)
    .sort((a, b) => new Date(b.TimestampUtc) - new Date(a.TimestampUtc))
    .slice(0, 100);
  
  return `
    <div class="p-4 space-y-6 mx-auto max-w-7xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Audit Log</h1>
        <div class="text-sm text-slate-400">Last 100 entries</div>
      </div>
      
      <div class="border border-slate-800 rounded-2xl bg-slate-900/50 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-900/40 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Timestamp</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">User</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Action</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                <th class="px-4 py-3 text-left font-medium text-slate-400">Details</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.map(log => {
                const user = (state.users || []).find(u => u.UserId === log.UserId);
                return `
                  <tr class="border-b border-slate-800/50 hover:bg-slate-900/30">
                    <td class="px-4 py-3 text-xs">${fmtDateTime(log.TimestampUtc)}</td>
                    <td class="px-4 py-3">${escapeHtml(user?.DisplayName || 'Unknown')}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 rounded-lg text-xs bg-slate-700">${escapeHtml(log.Action)}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-400">${escapeHtml(log.EntityType)}</td>
                    <td class="px-4 py-3 text-slate-400 text-xs">${escapeHtml(clampText(log.Details || '', 60))}</td>
                  </tr>
                `;
              }).join('')}
              ${auditLogs.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-slate-400">No audit logs</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
