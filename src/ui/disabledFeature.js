// Disabled feature screen

import { renderLayout } from './layout.js';

export function renderDisabledFeature(featureName = 'This feature') {
  renderLayout();
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="flex items-center justify-center min-h-96">
      <div class="text-center max-w-md">
        <svg class="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
        </svg>
        <h2 class="text-2xl font-bold text-white mb-2">Feature Disabled</h2>
        <p class="text-gray-400 mb-6">${featureName} is currently disabled. Enable it in Settings to access this feature.</p>
        <a href="#/settings/features" class="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
          Go to Feature Settings
        </a>
      </div>
    </div>
  `;
}
