// Settings main screen

import { store } from '../store/store.js';
import { router } from '../router.js';
import { renderLayout } from './layout.js';
import { showModal, showConfirm, showToast } from './components.js';
import { downloadJSON, readJSONFile } from '../utils/download.js';
import { escapeHtml } from '../utils/dom.js';

export function renderSettings() {
  renderLayout();
  
  const state = store.getState();
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-8">Settings</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Feature Flags -->
      <div class="bg-gray-800 rounded-lg p-6 shadow-lg card-hover cursor-pointer" onclick="location.hash='#/settings/features'">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-white">Feature Flags</h2>
            <p class="text-sm text-gray-400">Control which features are enabled</p>
          </div>
        </div>
        <div class="flex items-center text-primary-400">
          <span class="text-sm">Configure →</span>
        </div>
      </div>
      
      <!-- Demo Mode -->
      <div class="bg-gray-800 rounded-lg p-6 shadow-lg card-hover cursor-pointer" onclick="location.hash='#/settings/demo'">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 ${state.demoMode ? 'bg-red-600' : 'bg-gray-600'} rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-white">Demo Mode</h2>
            <p class="text-sm ${state.demoMode ? 'text-red-400' : 'text-gray-400'}">
              ${state.demoMode ? 'Currently Active' : 'Currently Inactive'}
            </p>
          </div>
        </div>
        <div class="flex items-center text-primary-400">
          <span class="text-sm">Configure →</span>
        </div>
      </div>
    </div>
    
    <!-- Data Management -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
      <h2 class="text-xl font-semibold text-white mb-6">Data Management</h2>
      
      <div class="space-y-4">
        <!-- Export -->
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <h3 class="text-white font-medium">Export Data</h3>
            <p class="text-sm text-gray-400">Download all data as JSON</p>
          </div>
          <button id="export-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium">
            Export
          </button>
        </div>
        
        <!-- Import -->
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <h3 class="text-white font-medium">Import Data</h3>
            <p class="text-sm text-gray-400">Replace current data with JSON file</p>
          </div>
          <button id="import-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium">
            Import
          </button>
        </div>
        
        <!-- Reset -->
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <h3 class="text-white font-medium">Reset to Seed Data</h3>
            <p class="text-sm text-gray-400">Restore original demo data</p>
          </div>
          <button id="reset-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
            Reset
          </button>
        </div>
      </div>
    </div>
    
    <!-- Company Info -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 class="text-xl font-semibold text-white mb-4">Company Information</h2>
      <div class="space-y-2">
        <div>
          <span class="text-gray-400">Name:</span>
          <span class="text-white ml-2">${escapeHtml(state.company?.name || 'N/A')}</span>
        </div>
        <div>
          <span class="text-gray-400">Description:</span>
          <span class="text-white ml-2">${escapeHtml(state.company?.description || 'N/A')}</span>
        </div>
      </div>
    </div>
    
    <input type="file" id="import-file-input" accept=".json" class="hidden">
  `;
  
  // Attach event listeners
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const resetBtn = document.getElementById('reset-btn');
  const fileInput = document.getElementById('import-file-input');
  
  exportBtn.addEventListener('click', () => {
    const data = store.exportState();
    const timestamp = new Date().toISOString().split('T')[0];
    downloadJSON(data, `delegate-export-${timestamp}.json`);
    showToast('Data exported successfully', 'success');
  });
  
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const data = await readJSONFile(file);
      const result = store.importState(data);
      
      if (result.success) {
        showToast('Data imported successfully', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(`Import failed: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
    
    fileInput.value = '';
  });
  
  resetBtn.addEventListener('click', () => {
    showConfirm(
      'Reset to Seed Data',
      'This will replace all current data with the original seed data. This action cannot be undone.',
      () => {
        store.resetToSeed();
        showToast('Data reset to seed successfully', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
    );
  });
}
