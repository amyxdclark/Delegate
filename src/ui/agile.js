// Agile features screen (Backlog, Sprints, Kanban)

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { renderDisabledFeature } from './disabledFeature.js';
import { createBadge, createEmptyState, showToast } from './components.js';
import { escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/dates.js';
import { isFeatureEnabled, getStatusColor, getPriorityColor, getAgileTypes } from '../store/schema.js';
import { makeDraggable, makeDroppable } from '../utils/dragdrop.js';

export function renderAgile(params) {
  const { id: projectId } = params;
  
  const state = store.getState();
  const project = state.projects.find(p => p.projectId === projectId);
  
  // Check if agile is enabled
  if (!isFeatureEnabled(state.features, 'enableAgile', projectId)) {
    return renderDisabledFeature('Agile features');
  }
  
  setCurrentProject(projectId);
  renderLayout();
  
  const workItems = state.workItems.filter(w => 
    w.projectId === projectId && getAgileTypes().includes(w.workItemType)
  );
  const sprints = state.sprints.filter(s => s.projectId === projectId);
  const activeSprint = sprints.find(s => s.status === 'Active');
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-8">Agile Board</h1>
    
    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-gray-700">
      <button class="tab-btn active px-4 py-2 text-white border-b-2 border-primary-500" data-tab="backlog">Backlog</button>
      <button class="tab-btn px-4 py-2 text-gray-400 hover:text-white" data-tab="kanban">Kanban Board</button>
      <button class="tab-btn px-4 py-2 text-gray-400 hover:text-white" data-tab="sprints">Sprints</button>
    </div>
    
    <!-- Tab Content -->
    <div id="tab-content">
      ${renderBacklogTab(workItems)}
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
      
      if (tab === 'backlog') {
        tabContent.innerHTML = renderBacklogTab(workItems);
      } else if (tab === 'kanban') {
        tabContent.innerHTML = renderKanbanTab(workItems, activeSprint);
        setupKanbanDragDrop(projectId);
      } else if (tab === 'sprints') {
        tabContent.innerHTML = renderSprintsTab(sprints, workItems);
      }
    });
  });
}

