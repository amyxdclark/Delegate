// Demo mode settings

import { store } from '../store/store.js';
import { renderLayout } from './layout.js';
import { showToast, showConfirm } from './components.js';

export function renderDemoSettings() {
  renderLayout();
  
  const state = store.getState();
  
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
    
    <h1 class="text-3xl font-bold text-white mb-8">Demo Mode Settings</h1>
    
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-white mb-2">What is Demo Mode?</h2>
        <p class="text-gray-400">
          Demo mode uses a separate storage key so you can present without affecting your real data.
          Perfect for demonstrations, testing, or training sessions.
        </p>
      </div>
      
      <div class="space-y-4">
        <!-- Demo Mode Toggle -->
        <label class="flex items-center justify-between p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600">
          <div>
            <span class="text-white font-medium block mb-1">Enable Demo Mode</span>
            <span class="text-sm text-gray-400">Use separate storage for demo data</span>
          </div>
          <div class="relative inline-block w-12 h-6">
            <input type="checkbox" id="demo-mode-toggle" ${state.demoMode ? 'checked' : ''} class="sr-only peer">
            <div class="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </div>
        </label>
        
        <!-- Reset on Refresh Toggle -->
        <label class="flex items-center justify-between p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 ${!state.demoMode ? 'opacity-50 cursor-not-allowed' : ''}">
          <div>
            <span class="text-white font-medium block mb-1">Reset on Refresh</span>
            <span class="text-sm text-gray-400">Automatically reload seed data when page refreshes</span>
          </div>
          <div class="relative inline-block w-12 h-6">
            <input type="checkbox" id="reset-on-refresh-toggle" ${state.resetOnRefresh ? 'checked' : ''} ${!state.demoMode ? 'disabled' : ''} class="sr-only peer">
            <div class="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </div>
        </label>
      </div>
    </div>
    
    <!-- Current Status -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Current Status</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 ${state.demoMode ? 'bg-red-900 bg-opacity-30' : 'bg-gray-700'} rounded">
          <p class="text-sm text-gray-400 mb-1">Mode</p>
          <p class="text-xl font-bold ${state.demoMode ? 'text-red-400' : 'text-white'}">
            ${state.demoMode ? 'DEMO' : 'Normal'}
          </p>
        </div>
        <div class="p-4 bg-gray-700 rounded">
          <p class="text-sm text-gray-400 mb-1">Storage Key</p>
          <p class="text-sm font-mono text-white">
            ${state.demoMode ? 'delegate.demoState.v1' : 'delegate.appState.v1'}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
      <div class="space-y-3">
        <button id="reset-demo-btn" ${!state.demoMode ? 'disabled' : ''} class="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Reset Demo Data Now
        </button>
        
        <p class="text-sm text-gray-400 text-center">
          ${state.demoMode ? 'This will reload seed data into demo storage' : 'Enable demo mode first'}
        </p>
      </div>
    </div>
    
    <!-- URL Param Info -->
    <div class="mt-8 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
      <h3 class="text-white font-medium mb-2">💡 Pro Tip</h3>
      <p class="text-blue-200 text-sm">
        You can enable demo mode via URL parameter: <code class="bg-gray-800 px-2 py-1 rounded">?demo=1</code>
      </p>
      <p class="text-blue-200 text-sm mt-2">
        Example: <code class="bg-gray-800 px-2 py-1 rounded text-xs">http://yoursite.com/#/projects?demo=1</code>
      </p>
    </div>
  `;
  
  // Attach event listeners
  const demoModeToggle = document.getElementById('demo-mode-toggle');
  const resetOnRefreshToggle = document.getElementById('reset-on-refresh-toggle');
  const resetDemoBtn = document.getElementById('reset-demo-btn');
  
  demoModeToggle.addEventListener('change', (e) => {
    store.setDemoMode(e.target.checked);
    showToast(`Demo mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
    setTimeout(() => renderDemoSettings(), 500);
  });
  
  resetOnRefreshToggle.addEventListener('change', (e) => {
    if (state.demoMode) {
      store.setResetOnRefresh(e.target.checked);
      showToast(`Reset on refresh ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
    }
  });
  
  resetDemoBtn.addEventListener('click', () => {
    if (state.demoMode) {
      showConfirm(
        'Reset Demo Data',
        'This will reload seed data into demo storage. Continue?',
        () => {
          store.resetToSeed();
          showToast('Demo data reset successfully', 'success');
          setTimeout(() => window.location.reload(), 1000);
        }
      );
    }
  });
}
