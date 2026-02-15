// Schema definitions and enums

export const WorkItemType = {
  // Agile
  EPIC: 'epic',
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  // PMI
  DELIVERABLE: 'deliverable',
  WORK_PACKAGE: 'workPackage',
  ACTIVITY: 'activity',
  MILESTONE: 'milestone'
};

export const WorkItemStatus = {
  BACKLOG: 'Backlog',
  READY: 'Ready',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  IN_REVIEW: 'In Review',
  DONE: 'Done'
};

export const Priority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

export const Category = {
  SCOPE: 'Scope',
  SCHEDULE: 'Schedule',
  COST: 'Cost',
  RISK: 'Risk',
  QUALITY: 'Quality',
  PROCUREMENT: 'Procurement',
  COMMS: 'Comms',
  STAKEHOLDERS: 'Stakeholders',
  OTHER: 'Other'
};

export const MethodologyMode = {
  AGILE: 'agile',
  PMI: 'pmi',
  HYBRID: 'hybrid'
};

export const ProjectStatus = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const RAIDType = {
  RISK: 'risk',
  ASSUMPTION: 'assumption',
  ISSUE: 'issue',
  DECISION: 'decision'
};

export const RAIDStatus = {
  OPEN: 'Open',
  WATCHING: 'Watching',
  MITIGATED: 'Mitigated',
  CLOSED: 'Closed'
};

export const Severity = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Feature flag resolution
export function isFeatureEnabled(featureFlags, featureName, projectId = null) {
  if (!featureFlags) return true;
  
  // Check project-specific override first
  if (projectId && featureFlags.perProject && featureFlags.perProject[projectId]) {
    const projectFlag = featureFlags.perProject[projectId][featureName];
    if (projectFlag !== undefined) return projectFlag;
  }
  
  // Fall back to global setting
  if (featureFlags.global && featureFlags.global[featureName] !== undefined) {
    return featureFlags.global[featureName];
  }
  
  // Default to enabled
  return true;
}

// Get agile work item types
export function getAgileTypes() {
  return [WorkItemType.EPIC, WorkItemType.STORY, WorkItemType.TASK, WorkItemType.BUG];
}

// Get PMI work item types
export function getPmiTypes() {
  return [WorkItemType.DELIVERABLE, WorkItemType.WORK_PACKAGE, WorkItemType.ACTIVITY, WorkItemType.MILESTONE];
}

// Check if work item type is agile
export function isAgileType(type) {
  return getAgileTypes().includes(type);
}

// Check if work item type is PMI
export function isPmiType(type) {
  return getPmiTypes().includes(type);
}

// Validate work item
export function validateWorkItem(item) {
  const errors = [];
  
  if (!item.title || item.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!item.workItemType) {
    errors.push('Work item type is required');
  }
  
  if (!item.status) {
    errors.push('Status is required');
  }
  
  if (!item.projectId) {
    errors.push('Project ID is required');
  }
  
  return errors;
}

// Validate project
export function validateProject(project) {
  const errors = [];
  
  if (!project.name || project.name.trim() === '') {
    errors.push('Project name is required');
  }
  
  if (!project.methodologyMode) {
    errors.push('Methodology mode is required');
  }
  
  return errors;
}

// Get status badge color
export function getStatusColor(status) {
  switch (status) {
    case WorkItemStatus.BACKLOG:
      return 'bg-gray-600 text-gray-100';
    case WorkItemStatus.READY:
      return 'bg-blue-600 text-white';
    case WorkItemStatus.IN_PROGRESS:
      return 'bg-yellow-600 text-white';
    case WorkItemStatus.BLOCKED:
      return 'bg-red-600 text-white';
    case WorkItemStatus.IN_REVIEW:
      return 'bg-purple-600 text-white';
    case WorkItemStatus.DONE:
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

// Get priority badge color
export function getPriorityColor(priority) {
  switch (priority) {
    case Priority.LOW:
      return 'bg-gray-600 text-gray-100';
    case Priority.MEDIUM:
      return 'bg-blue-600 text-white';
    case Priority.HIGH:
      return 'bg-orange-600 text-white';
    case Priority.URGENT:
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

// Get RAID type color
export function getRaidTypeColor(type) {
  switch (type) {
    case RAIDType.RISK:
      return 'bg-red-600 text-white';
    case RAIDType.ASSUMPTION:
      return 'bg-blue-600 text-white';
    case RAIDType.ISSUE:
      return 'bg-orange-600 text-white';
    case RAIDType.DECISION:
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}
