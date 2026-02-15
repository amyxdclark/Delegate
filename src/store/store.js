// Central state management and data persistence

import { generateId } from '../utils/id.js';
import { toISOString } from '../utils/dates.js';

const STORAGE_KEY = 'delegate.appState.v1';
const DEMO_STORAGE_KEY = 'delegate.demoState.v1';

class Store {
  constructor() {
    this.state = {
      company: null,
      projects: [],
      users: [],
      roles: [],
      roleAssignments: [],
      workItems: [],
      sprints: [],
      raid: [],
      mappings: [],
      features: { global: {}, perProject: {} },
      demoMode: false,
      resetOnRefresh: false
    };
    
    this.listeners = new Set();
    this.seedData = null;
  }
  
  // Load seed data from JSON files
  async loadSeedData() {
    try {
      const [company, projects, users, roles, roleAssignments, sprints, workItems, raid, mappings, features] = await Promise.all([
        fetch('/data/company.json').then(r => r.json()),
        fetch('/data/projects.json').then(r => r.json()),
        fetch('/data/users.json').then(r => r.json()),
        fetch('/data/roles.json').then(r => r.json()),
        fetch('/data/roleAssignments.json').then(r => r.json()),
        fetch('/data/sprints.json').then(r => r.json()),
        fetch('/data/workItems.json').then(r => r.json()),
        fetch('/data/raid.json').then(r => r.json()),
        fetch('/data/mappings.json').then(r => r.json()),
        fetch('/data/features.json').then(r => r.json())
      ]);
      
      this.seedData = {
        company,
        projects,
        users,
        roles,
        roleAssignments,
        sprints,
        workItems,
        raid,
        mappings,
        features
      };
      
      return this.seedData;
    } catch (err) {
      console.error('Failed to load seed data:', err);
      throw new Error('Failed to load seed data. Please ensure data files are present.');
    }
  }
  
  // Initialize state from storage or seed
  async initialize() {
    await this.loadSeedData();
    
    // Check for demo mode URL param
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');
    if (demoParam === '1') {
      this.state.demoMode = true;
    }
    
    // Try to load from storage
    const loaded = this.loadFromStorage();
    
    if (!loaded || (this.state.demoMode && this.state.resetOnRefresh)) {
      // Use seed data
      this.resetToSeed();
    }
    
    this.notify();
  }
  
  // Get storage key based on demo mode
  getStorageKey() {
    return this.state.demoMode ? DEMO_STORAGE_KEY : STORAGE_KEY;
  }
  
