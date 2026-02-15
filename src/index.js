// Main application entry point

import { store } from './store/store.js';
import { router } from './router.js';
import { renderProjects } from './ui/projects.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderRoles } from './ui/roles.js';
import { renderUsers } from './ui/users.js';
import { renderAgile } from './ui/agile.js';
import { renderPmi } from './ui/pmi.js';
import { renderHybridMapping } from './ui/hybridMapping.js';
import { renderDelegation } from './ui/delegation.js';
import { renderSettings } from './ui/settings.js';
import { renderFeatureFlags } from './ui/featureFlags.js';
import { renderDemoSettings } from './ui/demo.js';

// Initialize the application
async function init() {
  try {
    // Load seed data and initialize state
    await store.initialize();
    
    // Register routes
    router.register('/projects', renderProjects);
    router.register('/projects/:id/dashboard', renderDashboard);
    router.register('/projects/:id/roles', renderRoles);
    router.register('/projects/:id/users', renderUsers);
    router.register('/projects/:id/agile', renderAgile);
    router.register('/projects/:id/pmi', renderPmi);
    router.register('/projects/:id/hybrid-mapping', renderHybridMapping);
    router.register('/projects/:id/delegation', renderDelegation);
    router.register('/settings', renderSettings);
    router.register('/settings/features', renderFeatureFlags);
    router.register('/settings/demo', renderDemoSettings);
    
    // Subscribe to state changes
    store.subscribe((state) => {
      // State changed, could trigger updates if needed
      console.log('State updated');
    });
    
    // Initial route handling will be triggered by router
    console.log('Delegate app initialized successfully');
    
  } catch (err) {
    console.error('Failed to initialize app:', err);
    
    // Show error to user
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-900">
        <div class="text-center max-w-md p-8">
          <svg class="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h1 class="text-2xl font-bold text-white mb-2">Failed to Load</h1>
          <p class="text-gray-400 mb-6">${err.message}</p>
          <button onclick="window.location.reload()" class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
