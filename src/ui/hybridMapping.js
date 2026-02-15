// Hybrid mapping screen

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { renderDisabledFeature } from './disabledFeature.js';
import { createEmptyState, showToast } from './components.js';
import { escapeHtml } from '../utils/dom.js';
import { isFeatureEnabled, getAgileTypes, getPmiTypes } from '../store/schema.js';

export function renderHybridMapping(params) {
  const { id: projectId } = params;
  
  const state = store.getState();
  const project = state.projects.find(p => p.projectId === projectId);
  
  // Check if hybrid mapping is enabled
  if (!isFeatureEnabled(state.features, 'enableHybridMapping', projectId) || project.methodologyMode !== 'hybrid') {
    return renderDisabledFeature('Hybrid mapping');
  }
  
  setCurrentProject(projectId);
  renderLayout();
  
  const workItems = state.workItems.filter(w => w.projectId === projectId);
  const agileItems = workItems.filter(w => getAgileTypes().includes(w.workItemType));
  const pmiItems = workItems.filter(w => getPmiTypes().includes(w.workItemType));
  const mappings = state.mappings.filter(m => m.projectId === projectId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-8">Hybrid Mapping</h1>
    
    <div class="mb-6 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
      <p class="text-blue-200 text-sm">
        Map Agile work items to PMI WBS nodes to track coverage and alignment between both methodologies.
      </p>
    </div>
    
    <!-- Coverage Indicators -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Agile Coverage</h2>
        ${renderCoverageStats(agileItems, mappings, 'agile')}
      </div>
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-white mb-4">PMI Coverage</h2>
        ${renderCoverageStats(pmiItems, mappings, 'pmi')}
      </div>
    </div>
    
    <!-- Mappings List -->
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Current Mappings (${mappings.length})</h2>
      
      ${mappings.length === 0 ? createEmptyState('No Mappings', 'Create mappings to link Agile and PMI work') : `
        <div class="space-y-3">
          ${mappings.map(mapping => renderMapping(mapping, workItems)).join('')}
        </div>
      `}
    </div>
    
    <!-- Unmapped Items -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Unmapped Agile Items</h3>
        ${renderUnmappedItems(agileItems, mappings, 'agile')}
      </div>
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Unmapped PMI Items</h3>
        ${renderUnmappedItems(pmiItems, mappings, 'pmi')}
      </div>
    </div>
  `;
}

function renderCoverageStats(items, mappings, type) {
  const mappedIds = type === 'agile' 
    ? new Set(mappings.map(m => m.agileWorkItemId))
    : new Set(mappings.map(m => m.pmiWorkItemId));
  
  const mapped = items.filter(item => mappedIds.has(item.workItemId)).length;
  const unmapped = items.length - mapped;
  const percentage = items.length > 0 ? Math.round((mapped / items.length) * 100) : 0;
  
  return `
    <div class="space-y-4">
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Total Items:</span>
        <span class="text-white font-semibold">${items.length}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Mapped:</span>
        <span class="text-green-500 font-semibold">${mapped}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Unmapped:</span>
        <span class="text-yellow-500 font-semibold">${unmapped}</span>
      </div>
      
      <div class="w-full bg-gray-700 rounded-full h-3 mt-4">
        <div class="bg-green-600 h-3 rounded-full" style="width: ${percentage}%"></div>
      </div>
      <p class="text-sm text-gray-400 text-center">${percentage}% Coverage</p>
    </div>
  `;
}

function renderMapping(mapping, workItems) {
  const agileItem = workItems.find(w => w.workItemId === mapping.agileWorkItemId);
  const pmiItem = workItems.find(w => w.workItemId === mapping.pmiWorkItemId);
  
  if (!agileItem || !pmiItem) return '';
  
  return `
    <div class="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 text-xs rounded bg-blue-600 text-white">${agileItem.workItemType}</span>
          <span class="text-white text-sm">${escapeHtml(agileItem.title)}</span>
        </div>
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
          <span class="px-2 py-1 text-xs rounded bg-green-600 text-white">${pmiItem.workItemType}</span>
          <span class="text-white text-sm">${escapeHtml(pmiItem.title)}</span>
        </div>
      </div>
      <button class="unmap-btn px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded ml-4" data-mapping-id="${mapping.mappingId}">
        Unlink
      </button>
    </div>
  `;
}

function renderUnmappedItems(items, mappings, type) {
  const mappedIds = type === 'agile' 
    ? new Set(mappings.map(m => m.agileWorkItemId))
    : new Set(mappings.map(m => m.pmiWorkItemId));
  
  const unmapped = items.filter(item => !mappedIds.has(item.workItemId));
  
  if (unmapped.length === 0) {
    return '<p class="text-gray-400 text-sm">All items are mapped</p>';
  }
  
  return `
    <div class="space-y-2 max-h-96 overflow-y-auto">
      ${unmapped.map(item => `
        <div class="bg-gray-700 rounded p-3 flex items-center justify-between">
          <div class="flex items-center gap-2 flex-1">
            <span class="px-2 py-1 text-xs rounded ${type === 'agile' ? 'bg-blue-600' : 'bg-green-600'} text-white">
              ${item.workItemType}
            </span>
            <span class="text-white text-sm">${escapeHtml(item.title)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
