// App layout and navigation

import { store } from '../store/store.js';
import { router } from '../router.js';
import { isFeatureEnabled } from '../store/schema.js';

let currentProjectId = null;

export function setCurrentProject(projectId) {
  currentProjectId = projectId;
  renderLayout();
}

export function getCurrentProject() {
  return currentProjectId;
}

export function renderLayout() {
  const state = store.getState();
  const app = document.getElementById('app');
  
  app.innerHTML = `
    ${state.demoMode ? '<div class="demo-badge">DEMO MODE</div>' : ''}
    
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="bg-gray-800 border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Logo and title -->
            <div class="flex items-center gap-4">
              <button id="menu-toggle" class="lg:hidden text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <a href="#/projects" class="flex items-center gap-2">
                <svg class="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                <span class="text-xl font-bold text-white">Delegate</span>
              </a>
            </div>
            
            <!-- Project switcher -->
            ${currentProjectId ? `
              <div class="hidden sm:block">
                <select id="project-switcher" class="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                  ${state.projects.map(p => `
                    <option value="${p.projectId}" ${p.projectId === currentProjectId ? 'selected' : ''}>
                      ${p.name}
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : ''}
            
            <!-- Settings link -->
            <div class="flex items-center gap-2">
              <a href="#/settings" class="text-gray-400 hover:text-white p-2" aria-label="Settings">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main content -->
      <div class="flex-1 flex">
        <!-- Sidebar navigation (for project pages) -->
        ${currentProjectId ? renderSidebar(state, currentProjectId) : ''}
        
        <!-- Page content -->
        <main id="main-content" class="flex-1 overflow-y-auto">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Content will be injected here -->
          </div>
        </main>
      </div>
    </div>
  `;
  
  // Attach event listeners
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }
  
  const projectSwitcher = document.getElementById('project-switcher');
  if (projectSwitcher) {
    projectSwitcher.addEventListener('change', (e) => {
      const projectId = e.target.value;
      setCurrentProject(projectId);
      router.navigate(`/projects/${projectId}/dashboard`);
    });
  }
}

function renderSidebar(state, projectId) {
  const project = state.projects.find(p => p.projectId === projectId);
  if (!project) return '';
  
  const features = state.features;
  const mode = project.methodologyMode;
  
  const isAgileEnabled = isFeatureEnabled(features, 'enableAgile', projectId);
  const isPmiEnabled = isFeatureEnabled(features, 'enablePmi', projectId);
  const isHybridEnabled = isFeatureEnabled(features, 'enableHybridMapping', projectId);
  
  const showAgile = (mode === 'agile' || mode === 'hybrid') && isAgileEnabled;
  const showPmi = (mode === 'pmi' || mode === 'hybrid') && isPmiEnabled;
  const showHybrid = mode === 'hybrid' && isHybridEnabled;
  
  return `
    <aside id="sidebar" class="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto hidden lg:block">
      <nav class="p-4 space-y-1">
        <a href="#/projects/${projectId}/dashboard" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Dashboard
        </a>
        
        <a href="#/projects/${projectId}/roles" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          Roles
        </a>
        
        <a href="#/projects/${projectId}/users" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          Users
        </a>
        
        ${showAgile ? `
          <div class="pt-4 pb-2">
            <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agile</div>
          </div>
          <a href="#/projects/${projectId}/agile" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Backlog & Sprints
          </a>
        ` : ''}
        
        ${showPmi ? `
          <div class="pt-4 pb-2">
            <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PMI</div>
          </div>
          <a href="#/projects/${projectId}/pmi" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            WBS & RAID
          </a>
        ` : ''}
        
        ${showHybrid ? `
          <div class="pt-4 pb-2">
            <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hybrid</div>
          </div>
          <a href="#/projects/${projectId}/hybrid-mapping" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            Mapping
          </a>
        ` : ''}
        
        <div class="pt-4 pb-2">
          <div class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Work</div>
        </div>
        <a href="#/projects/${projectId}/delegation" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Delegation
        </a>
        
        <div class="pt-4">
          <a href="#/projects" class="nav-link flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            All Projects
          </a>
        </div>
      </nav>
    </aside>
  `;
}

export function getMainContent() {
  return document.getElementById('main-content');
}
