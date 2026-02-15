// Project dashboard

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { createBadge, createEmptyState } from './components.js';
import { formatDate, isOverdue } from '../utils/dates.js';
import { escapeHtml } from '../utils/dom.js';
import { getStatusColor, getPriorityColor, isFeatureEnabled } from '../store/schema.js';

export function renderDashboard(params) {
  const { id: projectId } = params;
  setCurrentProject(projectId);
  renderLayout();
  
  const state = store.getState();
  const project = state.projects.find(p => p.projectId === projectId);
  
  if (!project) {
    const content = document.querySelector('#main-content > div');
    content.innerHTML = '<p class="text-gray-400">Project not found</p>';
    return;
  }
  
  const workItems = state.workItems.filter(w => w.projectId === projectId);
  const sprints = state.sprints.filter(s => s.projectId === projectId);
  const raid = state.raid.filter(r => r.projectId === projectId);
  
  // Calculate stats
  const overdueItems = workItems.filter(w => w.status !== 'Done' && w.dueAt && isOverdue(w.dueAt));
  const blockedItems = workItems.filter(w => w.status === 'Blocked');
  const inProgressItems = workItems.filter(w => w.status === 'In Progress');
  const doneItems = workItems.filter(w => w.status === 'Done');
  
  const activeSprint = sprints.find(s => s.status === 'Active');
  const openRisks = raid.filter(r => r.type === 'risk' && r.status === 'Open');
  const openIssues = raid.filter(r => r.type === 'issue' && r.status === 'Open');
  
  const features = state.features;
  const showAgile = (project.methodologyMode === 'agile' || project.methodologyMode === 'hybrid') 
                    && isFeatureEnabled(features, 'enableAgile', projectId);
  const showPmi = (project.methodologyMode === 'pmi' || project.methodologyMode === 'hybrid') 
                  && isFeatureEnabled(features, 'enablePmi', projectId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">${escapeHtml(project.name)}</h1>
      <p class="text-gray-400">${escapeHtml(project.description || 'No description')}</p>
      <div class="flex gap-2 mt-3">
        ${createBadge(project.status, 'bg-green-600 text-white')}
        ${createBadge(project.methodologyMode.toUpperCase(), 'bg-primary-600 text-white')}
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      ${renderSummaryCard('Total Items', workItems.length, 'bg-blue-600')}
      ${renderSummaryCard('In Progress', inProgressItems.length, 'bg-yellow-600')}
      ${renderSummaryCard('Blocked', blockedItems.length, 'bg-red-600')}
      ${renderSummaryCard('Completed', doneItems.length, 'bg-green-600')}
    </div>
    
    <!-- Attention Needed -->
    ${overdueItems.length > 0 || blockedItems.length > 0 ? `
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">⚠️ Needs Attention</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${overdueItems.length > 0 ? renderAttentionSection('Overdue Items', overdueItems) : ''}
          ${blockedItems.length > 0 ? renderAttentionSection('Blocked Items', blockedItems) : ''}
        </div>
      </div>
    ` : ''}
    
    <!-- Agile Snapshot -->
    ${showAgile ? `
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">📊 Agile Snapshot</h2>
        ${activeSprint ? renderSprintSnapshot(activeSprint, workItems, state) : `
          <div class="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
            No active sprint
          </div>
        `}
      </div>
    ` : ''}
    
    <!-- PMI Snapshot -->
    ${showPmi ? `
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">📋 PMI Snapshot</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${renderMilestonesSnapshot(workItems)}
          ${renderRaidSnapshot(openRisks, openIssues)}
        </div>
      </div>
    ` : ''}
    
    <!-- Recent Activity -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-4">🕐 Recent Activity</h2>
      ${renderRecentActivity(workItems)}
    </div>
  `;
}

function renderSummaryCard(title, value, color) {
  return `
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-gray-400 text-sm font-medium">${title}</p>
          <p class="text-3xl font-bold text-white mt-2">${value}</p>
        </div>
        <div class="w-12 h-12 ${color} rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    </div>
  `;
}

function renderAttentionSection(title, items) {
  return `
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-white mb-4">${title} (${items.length})</h3>
      <div class="space-y-3">
        ${items.slice(0, 5).map(item => `
          <div class="border-l-4 border-red-500 pl-4 py-2">
            <p class="text-white font-medium">${escapeHtml(item.title)}</p>
            <div class="flex gap-2 mt-1">
              ${createBadge(item.status, getStatusColor(item.status))}
              ${createBadge(item.priority, getPriorityColor(item.priority))}
              ${item.dueAt ? `<span class="text-xs text-gray-400">Due: ${formatDate(item.dueAt)}</span>` : ''}
            </div>
          </div>
        `).join('')}
        ${items.length > 5 ? `<p class="text-sm text-gray-400 mt-2">... and ${items.length - 5} more</p>` : ''}
      </div>
    </div>
  `;
}

function renderSprintSnapshot(sprint, workItems, state) {
  const sprintItems = workItems.filter(w => w.sprintId === sprint.sprintId);
  const completedItems = sprintItems.filter(w => w.status === 'Done');
  const totalPoints = sprintItems.reduce((sum, w) => sum + (w.storyPoints || 0), 0);
  const completedPoints = completedItems.reduce((sum, w) => sum + (w.storyPoints || 0), 0);
  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  
  return `
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-white">${escapeHtml(sprint.name)}</h3>
          <p class="text-sm text-gray-400">${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}</p>
        </div>
        ${createBadge(sprint.status, 'bg-green-600 text-white')}
      </div>
      
      <p class="text-gray-300 mb-4">${escapeHtml(sprint.goal || 'No goal set')}</p>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-400">Story Points</p>
          <p class="text-2xl font-bold text-white">${completedPoints} / ${totalPoints}</p>
        </div>
        <div>
          <p class="text-sm text-gray-400">Items</p>
          <p class="text-2xl font-bold text-white">${completedItems.length} / ${sprintItems.length}</p>
        </div>
      </div>
      
      <div class="w-full bg-gray-700 rounded-full h-3">
        <div class="bg-green-600 h-3 rounded-full" style="width: ${progress}%"></div>
      </div>
      <p class="text-sm text-gray-400 mt-2">${progress}% Complete</p>
    </div>
  `;
}

function renderMilestonesSnapshot(workItems) {
  const milestones = workItems.filter(w => w.workItemType === 'milestone');
  const upcomingMilestones = milestones
    .filter(m => m.status !== 'Done' && m.dueAt)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5);
  
  return `
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-white mb-4">Upcoming Milestones</h3>
      ${upcomingMilestones.length > 0 ? `
        <div class="space-y-3">
          ${upcomingMilestones.map(m => `
            <div class="border-l-4 border-yellow-500 pl-4 py-2">
              <p class="text-white font-medium">${escapeHtml(m.title)}</p>
              <p class="text-sm text-gray-400">Due: ${formatDate(m.dueAt)}</p>
              ${createBadge(m.status, getStatusColor(m.status))}
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-gray-400">No upcoming milestones</p>'}
    </div>
  `;
}

function renderRaidSnapshot(openRisks, openIssues) {
  return `
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-white mb-4">RAID Summary</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-4 bg-red-900 bg-opacity-30 rounded">
          <p class="text-3xl font-bold text-red-400">${openRisks.length}</p>
          <p class="text-sm text-gray-400 mt-1">Open Risks</p>
        </div>
        <div class="text-center p-4 bg-orange-900 bg-opacity-30 rounded">
          <p class="text-3xl font-bold text-orange-400">${openIssues.length}</p>
          <p class="text-sm text-gray-400 mt-1">Open Issues</p>
        </div>
      </div>
    </div>
  `;
}

function renderRecentActivity(workItems) {
  const recentItems = workItems
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  
  if (recentItems.length === 0) {
    return createEmptyState('No Activity', 'No recent work items');
  }
  
  return `
    <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-750">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Item</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Priority</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            ${recentItems.map(item => `
              <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 text-sm text-white">${escapeHtml(item.title)}</td>
                <td class="px-6 py-4 text-sm">
                  <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">${item.workItemType}</span>
                </td>
                <td class="px-6 py-4 text-sm">${createBadge(item.status, getStatusColor(item.status))}</td>
                <td class="px-6 py-4 text-sm">${createBadge(item.priority, getPriorityColor(item.priority))}</td>
                <td class="px-6 py-4 text-sm text-gray-400">${formatDate(item.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
