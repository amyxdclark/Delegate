// Feature flags settings

import { store } from '../store/store.js';
import { renderLayout } from './layout.js';
import { showToast } from './components.js';

export function renderFeatureFlags() {
  renderLayout();
  
  const state = store.getState();
  const features = state.features;
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="mb-6">
      <a href="#/settings" class="text-primary-400 hover:text-primary-300 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Settings
      </a>
    </div>
    
    <h1 class="text-3xl font-bold text-white mb-8">Feature Flags</h1>
    
    <!-- Global Flags -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
      <h2 class="text-xl font-semibold text-white mb-6">Global Settings</h2>
      <form id="global-flags-form" class="space-y-4">
        ${renderFlagToggle('enableAgile', 'Enable Agile Features', features.global.enableAgile)}
        ${renderFlagToggle('enablePmi', 'Enable PMI Features', features.global.enablePmi)}
        ${renderFlagToggle('enableHybridMapping', 'Enable Hybrid Mapping', features.global.enableHybridMapping)}
        ${renderFlagToggle('enableRaci', 'Enable RACI', features.global.enableRaci)}
        ${renderFlagToggle('enableRaid', 'Enable RAID Log', features.global.enableRaid)}
        ${renderFlagToggle('enableBurndown', 'Enable Burndown Charts', features.global.enableBurndown)}
        ${renderFlagToggle('enableTimeline', 'Enable Timeline View', features.global.enableTimeline)}
        ${renderFlagToggle('enableAuditLog', 'Enable Audit Log', features.global.enableAuditLog)}
      </form>
    </div>
    
    <!-- Per-Project Overrides -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Per-Project Overrides</h2>
      <p class="text-gray-400 mb-4">Project-specific settings override global defaults</p>
      ${state.projects.length > 0 ? `
        <div class="space-y-4">
          ${state.projects.map(project => `
            <details class="bg-gray-700 rounded-lg">
              <summary class="px-4 py-3 cursor-pointer text-white font-medium hover:bg-gray-600">
                ${project.name}
              </summary>
              <div class="px-4 pb-4 pt-2 space-y-3">
                ${renderProjectFlagToggle(project.projectId, 'enableAgile', 'Enable Agile', features.perProject[project.projectId]?.enableAgile)}
                ${renderProjectFlagToggle(project.projectId, 'enablePmi', 'Enable PMI', features.perProject[project.projectId]?.enablePmi)}
                ${renderProjectFlagToggle(project.projectId, 'enableHybridMapping', 'Enable Hybrid Mapping', features.perProject[project.projectId]?.enableHybridMapping)}
              </div>
            </details>
          `).join('')}
        </div>
      ` : '<p class="text-gray-400">No projects to configure</p>'}
    </div>
    
    <!-- Actions -->
    <div class="flex gap-4">
      <button id="save-flags-btn" class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
        Save Changes
      </button>
      <button id="reset-flags-btn" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium">
        Reset to Defaults
      </button>
    </div>
  `;
  
  // Attach event listeners
  const saveBtn = document.getElementById('save-flags-btn');
  const resetBtn = document.getElementById('reset-flags-btn');
  
  saveBtn.addEventListener('click', () => {
    const form = document.getElementById('global-flags-form');
    const formData = new FormData(form);
    
    const newFeatures = {
      global: {
        enableAgile: formData.get('enableAgile') === 'on',
        enablePmi: formData.get('enablePmi') === 'on',
        enableHybridMapping: formData.get('enableHybridMapping') === 'on',
        enableRaci: formData.get('enableRaci') === 'on',
        enableRaid: formData.get('enableRaid') === 'on',
        enableBurndown: formData.get('enableBurndown') === 'on',
        enableTimeline: formData.get('enableTimeline') === 'on',
        enableAuditLog: formData.get('enableAuditLog') === 'on'
      },
      perProject: {}
    };
    
    // Collect per-project overrides
    state.projects.forEach(project => {
      const projectFlags = {};
      const agileChecked = document.querySelector(`input[name="project_${project.projectId}_enableAgile"]`)?.checked;
      const pmiChecked = document.querySelector(`input[name="project_${project.projectId}_enablePmi"]`)?.checked;
      const hybridChecked = document.querySelector(`input[name="project_${project.projectId}_enableHybridMapping"]`)?.checked;
      
      if (agileChecked !== undefined && agileChecked !== null) {
        projectFlags.enableAgile = agileChecked;
      }
      if (pmiChecked !== undefined && pmiChecked !== null) {
        projectFlags.enablePmi = pmiChecked;
      }
      if (hybridChecked !== undefined && hybridChecked !== null) {
        projectFlags.enableHybridMapping = hybridChecked;
      }
      
      if (Object.keys(projectFlags).length > 0) {
        newFeatures.perProject[project.projectId] = projectFlags;
      }
    });
    
    store.updateFeatures(newFeatures);
    showToast('Feature flags updated successfully', 'success');
  });
  
  resetBtn.addEventListener('click', async () => {
    const seedData = store.seedData;
    if (seedData && seedData.features) {
      store.updateFeatures(seedData.features);
      showToast('Feature flags reset to defaults', 'success');
      renderFeatureFlags();
    }
  });
}

function renderFlagToggle(name, label, checked) {
  return `
    <label class="flex items-center justify-between p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600">
      <span class="text-white">${label}</span>
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} class="w-5 h-5 text-primary-600 bg-gray-600 border-gray-500 rounded focus:ring-primary-500">
    </label>
  `;
}

function renderProjectFlagToggle(projectId, flagName, label, checked) {
  const inputName = `project_${projectId}_${flagName}`;
  const isChecked = checked !== undefined ? checked : null;
  
  return `
    <label class="flex items-center justify-between p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500">
      <span class="text-white text-sm">${label}</span>
      <input type="checkbox" name="${inputName}" ${isChecked === true ? 'checked' : ''} ${isChecked === null ? '' : ''} class="w-4 h-4 text-primary-600 bg-gray-500 border-gray-400 rounded focus:ring-primary-500">
    </label>
  `;
}