  // Load state from localStorage
  loadFromStorage() {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        this.state = { ...this.state, ...data };
        return true;
      }
    } catch (err) {
      console.error('Failed to load from storage:', err);
    }
    return false;
  }
  
  // Save state to localStorage
  saveToStorage() {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to save to storage:', err);
    }
  }
  
  // Reset to seed data
  resetToSeed() {
    if (!this.seedData) {
      throw new Error('Seed data not loaded');
    }
    
    const demoMode = this.state.demoMode;
    const resetOnRefresh = this.state.resetOnRefresh;
    
    this.state = {
      ...this.seedData,
      demoMode,
      resetOnRefresh
    };
    
    this.saveToStorage();
    this.notify();
  }
  
  // Export state as JSON
  exportState() {
    return {
      company: this.state.company,
      projects: this.state.projects,
      users: this.state.users,
      roles: this.state.roles,
      roleAssignments: this.state.roleAssignments,
      workItems: this.state.workItems,
      sprints: this.state.sprints,
      raid: this.state.raid,
      mappings: this.state.mappings,
      features: this.state.features
    };
  }
  
  // Import state from JSON
  importState(data) {
    try {
      // Validate required fields
      if (!data.company || !data.projects || !data.users) {
        throw new Error('Invalid data: missing required fields');
      }
      
      this.state = {
        ...this.state,
        company: data.company,
        projects: data.projects || [],
        users: data.users || [],
        roles: data.roles || [],
        roleAssignments: data.roleAssignments || [],
        workItems: data.workItems || [],
        sprints: data.sprints || [],
        raid: data.raid || [],
        mappings: data.mappings || [],
        features: data.features || { global: {}, perProject: {} }
      };
      
      this.saveToStorage();
      this.notify();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  // Notify listeners
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }
  
  // Get state
  getState() {
    return this.state;
  }
  
  // Toggle demo mode
  setDemoMode(enabled) {
    this.state.demoMode = enabled;
    this.saveToStorage();
    this.notify();
  }
  
  // Toggle reset on refresh
  setResetOnRefresh(enabled) {
    this.state.resetOnRefresh = enabled;
    this.saveToStorage();
    this.notify();
  }
  
  // === CRUD Operations ===
  
  // Projects
  getProjects() {
    return this.state.projects;
  }
  
  getProject(id) {
    return this.state.projects.find(p => p.projectId === id);
  }
  
  createProject(project) {
    const newProject = {
      projectId: generateId('PROJ'),
      createdAt: toISOString(new Date()),
      ...project
    };
    this.state.projects.push(newProject);
    this.saveToStorage();
    this.notify();
    return newProject;
  }
  
  updateProject(id, updates) {
    const index = this.state.projects.findIndex(p => p.projectId === id);
    if (index !== -1) {
      this.state.projects[index] = { ...this.state.projects[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.projects[index];
    }
    return null;
  }
  
  deleteProject(id) {
    this.state.projects = this.state.projects.filter(p => p.projectId !== id);
    // Also delete related data
    this.state.roles = this.state.roles.filter(r => r.projectId !== id);
    this.state.roleAssignments = this.state.roleAssignments.filter(a => a.projectId !== id);
    this.state.workItems = this.state.workItems.filter(w => w.projectId !== id);
    this.state.sprints = this.state.sprints.filter(s => s.projectId !== id);
    this.state.raid = this.state.raid.filter(r => r.projectId !== id);
    this.state.mappings = this.state.mappings.filter(m => m.projectId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Users
  getUsers() {
    return this.state.users;
  }
  
  getUser(id) {
    return this.state.users.find(u => u.userId === id);
  }
  
  createUser(user) {
    const newUser = {
      userId: generateId('USER'),
      createdAt: toISOString(new Date()),
      avatarUrl: null,
      ...user
    };
    this.state.users.push(newUser);
    this.saveToStorage();
    this.notify();
    return newUser;
  }
  
  updateUser(id, updates) {
    const index = this.state.users.findIndex(u => u.userId === id);
    if (index !== -1) {
      this.state.users[index] = { ...this.state.users[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.users[index];
    }
    return null;
  }
  
  deleteUser(id) {
    this.state.users = this.state.users.filter(u => u.userId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Roles
  getRoles(projectId = null) {
    if (projectId) {
      return this.state.roles.filter(r => r.projectId === projectId);
    }
    return this.state.roles;
  }
  
  getRole(id) {
    return this.state.roles.find(r => r.roleId === id);
  }
  
  createRole(role) {
    const newRole = {
      roleId: generateId('ROLE'),
      createdAt: toISOString(new Date()),
      parentRoleId: null,
      isLeadership: false,
      sortOrder: 999,
      ...role
    };
    this.state.roles.push(newRole);
    this.saveToStorage();
    this.notify();
    return newRole;
  }
  
  updateRole(id, updates) {
    const index = this.state.roles.findIndex(r => r.roleId === id);
    if (index !== -1) {
      this.state.roles[index] = { ...this.state.roles[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.roles[index];
    }
    return null;
  }
  
  deleteRole(id) {
    // Also update children to remove parent
    this.state.roles.forEach(role => {
      if (role.parentRoleId === id) {
        role.parentRoleId = null;
      }
    });
    
    this.state.roles = this.state.roles.filter(r => r.roleId !== id);
    this.state.roleAssignments = this.state.roleAssignments.filter(a => a.roleId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Role Assignments
  getRoleAssignments(projectId = null, roleId = null, userId = null) {
    let assignments = this.state.roleAssignments;
    
    if (projectId) {
      assignments = assignments.filter(a => a.projectId === projectId);
    }
    if (roleId) {
      assignments = assignments.filter(a => a.roleId === roleId);
    }
    if (userId) {
      assignments = assignments.filter(a => a.userId === userId);
    }
    
    return assignments;
  }
  
  createRoleAssignment(assignment) {
    const newAssignment = {
      assignmentId: generateId('ASSIGN'),
      assignedAt: toISOString(new Date()),
      ...assignment
    };
    this.state.roleAssignments.push(newAssignment);
    this.saveToStorage();
    this.notify();
    return newAssignment;
  }
  
  deleteRoleAssignment(id) {
    this.state.roleAssignments = this.state.roleAssignments.filter(a => a.assignmentId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Work Items
  getWorkItems(projectId = null, filters = {}) {
    let items = this.state.workItems;
    
    if (projectId) {
      items = items.filter(w => w.projectId === projectId);
    }
    
    if (filters.status) {
      items = items.filter(w => w.status === filters.status);
    }
    
    if (filters.workItemType) {
      items = items.filter(w => w.workItemType === filters.workItemType);
    }
    
    if (filters.sprintId !== undefined) {
      items = items.filter(w => w.sprintId === filters.sprintId);
    }
    
    if (filters.parentWorkItemId !== undefined) {
      items = items.filter(w => w.parentWorkItemId === filters.parentWorkItemId);
    }
    
    return items;
  }
  
  getWorkItem(id) {
    return this.state.workItems.find(w => w.workItemId === id);
  }
  
  createWorkItem(item) {
    const newItem = {
      workItemId: generateId('WI'),
      createdAt: toISOString(new Date()),
      parentWorkItemId: null,
      tags: [],
      dependencyIds: [],
      raci: {
        responsibleUserIds: [],
        accountableUserId: null,
        consultedUserIds: [],
        informedUserIds: []
      },
      comments: [],
      audit: [],
      ...item
    };
    this.state.workItems.push(newItem);
    this.saveToStorage();
    this.notify();
    return newItem;
  }
  
  updateWorkItem(id, updates) {
    const index = this.state.workItems.findIndex(w => w.workItemId === id);
    if (index !== -1) {
      this.state.workItems[index] = { ...this.state.workItems[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.workItems[index];
    }
    return null;
  }
  
  deleteWorkItem(id) {
    // Remove from parent references
    this.state.workItems.forEach(item => {
      if (item.parentWorkItemId === id) {
        item.parentWorkItemId = null;
      }
      if (item.dependencyIds && item.dependencyIds.includes(id)) {
        item.dependencyIds = item.dependencyIds.filter(depId => depId !== id);
      }
    });
    
    this.state.workItems = this.state.workItems.filter(w => w.workItemId !== id);
    
    // Remove from RAID links
    this.state.raid.forEach(entry => {
      if (entry.linkedWorkItemIds && entry.linkedWorkItemIds.includes(id)) {
        entry.linkedWorkItemIds = entry.linkedWorkItemIds.filter(wId => wId !== id);
      }
    });
    
    // Remove from mappings
    this.state.mappings = this.state.mappings.filter(
      m => m.agileWorkItemId !== id && m.pmiWorkItemId !== id
    );
    
    this.saveToStorage();
    this.notify();
  }
  
  // Sprints
  getSprints(projectId = null) {
    if (projectId) {
      return this.state.sprints.filter(s => s.projectId === projectId);
    }
    return this.state.sprints;
  }
  
  getSprint(id) {
    return this.state.sprints.find(s => s.sprintId === id);
  }
  
  createSprint(sprint) {
    const newSprint = {
      sprintId: generateId('SPRINT'),
      createdAt: toISOString(new Date()),
      status: 'Planned',
      ...sprint
    };
    this.state.sprints.push(newSprint);
    this.saveToStorage();
    this.notify();
    return newSprint;
  }
  
  updateSprint(id, updates) {
    const index = this.state.sprints.findIndex(s => s.sprintId === id);
    if (index !== -1) {
      this.state.sprints[index] = { ...this.state.sprints[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.sprints[index];
    }
    return null;
  }
  
  deleteSprint(id) {
    // Remove sprint from work items
    this.state.workItems.forEach(item => {
      if (item.sprintId === id) {
        item.sprintId = null;
      }
    });
    
    this.state.sprints = this.state.sprints.filter(s => s.sprintId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // RAID
  getRaid(projectId = null, filters = {}) {
    let entries = this.state.raid;
    
    if (projectId) {
      entries = entries.filter(r => r.projectId === projectId);
    }
    
    if (filters.type) {
      entries = entries.filter(r => r.type === filters.type);
    }
    
    if (filters.status) {
      entries = entries.filter(r => r.status === filters.status);
    }
    
    return entries;
  }
  
  getRaidEntry(id) {
    return this.state.raid.find(r => r.raidId === id);
  }
  
  createRaidEntry(entry) {
    const newEntry = {
      raidId: generateId('RAID'),
      linkedWorkItemIds: [],
      ...entry
    };
    this.state.raid.push(newEntry);
    this.saveToStorage();
    this.notify();
    return newEntry;
  }
  
  updateRaidEntry(id, updates) {
    const index = this.state.raid.findIndex(r => r.raidId === id);
    if (index !== -1) {
      this.state.raid[index] = { ...this.state.raid[index], ...updates };
      this.saveToStorage();
      this.notify();
      return this.state.raid[index];
    }
    return null;
  }
  
  deleteRaidEntry(id) {
    this.state.raid = this.state.raid.filter(r => r.raidId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Mappings
  getMappings(projectId = null) {
    if (projectId) {
      return this.state.mappings.filter(m => m.projectId === projectId);
    }
    return this.state.mappings;
  }
  
  createMapping(mapping) {
    const newMapping = {
      mappingId: generateId('MAP'),
      ...mapping
    };
    this.state.mappings.push(newMapping);
    this.saveToStorage();
    this.notify();
    return newMapping;
  }
  
  deleteMapping(id) {
    this.state.mappings = this.state.mappings.filter(m => m.mappingId !== id);
    this.saveToStorage();
    this.notify();
  }
  
  // Feature Flags
  getFeatures() {
    return this.state.features;
  }
  
  updateFeatures(features) {
    this.state.features = features;
    this.saveToStorage();
    this.notify();
  }
}

// Create singleton instance
export const store = new Store();
