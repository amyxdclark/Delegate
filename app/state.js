import { uid } from "./utils.js";

const STORAGE_KEY = "delegate:data:v2";
const CURRENT_USER_KEY = "delegate:currentUser";

// Load all data files from seed.json manifest
export async function loadSeed(){
  const manifestResp = await fetch("./data/seed.json", { cache: "no-store" });
  if(!manifestResp.ok) throw new Error("Failed to load seed.json");
  const manifest = await manifestResp.json();
  
  const state = { version: manifest.version, meta: manifest.meta };
  
  // Load each data file listed in manifest
  for(const filename of manifest.dataFiles){
    const key = filename.replace('.json', '');
    const resp = await fetch(`./data/${filename}`, { cache: "no-store" });
    if(!resp.ok) continue; // Skip missing files
    state[key] = await resp.json();
  }
  
  return state;
}

export async function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e) { console.error("Failed to parse state", e); }
  }
  const seed = await loadSeed();
  saveState(seed);
  return seed;
}

export function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetToSeed(seed){
  saveState(seed);
  localStorage.removeItem(CURRENT_USER_KEY);
  return seed;
}

export function exportState(state){
  return JSON.parse(JSON.stringify(state));
}

// Current user session management
export function getCurrentUser(){
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setCurrentUser(userId, tenantId){
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ userId, tenantId }));
}