function renderBacklogTab(workItems) {
  const backlogItems = workItems.filter(w => w.sprintId === null || w.sprintId === '');
  const epics = backlogItems.filter(w => w.workItemType === 'epic');
  
  return `
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Product Backlog (${backlogItems.length} items)</h2>
      
      ${epics.length === 0 ? createEmptyState('No Backlog Items', 'Start by creating epics and stories') : `
        <div class="space-y-4">
          ${epics.map(epic => renderEpicWithChildren(epic, workItems)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderEpicWithChildren(epic, allItems) {
  const children = allItems.filter(w => w.parentWorkItemId === epic.workItemId);
  const totalPoints = children.reduce((sum, w) => sum + (w.storyPoints || 0), 0);
  
  return `
    <div class="bg-gray-700 rounded-lg p-4">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h3 class="text-white font-semibold">${escapeHtml(epic.title)}</h3>
          <p class="text-sm text-gray-400 mt-1">${escapeHtml(epic.description || '')}</p>
        </div>
        <div class="flex gap-2">
          ${createBadge(epic.status, getStatusColor(epic.status))}
          ${createBadge(epic.priority, getPriorityColor(epic.priority))}
        </div>
      </div>
      
      ${children.length > 0 ? `
        <div class="mt-3 pl-4 border-l-2 border-gray-600 space-y-2">
          ${children.map(child => `
            <div class="bg-gray-600 rounded p-3">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <span class="text-white text-sm">${escapeHtml(child.title)}</span>
                  <span class="ml-2 text-xs text-gray-400">${child.workItemType}</span>
                </div>
                <div class="flex gap-2 items-center">
                  ${child.storyPoints ? `<span class="text-xs text-gray-300">${child.storyPoints} pts</span>` : ''}
                  ${createBadge(child.status, getStatusColor(child.status))}
                </div>
              </div>
            </div>
          `).join('')}
          <div class="text-sm text-gray-400 mt-2">Total: ${totalPoints} story points</div>
        </div>
      ` : '<p class="text-sm text-gray-500 mt-2 pl-4">No stories yet</p>'}
    </div>
  `;
}

function renderKanbanTab(workItems, activeSprint) {
  if (!activeSprint) {
    return createEmptyState('No Active Sprint', 'Start a sprint to use the Kanban board');
  }
  
  const sprintItems = workItems.filter(w => w.sprintId === activeSprint.sprintId);
  const statuses = ['Backlog', 'Ready', 'In Progress', 'In Review', 'Done'];
  
  return `
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-white">Sprint: ${escapeHtml(activeSprint.name)}</h2>
      <p class="text-gray-400">${formatDate(activeSprint.startDate)} - ${formatDate(activeSprint.endDate)}</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      ${statuses.map(status => `
        <div class="kanban-column" data-status="${status}">
          <h3 class="text-white font-semibold mb-3">${status} (${sprintItems.filter(w => w.status === status).length})</h3>
          <div class="space-y-2 kanban-drop-zone" data-status="${status}">
            ${sprintItems.filter(w => w.status === status).map(item => `
              <div class="kanban-card" data-item-id="${item.workItemId}" draggable="true">
                <p class="text-white text-sm font-medium mb-2">${escapeHtml(item.title)}</p>
                <div class="flex gap-1 flex-wrap">
                  <span class="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">${item.workItemType}</span>
                  ${item.storyPoints ? `<span class="text-xs px-2 py-1 rounded bg-primary-700 text-white">${item.storyPoints} pts</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function setupKanbanDragDrop(projectId) {
  const cards = document.querySelectorAll('.kanban-card');
  const dropZones = document.querySelectorAll('.kanban-drop-zone');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('itemId', card.dataset.itemId);
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      
      const itemId = e.dataTransfer.getData('itemId');
      const newStatus = zone.dataset.status;
      
      store.updateWorkItem(itemId, { status: newStatus });
      showToast(`Item moved to ${newStatus}`, 'success');
      
      // Refresh view
      setTimeout(() => {
        document.querySelector('.tab-btn[data-tab="kanban"]').click();
      }, 500);
    });
  });
}

function renderSprintsTab(sprints, workItems) {
  return `
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-white mb-4">Sprints (${sprints.length})</h2>
      
      ${sprints.length === 0 ? createEmptyState('No Sprints', 'Create sprints to organize your work') : `
        <div class="space-y-4">
          ${sprints.map(sprint => {
            const sprintItems = workItems.filter(w => w.sprintId === sprint.sprintId);
            const completedItems = sprintItems.filter(w => w.status === 'Done');
            const totalPoints = sprintItems.reduce((sum, w) => sum + (w.storyPoints || 0), 0);
            const completedPoints = completedItems.reduce((sum, w) => sum + (w.storyPoints || 0), 0);
            
            return `
              <div class="bg-gray-800 rounded-lg p-6">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="text-white font-semibold text-lg">${escapeHtml(sprint.name)}</h3>
                    <p class="text-gray-400 text-sm">${escapeHtml(sprint.goal || 'No goal set')}</p>
                    <p class="text-gray-500 text-xs mt-1">${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}</p>
                  </div>
                  ${createBadge(sprint.status, sprint.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white')}
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-gray-700 rounded p-3">
                    <p class="text-gray-400 text-sm">Items</p>
                    <p class="text-white text-xl font-bold">${completedItems.length} / ${sprintItems.length}</p>
                  </div>
                  <div class="bg-gray-700 rounded p-3">
                    <p class="text-gray-400 text-sm">Story Points</p>
                    <p class="text-white text-xl font-bold">${completedPoints} / ${totalPoints}</p>
                  </div>
                  <div class="bg-gray-700 rounded p-3">
                    <p class="text-gray-400 text-sm">Progress</p>
                    <p class="text-white text-xl font-bold">${totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}
