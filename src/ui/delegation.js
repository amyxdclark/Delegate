// Delegation view

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { createBadge, createEmptyState } from './components.js';
import { escapeHtml } from '../utils/dom.js';
import { formatDate, isOverdue } from '../utils/dates.js';
import { getStatusColor, getPriorityColor } from '../store/schema.js';

export function renderDelegation(params) {
  const { id: projectId } = params;
  setCurrentProject(projectId);
  renderLayout();
  
  const state = store.getState();
  const workItems = state.workItems.filter(w => w.projectId === projectId);
  const users = state.users;
  const roles = state.roles.filter(r => r.projectId === projectId);
  
  // Group by delegator
  const delegatedItems = workItems.filter(w => w.delegatedByUserId || w.delegatedByRoleId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-8">Delegation Tracking</h1>
    
    <!-- Summary Cards -->
    ${renderDelegationSummary(delegatedItems)}
    
    <!-- Delegated Work -->
    <div class="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">All Delegated Work (${delegatedItems.length} items)</h2>
      
      ${delegatedItems.length === 0 ? createEmptyState('No Delegated Work', 'Work with delegation tracking will appear here') : `
        <div class="space-y-3">
          ${delegatedItems.map(item => renderDelegatedItem(item, users, roles)).join('')}
        </div>
      `}
    </div>
    
    <!-- Group by Delegator -->
    ${renderByDelegator(delegatedItems, users, roles)}
  `;
}

function renderDelegationSummary(items) {
  const overdue = items.filter(w => w.status !== 'Done' && w.dueAt && isOverdue(w.dueAt));
  const blocked = items.filter(w => w.status === 'Blocked');
  const inProgress = items.filter(w => w.status === 'In Progress');
  
  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">In Progress</p>
            <p class="text-3xl font-bold text-white mt-2">${inProgress.length}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Overdue</p>
            <p class="text-3xl font-bold text-red-400 mt-2">${overdue.length}</p>
          </div>
          <div class="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Blocked</p>
            <p class="text-3xl font-bold text-orange-400 mt-2">${blocked.length}</p>
          </div>
          <div class="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDelegatedItem(item, users, roles) {
  const delegator = item.delegatedByUserId ? users.find(u => u.userId === item.delegatedByUserId) : null;
  const delegatorRole = item.delegatedByRoleId ? roles.find(r => r.roleId === item.delegatedByRoleId) : null;
  const assignee = item.assignedToUserId ? users.find(u => u.userId === item.assignedToUserId) : null;
  const assigneeRole = item.assignedToRoleId ? roles.find(r => r.roleId === item.assignedToRoleId) : null;
  
  const overdueFlag = item.status !== 'Done' && item.dueAt && isOverdue(item.dueAt);
  
  return `
    <div class="bg-gray-700 rounded-lg p-4 ${overdueFlag ? 'border-l-4 border-red-500' : ''}">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h3 class="text-white font-semibold">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-gray-400 mt-1">${escapeHtml(item.description || '')}</p>
        </div>
        <div class="flex gap-2">
          ${createBadge(item.status, getStatusColor(item.status))}
          ${createBadge(item.priority, getPriorityColor(item.priority))}
          ${overdueFlag ? createBadge('OVERDUE', 'bg-red-600 text-white') : ''}
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <p class="text-gray-500 mb-1">Delegated By:</p>
          <p class="text-white">
            ${delegator ? escapeHtml(delegator.name) : ''}
            ${delegatorRole ? `(${escapeHtml(delegatorRole.name)})` : ''}
          </p>
        </div>
        <div>
          <p class="text-gray-500 mb-1">Assigned To:</p>
          <p class="text-white">
            ${assignee ? escapeHtml(assignee.name) : 'Unassigned'}
            ${assigneeRole ? `(${escapeHtml(assigneeRole.name)})` : ''}
          </p>
        </div>
      </div>
      
      ${item.dueAt ? `
        <div class="mt-2 text-xs ${overdueFlag ? 'text-red-400' : 'text-gray-500'}">
          Due: ${formatDate(item.dueAt)}
        </div>
      ` : ''}
      
      ${item.raci && item.raci.accountableUserId ? `
        <div class="mt-2 text-xs text-gray-500">
          Accountable: ${users.find(u => u.userId === item.raci.accountableUserId)?.name || 'Unknown'}
        </div>
      ` : ''}
    </div>
  `;
}

function renderByDelegator(items, users, roles) {
  const grouped = {};
  
  items.forEach(item => {
    const key = item.delegatedByUserId || item.delegatedByRoleId || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  
  return `
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Grouped by Delegator</h2>
      
      <div class="space-y-4">
        ${Object.entries(grouped).map(([key, groupItems]) => {
          const delegator = users.find(u => u.userId === key);
          const delegatorRole = roles.find(r => r.roleId === key);
          const name = delegator ? delegator.name : delegatorRole ? delegatorRole.name : 'Unknown';
          
          return `
            <details class="bg-gray-700 rounded-lg">
              <summary class="px-4 py-3 cursor-pointer text-white font-medium hover:bg-gray-600">
                ${escapeHtml(name)} (${groupItems.length} items)
              </summary>
              <div class="px-4 pb-4 pt-2 space-y-2">
                ${groupItems.map(item => `
                  <div class="bg-gray-600 rounded p-3">
                    <div class="flex items-center justify-between">
                      <span class="text-white text-sm">${escapeHtml(item.title)}</span>
                      <div class="flex gap-2">
                        ${createBadge(item.status, getStatusColor(item.status))}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </details>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
