import { clampText, fmtDate, fmtDateTime, fmtHours } from "./utils.js";
import { filterByTenant, getUnreadNotifications } from "./state.js";

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
  
  return `
    <div class="flex flex-col min-h-screen">
      <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <img src="./assets/icons/icon-192.png" alt="Delegate" class="w-10 h-10 rounded-xl shadow" />
          <div class="flex-1">
            <div class="text-lg font-semibold leading-tight">Delegate</div>
            <div class="text-xs text-slate-400 -mt-0.5">${escapeHtml(tenant?.Name || 'Platform')}</div>
          </div>
          
          <div class="flex items-center gap-3">
            ${unreadCount > 0 ? `
              <button class="relative px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                <span class="text-sm">🔔</span>
                <span class="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-600 rounded-full">${unreadCount}</span>
              </button>
            ` : ''}
            
            <div class="text-sm">
              <div class="font-medium">${escapeHtml(user?.DisplayName || 'User')}</div>
              <div class="text-xs text-slate-400">${escapeHtml(user?.PartyType || '')}</div>
            </div>
            
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
            ${navTab('chat', '💭 Chat', currentView)}
            ${navTab('calendar', '📅 Calendar', currentView)}
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
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">My Contracts</div>
          </div>
          <div class="p-4">
            ${userContracts.length === 0 
              ? '<div class="text-sm text-slate-400">No contracts assigned</div>'
              : userContracts.map(c => `
                <div class="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
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
              `).join('')
            }
          </div>
        </div>
        
        <!-- My Tasks -->
        <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
          <div class="p-4 border-b border-slate-800">
            <div class="font-semibold">My Active Tasks</div>
          </div>
          <div class="p-4">
            ${assignedTasks.length === 0
              ? '<div class="text-sm text-slate-400">No active tasks</div>'
              : assignedTasks.slice(0, 5).map(t => `
                <div class="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div class="font-medium text-sm">${escapeHtml(t.Title)}</div>
                  <div class="text-xs text-slate-400 mt-1">${escapeHtml(clampText(t.Description, 80))}</div>
                  <div class="mt-2">
                    <span class="px-2 py-1 rounded-lg text-xs ${statusColor(t.Status)}">
                      ${t.Status}
                    </span>
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
      </div>
      
      <div class="grid grid-cols-1 gap-4">
        ${contracts.map(c => `
          <div class="p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
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
            </div>
          </div>
        `).join('')}
        
        ${contracts.length === 0 ? '<div class="text-center py-12 text-slate-400">No contracts found</div>' : ''}
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
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">My Tasks</h1>
        <p class="text-slate-400">Tasks assigned to you</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${Object.entries(groupedByStatus).map(([status, statusTasks]) => `
          <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
            <div class="p-4 border-b border-slate-800 flex items-center justify-between">
              <div class="font-semibold">${status.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div class="px-2 py-1 rounded-lg text-xs ${statusColor(status)}">${statusTasks.length}</div>
            </div>
            <div class="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              ${statusTasks.map(t => `
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div class="font-medium text-sm mb-1">${escapeHtml(t.Title)}</div>
                  <div class="text-xs text-slate-400 mb-2">${escapeHtml(clampText(t.Description || '', 60))}</div>
                  ${t.ScopedHours ? `
                    <div class="text-xs text-slate-500">
                      ${fmtHours(t.ChargedHours || 0)} / ${fmtHours(t.ScopedHours)} hrs
                    </div>
                  ` : ''}
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
  
  return `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Timesheet</h1>
        <p class="text-slate-400">Track your time and manage work sessions</p>
      </div>
      
      <!-- Active Timer -->
      ${activeSession ? `
        <div class="mb-6 p-6 rounded-2xl border-2 border-cyan-600 bg-cyan-950/20">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="text-sm text-slate-400 mb-1">Active Timer</div>
              <div class="text-2xl font-bold mb-1" id="timerDisplay">00:00:00</div>
              <div class="text-sm text-slate-400">Started: ${fmtDateTime(activeSession.StartUtc)}</div>
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
      ` : `
        <div class="mb-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="text-lg font-semibold mb-1">No active timer</div>
              <div class="text-sm text-slate-400">Start a timer to track your work</div>
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
              </tr>
            </thead>
            <tbody>
              ${timeEntries.slice(0, 20).map(te => {
                const task = state.taskNodes?.find(tn => tn.TaskNodeId === te.TaskNodeId);
                return `
                  <tr class="border-b border-slate-800/50 hover:bg-slate-900/30">
                    <td class="px-4 py-3">${fmtDate(te.WorkDate)}</td>
                    <td class="px-4 py-3">${escapeHtml(task?.Title || 'Unknown Task')}</td>
                    <td class="px-4 py-3 font-semibold">${fmtHours(te.Hours)}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 rounded-lg text-xs ${stateColor(te.State)}">
                        ${te.State}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-400">${escapeHtml(clampText(te.Notes || '', 50))}</td>
                  </tr>
                `;
              }).join('')}
              ${timeEntries.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-slate-400">No time entries yet</td>
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
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Forum</h1>
        <p class="text-slate-400">Discussions, blockers, and decisions</p>
      </div>
      
      <div class="space-y-4">
        ${threads.map(thread => {
          const posts = (state.forumPosts || []).filter(p => p.ThreadId === thread.ThreadId);
          const author = state.users?.find(u => u.UserId === thread.CreatedBy);
          
          return `
            <div class="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
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
                  <div class="text-sm text-slate-400">${posts.length} ${posts.length === 1 ? 'reply' : 'replies'}</div>
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
              ` : ''}
            </div>
          `;
        }).join('')}
        
        ${threads.length === 0 ? '<div class="text-center py-12 text-slate-400">No forum threads yet</div>' : ''}
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
              <div class="p-4 hover:bg-slate-900/40 cursor-pointer ${idx === 0 ? 'bg-slate-900/40' : ''}">
                <div class="font-medium text-sm mb-1">${escapeHtml(thread.Title)}</div>
                <div class="text-xs text-slate-400">${fmtDateTime(thread.LastMessageUtc)}</div>
              </div>
            `).join('')}
            ${chatThreads.length === 0 ? '<div class="p-4 text-sm text-slate-400 text-center">No conversations</div>' : ''}
          </div>
        </div>
        
        <!-- Chat messages -->
        <div class="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
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
  
  return `
    <div class="flex flex-col h-[600px]">
      <div class="p-4 border-b border-slate-800">
        <div class="font-semibold">${escapeHtml(thread.Title)}</div>
      </div>
      
      <div class="flex-1 p-4 space-y-3 overflow-y-auto">
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
          <input type="text" placeholder="Type a message..." class="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none text-sm" />
          <button class="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 font-semibold text-sm">Send</button>
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
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Calendar</h1>
        <p class="text-slate-400">Meetings and deadlines</p>
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