export function clearCurrentUser(){
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Tenant filtering helpers
export function filterByTenant(items, tenantId){
  if(!items) return [];
  return items.filter(item => item.TenantId === tenantId || item.tenantId === tenantId);
}

// Generic CRUD operations
export function findById(collection, id, idField = 'id'){
  if(!collection) return null;
  return collection.find(item => item[idField] === id);
}

export function updateById(collection, id, patch, idField = 'id'){
  const item = findById(collection, id, idField);
  if(!item) return null;
  Object.assign(item, patch);
  return item;
}

export function deleteById(collection, id, idField = 'id'){
  if(!collection) return false;
  const idx = collection.findIndex(item => item[idField] === id);
  if(idx < 0) return false;
  collection.splice(idx, 1);
  return true;
}

export function addToCollection(collection, item){
  if(!collection) return null;
  collection.push(item);
  return item;
}

// Task hierarchy and rollup calculations
export function getTaskChildren(state, taskNodeId){
  if(!state.taskNodes) return [];
  return state.taskNodes.filter(t => t.ParentTaskNodeId === taskNodeId);
}

export function getTaskDescendants(state, taskNodeId){
  const children = getTaskChildren(state, taskNodeId);
  const descendants = [...children];
  for(const child of children){
    descendants.push(...getTaskDescendants(state, child.TaskNodeId));
  }
  return descendants;
}

export function calculateTaskRollup(state, taskNodeId){
  const task = findById(state.taskNodes, taskNodeId, 'TaskNodeId');
  if(!task) return { scopedHours: 0, allocatedHours: 0, chargedHours: 0 };
  
  const children = getTaskChildren(state, taskNodeId);
  
  // If no children, return task's own hours
  if(children.length === 0){
    const chargedHours = calculateChargedHours(state, taskNodeId);
    return {
      scopedHours: task.ScopedHours || 0,
      allocatedHours: task.AllocatedHours || 0,
      chargedHours
    };
  }
  
  // Roll up from children
  let totalScoped = 0;
  let totalAllocated = 0;
  let totalCharged = 0;
  
  for(const child of children){
    const childRollup = calculateTaskRollup(state, child.TaskNodeId);
    totalScoped += childRollup.scopedHours;
    totalAllocated += childRollup.allocatedHours;
    totalCharged += childRollup.chargedHours;
  }
  
  return {
    scopedHours: totalScoped,
    allocatedHours: totalAllocated,
    chargedHours: totalCharged
  };
}

export function calculateChargedHours(state, taskNodeId){
  if(!state.timeEntries) return 0;
  const entries = state.timeEntries.filter(te => 
    te.TaskNodeId === taskNodeId && 
    (te.State === 'Concurred' || te.State === 'Pending')
  );
  return entries.reduce((sum, te) => sum + (te.NetMinutes || 0) / 60, 0);
}

// Time entry state machine
export function transitionTimeEntry(state, timeEntryId, toState, userId){
  const te = findById(state.timeEntries, timeEntryId, 'TimeEntryId');
  if(!te) return null;
  
  const validTransitions = {
    'Draft': ['Pending'],
    'Pending': ['Concurred', 'Returned', 'Rejected'],
    'Returned': ['Pending'],
    'Concurred': [],
    'Rejected': []
  };
  
  if(!validTransitions[te.State]?.includes(toState)) return null;
  
  te.State = toState;
  const now = new Date().toISOString();
  
  if(toState === 'Pending') te.SubmittedUtc = now;
  if(toState === 'Concurred'){
    te.ConcurredByUserId = userId;
    te.ConcurredUtc = now;
    te.LockedUtc = now;
  }
  
  return te;
}

// Work session management
export function startWorkSession(state, userId, tenantId, taskNodeId, notes = ''){
  const session = {
    WorkSessionId: uid('WS'),
    TenantId: tenantId,
    UserId: userId,
    TaskNodeId: taskNodeId,
    State: 'Running',
    StartedUtc: new Date().toISOString(),
    StoppedUtc: null,
    Notes: notes,
    CreatedUtc: new Date().toISOString()
  };
  addToCollection(state.workSessions, session);
  return session;
}

export function pauseWorkSession(state, workSessionId){
  const session = findById(state.workSessions, workSessionId, 'WorkSessionId');
  if(!session || session.State !== 'Running') return null;
  
  session.State = 'Paused';
  const event = {
    EventId: uid('WSE'),
    TenantId: session.TenantId,
    WorkSessionId: workSessionId,
    EventType: 'Pause',
    TimestampUtc: new Date().toISOString(),
    MetadataJson: '{}'
  };
  addToCollection(state.workSessionEvents, event);
  return session;
}

export function resumeWorkSession(state, workSessionId){
  const session = findById(state.workSessions, workSessionId, 'WorkSessionId');
  if(!session || session.State !== 'Paused') return null;
  
  session.State = 'Running';
  const event = {
    EventId: uid('WSE'),
    TenantId: session.TenantId,
    WorkSessionId: workSessionId,
    EventType: 'Resume',
    TimestampUtc: new Date().toISOString(),
    MetadataJson: '{}'
  };
  addToCollection(state.workSessionEvents, event);
  return session;
}

export function stopWorkSession(state, workSessionId){
  const session = findById(state.workSessions, workSessionId, 'WorkSessionId');
  if(!session || session.State === 'Stopped') return null;
  
  session.State = 'Stopped';
  session.StoppedUtc = new Date().toISOString();
  return session;
}

// Notification management
export function addNotification(state, tenantId, userId, type, title, body, linkEntityType, linkEntityId){
  const notif = {
    NotificationId: uid('NOTIF'),
    TenantId: tenantId,
    UserId: userId,
    Type: type,
    Title: title,
    Body: body,
    LinkEntityType: linkEntityType,
    LinkEntityId: linkEntityId,
    IsRead: false,
    CreatedUtc: new Date().toISOString()
  };
  addToCollection(state.notifications, notif);
  return notif;
}

export function markNotificationRead(state, notificationId){
  const notif = findById(state.notifications, notificationId, 'NotificationId');
  if(!notif) return null;
  notif.IsRead = true;
  return notif;
}

// Get unread notifications for user
export function getUnreadNotifications(state, userId){
  if(!state.notifications) return [];
  return state.notifications.filter(n => n.UserId === userId && !n.IsRead);
}

// Feature flag helpers
export function isFeatureEnabled(state, tenantId, featureFlagId){
  if(!state.tenantFeatureFlags) return false;
  const tff = state.tenantFeatureFlags.find(f => 
    f.TenantId === tenantId && f.FeatureFlagId === featureFlagId
  );
  return tff?.IsEnabled || false;
}

// Role-based permission helpers
export function getUserRoles(state, userId, tenantId){
  if(!state.userRoles) return [];
  return state.userRoles.filter(ur => 
    ur.UserId === userId && ur.TenantId === tenantId && ur.IsActive
  );
}

export function hasRole(state, userId, tenantId, roleId){
  const userRoles = getUserRoles(state, userId, tenantId);
  return userRoles.some(ur => ur.RoleId === roleId);
}

export function hasAnyRole(state, userId, tenantId, roleIds){
  const userRoles = getUserRoles(state, userId, tenantId);
  return userRoles.some(ur => roleIds.includes(ur.RoleId));
}

export function isAdmin(state, userId, tenantId){
  return hasAnyRole(state, userId, tenantId, [
    'ROLE_PLATFORM_ADMIN',
    'ROLE_COMPANY_ADMIN',
    'ROLE_MERID_ADMIN'
  ]);
}

export function isProjectManager(state, userId, tenantId){
  return hasAnyRole(state, userId, tenantId, [
    'ROLE_PROJECT_MANAGER',
    'ROLE_MERID_PM'
  ]);
}

export function isApprover(state, userId, tenantId){
  return hasAnyRole(state, userId, tenantId, [
    'ROLE_GOV_APPROVER',
    'ROLE_COR',
    'ROLE_PROJECT_MANAGER',
    'ROLE_MERID_PM'
  ]);
}

// Tenant branding helper
export function getTenantBranding(state, tenantId){
  if(!state.tenantBranding) return null;
  return state.tenantBranding.find(tb => tb.TenantId === tenantId);
}
