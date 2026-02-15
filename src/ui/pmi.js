// PMI features screen (WBS, Milestones, RAID, Timeline)

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { renderDisabledFeature } from './disabledFeature.js';
import { createBadge, createEmptyState } from './components.js';
import { escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/dates.js';
import { isFeatureEnabled, getPmiTypes, getRaidTypeColor, getStatusColor } from '../store/schema.js';

export function renderPmi(params) {
  const { id: projectId } = params;
  
  const state = store.getState();
  
  // Check if PMI is enabled
  if (!isFeatureEnabled(state.features, 'enablePmi', projectId)) {
    return renderDisabledFeature('PMI features');
  }
  
  setCurrentProject(projectId);
  renderLayout();
  
  const workItems = state.workItems.filter(w => 
    w.projectId === projectId && getPmiTypes().includes(w.workItemType)
  );
  const raid = state.raid.filter(r => r.projectId === projectId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-8">PMI / Traditional</h1>
    
    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-gray-700">
      <button class="tab-btn active px-4 py-2 text-white border-b-2 border-primary-500" data-tab="wbs">WBS</button>
      <button class="tab-btn px-4 py-2 text-gray-400 hover:text-white" data-tab="milestones">Milestones</button>
      <button class="tab-btn px-4 py-2 text-gray-400 hover:text-white" data-tab="raid">RAID Log</button>
      <button class="tab-btn px-4 py-2 text-gray-400 hover:text-white" data-tab="timeline">Timeline</button>
    </div>
    
    <!-- Tab Content -->
    <div id="tab-content">
      ${renderWbsTab(workItems)}
    </div>
  `;
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'border-primary-500', 'text-white');
        b.classList.add('text-gray-400');
      });
      e.target.classList.add('active', 'border-primary-500', 'text-white');
      e.target.classList.remove('text-gray-400');
      
      const tab = e.target.dataset.tab;
      const tabContent = document.getElementById('tab-content');
      
      if (tab === 'wbs') {
        tabContent.innerHTML = renderWbsTab(workItems);
      } else if (tab === 'milestones') {
        tabContent.innerHTML = renderMilestonesTab(workItems);
      } else if (tab === 'raid') {
        tabContent.innerHTML = renderRaidTab(raid);
      } else if (tab === 'timeline') {
        tabContent.innerHTML = renderTimelineTab(workItems);
      }
    });
  });
}

function renderWbsTab(workItems) {
  const deliverables = workItems.filter(w => w.workItemType === 'deliverable' && !w.parentWorkItemId);
  
  return `
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Work Breakdown Structure</h2>
      
      ${deliverables.length === 0 ? createEmptyState('No WBS Items', 'Start by creating deliverables') : `
        <div class="space-y-4">
          ${deliverables.map(deliverable => renderWbsNode(deliverable, workItems)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderWbsNode(node, allItems, level = 0) {
  const children = allItems.filter(w => w.parentWorkItemId === node.workItemId);
  
  return `
    <div class="mb-2" style="margin-left: ${level * 2}rem">
      <div class="bg-gray-700 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">${node.workItemType}</span>
              <h3 class="text-white font-semibold">${escapeHtml(node.title)}</h3>
            </div>
            <p class="text-sm text-gray-400 mt-1">${escapeHtml(node.description || '')}</p>
            ${node.dueAt ? `<p class="text-xs text-gray-500 mt-1">Due: ${formatDate(node.dueAt)}</p>` : ''}
          </div>
          <div class="flex gap-2">
            ${createBadge(node.status, getStatusColor(node.status))}
          </div>
        </div>
      </div>
      ${children.length > 0 ? `
        <div class="mt-2">
          ${children.map(child => renderWbsNode(child, allItems, level + 1)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderMilestonesTab(workItems) {
  const milestones = workItems.filter(w => w.workItemType === 'milestone')
    .sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0));
  
  return `
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Project Milestones (${milestones.length})</h2>
      
      ${milestones.length === 0 ? createEmptyState('No Milestones', 'Add milestones to track key dates') : `
        <div class="space-y-3">
          ${milestones.map(milestone => `
            <div class="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-white font-semibold">${escapeHtml(milestone.title)}</h3>
                <p class="text-sm text-gray-400 mt-1">${escapeHtml(milestone.description || '')}</p>
                <p class="text-xs text-gray-500 mt-1">Due: ${formatDate(milestone.dueAt)}</p>
              </div>
              <div class="flex gap-2">
                ${createBadge(milestone.status, getStatusColor(milestone.status))}
                <div class="w-4 h-4 rounded-full ${milestone.status === 'Done' ? 'bg-green-500' : 'bg-yellow-500'}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function renderRaidTab(raid) {
  const grouped = {
    risk: raid.filter(r => r.type === 'risk'),
    assumption: raid.filter(r => r.type === 'assumption'),
    issue: raid.filter(r => r.type === 'issue'),
    decision: raid.filter(r => r.type === 'decision')
  };
  
  return `
    <div class="space-y-6">
      ${Object.entries(grouped).map(([type, items]) => `
        <div class="bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4 capitalize">${type}s (${items.length})</h3>
          
          ${items.length === 0 ? `<p class="text-gray-400">No ${type}s recorded</p>` : `
            <div class="space-y-3">
              ${items.map(item => `
                <div class="bg-gray-700 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h4 class="text-white font-medium">${escapeHtml(item.title)}</h4>
                      <p class="text-sm text-gray-400 mt-1">${escapeHtml(item.description || '')}</p>
                    </div>
                    <div class="flex gap-2">
                      ${createBadge(item.type, getRaidTypeColor(item.type))}
                      ${createBadge(item.status, getStatusColor(item.status))}
                    </div>
                  </div>
                  ${item.severity ? `<span class="text-xs text-gray-500">Severity: ${item.severity}</span>` : ''}
                  ${item.dueAt ? `<span class="text-xs text-gray-500 ml-4">Due: ${formatDate(item.dueAt)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTimelineTab(workItems) {
  const itemsWithDates = workItems.filter(w => w.dueAt)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  
  return `
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Timeline View</h2>
      
      ${itemsWithDates.length === 0 ? createEmptyState('No Scheduled Items', 'Add due dates to work items') : `
        <div class="space-y-3">
          ${itemsWithDates.map(item => {
            const isMilestone = item.workItemType === 'milestone';
            return `
              <div class="flex items-center gap-4 p-3 bg-gray-700 rounded">
                <div class="w-24 text-sm text-gray-400 flex-shrink-0">
                  ${formatDate(item.dueAt)}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    ${isMilestone ? '<span class="w-3 h-3 rounded-full bg-yellow-500"></span>' : ''}
                    <span class="text-white">${escapeHtml(item.title)}</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">${item.workItemType}</p>
                </div>
                ${createBadge(item.status, getStatusColor(item.status))}
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}
