import { uid } from "./utils.js";

const STORAGE_KEY = "delegate:data:v1";

export async function loadSeed(){
  const r = await fetch("./data/seed.json", { cache: "no-store" });
  if(!r.ok) throw new Error("Failed to load seed.json");
  return await r.json();
}

export async function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch {}
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
  return seed;
}

export function upsertProject(state, project){
  const idx = state.projects.findIndex(p => p.id === project.id);
  if(idx >= 0) state.projects[idx] = project;
  else state.projects.push(project);
  return state;
}

export function addProject(state, partial){
  const p = {
    id: uid("p"),
    name: partial.name?.trim() || "Untitled Project",
    category: partial.category?.trim() || "General",
    startDate: partial.startDate || new Date().toISOString().slice(0,10),
    absoluteEndDate: partial.absoluteEndDate || "",
    description: partial.description?.trim() || "",
    steps: [
      { id: uid("s"), name: "Backlog", color: "slate" },
      { id: uid("s"), name: "In Progress", color: "cyan" },
      { id: uid("s"), name: "Review", color: "amber" },
      { id: uid("s"), name: "Done", color: "emerald" },
    ],
    subprojects: [],
    attachments: []
  };
  state.projects.push(p);
  return p;
}

export function addUser(state, partial){
  const u = {
    id: uid("u"),
    name: partial.name?.trim() || "New User",
    email: partial.email?.trim() || "",
    role: partial.role?.trim() || "Worker"
  };
  state.users.push(u);
  return u;
}

export function addTask(state, projectId, partial){
  const project = state.projects.find(p => p.id === projectId);
  const defaultStepId = project?.steps?.[0]?.id || "";
  const t = {
    id: uid("t"),
    projectId,
    title: partial.title?.trim() || "New Task",
    description: partial.description?.trim() || "",
    statusStepId: partial.statusStepId || defaultStepId,
    priority: partial.priority || "Medium",
    assigneeUserIds: partial.assigneeUserIds || [],
    dueDate: partial.dueDate || "",
    tags: partial.tags || []
  };
  state.tasks.push(t);
  return t;
}

export function moveTask(state, taskId, toStepId){
  const t = state.tasks.find(x => x.id === taskId);
  if(!t) return;
  t.statusStepId = toStepId;
}

export function deleteTask(state, taskId){
  state.tasks = state.tasks.filter(t => t.id !== taskId);
}

export function updateTask(state, taskId, patch){
  const t = state.tasks.find(x => x.id === taskId);
  if(!t) return;
  Object.assign(t, patch);
}

export function exportState(state){
  // Strip any ephemeral UI fields (none currently)
  return JSON.parse(JSON.stringify(state));
}
