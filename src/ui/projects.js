// Projects list view

import { store } from '../store/store.js';
import { router } from '../router.js';
import { renderLayout } from './layout.js';
import { showModal, showConfirm, showToast, createEmptyState, createInput, createTextarea, createSelect } from './components.js';
import { formatDate, formatDateInput } from '../utils/dates.js';
import { escapeHtml } from '../utils/dom.js';
import { MethodologyMode, ProjectStatus } from '../store/schema.js';

export function renderProjects() {
  renderLayout();
  
  const state = store.getState();
  const projects = state.projects;
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">Projects</h1>
      <button id="create-project-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
        + New Project
      </button>
    </div>
    
    ${projects.length === 0 ? createEmptyState(
      'No Projects',
      'Get started by creating your first project',
      '<button id="create-project-empty-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">+ New Project</button>'
    ) : `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${projects.map(project => renderProjectCard(project, state)).join('')}
      </div>
    `}
  `;
  
  // Attach event listeners
  const createBtn = document.getElementById('create-project-btn');
  const createEmptyBtn = document.getElementById('create-project-empty-btn');
  
  if (createBtn) {
    createBtn.addEventListener('click', () => showCreateProjectModal());
  }
  
  if (createEmptyBtn) {
    createEmptyBtn.addEventListener('click', () => showCreateProjectModal());
  }
  
  // Project card action listeners
  document.querySelectorAll('.view-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projectId = e.currentTarget.dataset.projectId;
      router.navigate(`/projects/${projectId}/dashboard`);
    });
  });
  
  document.querySelectorAll('.edit-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projectId = e.currentTarget.dataset.projectId;
      const project = store.getProject(projectId);
      showEditProjectModal(project);
    });
  });
  
  document.querySelectorAll('.delete-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projectId = e.currentTarget.dataset.projectId;
      const project = store.getProject(projectId);
      showConfirm(
        'Delete Project',
        `Are you sure you want to delete "${project.name}"? This will also delete all related data.`,
        () => {
          store.deleteProject(projectId);
          showToast('Project deleted successfully', 'success');
          renderProjects();
        }
      );
    });
  });
}

function renderProjectCard(project, state) {
  const workItems = state.workItems.filter(w => w.projectId === project.projectId);
  const totalItems = workItems.length;
  const doneItems = workItems.filter(w => w.status === 'Done').length;
  const inProgressItems = workItems.filter(w => w.status === 'In Progress').length;
  const blockedItems = workItems.filter(w => w.status === 'Blocked').length;
  
  const modeLabels = {
    agile: 'Agile',
    pmi: 'PMI/Traditional',
    hybrid: 'Hybrid'
  };
  
  const statusColors = {
    Planning: 'bg-blue-600',
    Active: 'bg-green-600',
    'On Hold': 'bg-yellow-600',
    Completed: 'bg-gray-600',
    Cancelled: 'bg-red-600'
  };
  
  return `
    <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-white mb-2">${escapeHtml(project.name)}</h3>
            <p class="text-gray-400 text-sm mb-3">${escapeHtml(project.description || 'No description')}</p>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="px-2 py-1 text-xs font-semibold rounded ${statusColors[project.status] || 'bg-gray-600'} text-white">
            ${project.status}
          </span>
          <span class="px-2 py-1 text-xs font-semibold rounded bg-primary-600 text-white">
            ${modeLabels[project.methodologyMode]}
          </span>
        </div>
        
        <div class="space-y-2 mb-4 text-sm">
          <div class="flex justify-between text-gray-400">
            <span>Total Work Items:</span>
            <span class="text-white font-semibold">${totalItems}</span>
          </div>
          <div class="flex justify-between text-gray-400">
            <span>In Progress:</span>
            <span class="text-yellow-500 font-semibold">${inProgressItems}</span>
          </div>
          <div class="flex justify-between text-gray-400">
            <span>Completed:</span>
            <span class="text-green-500 font-semibold">${doneItems}</span>
          </div>
          ${blockedItems > 0 ? `
            <div class="flex justify-between text-gray-400">
              <span>Blocked:</span>
              <span class="text-red-500 font-semibold">${blockedItems}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="text-xs text-gray-500 mb-4">
          Started: ${formatDate(project.startDate)}
        </div>
        
        <div class="flex gap-2">
          <button class="view-project-btn flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium" data-project-id="${project.projectId}">
            View
          </button>
          <button class="edit-project-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded" data-project-id="${project.projectId}" aria-label="Edit project">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button class="delete-project-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded" data-project-id="${project.projectId}" aria-label="Delete project">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function showCreateProjectModal() {
  const content = `
    <form id="project-form">
      ${createInput('Project Name', 'name', 'text', '', true)}
      ${createTextarea('Description', 'description', '', false)}
      ${createSelect('Methodology', 'methodologyMode', [
        { value: MethodologyMode.AGILE, label: 'Agile' },
        { value: MethodologyMode.PMI, label: 'PMI/Traditional' },
        { value: MethodologyMode.HYBRID, label: 'Hybrid' }
      ], MethodologyMode.AGILE, true)}
      ${createSelect('Status', 'status', [
        { value: ProjectStatus.PLANNING, label: 'Planning' },
        { value: ProjectStatus.ACTIVE, label: 'Active' },
        { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
        { value: ProjectStatus.COMPLETED, label: 'Completed' },
        { value: ProjectStatus.CANCELLED, label: 'Cancelled' }
      ], ProjectStatus.PLANNING, true)}
      ${createInput('Start Date', 'startDate', 'date', '', true)}
      ${createInput('End Date', 'endDate', 'date', '', false)}
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
          Cancel
        </button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">
          Create Project
        </button>
      </div>
    </form>
  `;
  
  const modal = showModal('Create Project', content, { width: 'max-w-2xl' });
  
  const form = modal.querySelector('#project-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const project = {
      name: formData.get('name'),
      description: formData.get('description'),
      methodologyMode: formData.get('methodologyMode'),
      status: formData.get('status'),
      startDate: new Date(formData.get('startDate')).toISOString(),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate')).toISOString() : null,
      leadershipRoleIds: []
    };
    
    store.createProject(project);
    showToast('Project created successfully', 'success');
    modal.remove();
    renderProjects();
  });
}

function showEditProjectModal(project) {
  const content = `
    <form id="project-form">
      ${createInput('Project Name', 'name', 'text', project.name, true)}
      ${createTextarea('Description', 'description', project.description || '', false)}
      ${createSelect('Methodology', 'methodologyMode', [
        { value: MethodologyMode.AGILE, label: 'Agile' },
        { value: MethodologyMode.PMI, label: 'PMI/Traditional' },
        { value: MethodologyMode.HYBRID, label: 'Hybrid' }
      ], project.methodologyMode, true)}
      ${createSelect('Status', 'status', [
        { value: ProjectStatus.PLANNING, label: 'Planning' },
        { value: ProjectStatus.ACTIVE, label: 'Active' },
        { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
        { value: ProjectStatus.COMPLETED, label: 'Completed' },
        { value: ProjectStatus.CANCELLED, label: 'Cancelled' }
      ], project.status, true)}
      ${createInput('Start Date', 'startDate', 'date', formatDateInput(project.startDate), true)}
      ${createInput('End Date', 'endDate', 'date', project.endDate ? formatDateInput(project.endDate) : '', false)}
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
          Cancel
        </button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">
          Save Changes
        </button>
      </div>
    </form>
  `;
  
  const modal = showModal('Edit Project', content, { width: 'max-w-2xl' });
  
  const form = modal.querySelector('#project-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const updates = {
      name: formData.get('name'),
      description: formData.get('description'),
      methodologyMode: formData.get('methodologyMode'),
      status: formData.get('status'),
      startDate: new Date(formData.get('startDate')).toISOString(),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate')).toISOString() : null
    };
    
    store.updateProject(project.projectId, updates);
    showToast('Project updated successfully', 'success');
    modal.remove();
    renderProjects();
  });
}
