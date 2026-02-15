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

export function appShell(state, currentUser){
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

export function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
