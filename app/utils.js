export const uid = (prefix="id") => `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;

export function clampText(s, max=140){
  if(!s) return "";
  s = String(s);
  return s.length > max ? s.slice(0, max-1) + "…" : s;
}

export function fmtDate(d){
  if(!d) return "";
  try {
    const dt = new Date(d);
    if(Number.isNaN(dt.getTime())) return d;
    return dt.toISOString().slice(0,10);
  } catch { return d; }
}

export function fmtDateTime(d){
  if(!d) return "";
  try {
    const dt = new Date(d);
    if(Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString();
  } catch { return d; }
}

export function fmtHours(minutes){
  if(!minutes && minutes !== 0) return "";
  const hours = minutes / 60;
  return hours.toFixed(1) + "h";
}

export function fmtHoursDetailed(minutes){
  if(!minutes && minutes !== 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file){
  const text = await file.text();
  return JSON.parse(text);
}

// Permission checking helpers
export function hasRole(userRoles, roleId){
  if(!userRoles) return false;
  return userRoles.some(ur => ur.RoleId === roleId && ur.IsActive);
}

export function hasAnyRole(userRoles, roleIds){
  if(!userRoles || !roleIds) return false;
  return roleIds.some(roleId => hasRole(userRoles, roleId));
}

// Tree traversal helpers
export function buildTree(items, parentField, idField){
  const roots = items.filter(item => !item[parentField]);
  const children = items.filter(item => item[parentField]);
  
  function attachChildren(node){
    node.children = children.filter(child => child[parentField] === node[idField]);
    node.children.forEach(attachChildren);
  }
  
  roots.forEach(attachChildren);
  return roots;
}

export function flattenTree(node, childrenField = 'children'){
  const result = [node];
  if(node[childrenField]){
    for(const child of node[childrenField]){
      result.push(...flattenTree(child, childrenField));
    }
  }
  return result;
}

// Date range helpers
export function getWeekStart(date = new Date()){
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start
  return new Date(d.setDate(diff));
}

export function getWeekEnd(date = new Date()){
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

export function getWeekDates(date = new Date()){
  const dates = [];
  const start = getWeekStart(date);
  for(let i = 0; i < 7; i++){
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}
