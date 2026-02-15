// Users management screen

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { showModal, showConfirm, showToast, createInput, createEmptyState } from './components.js';
import { escapeHtml } from '../utils/dom.js';

export function renderUsers(params) {
  const { id: projectId } = params;
  setCurrentProject(projectId);
  renderLayout();
  
  const state = store.getState();
  const users = state.users;
  const assignments = state.roleAssignments.filter(a => a.projectId === projectId);
  const roles = state.roles.filter(r => r.projectId === projectId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">Users</h1>
      <button id="create-user-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
        + New User
      </button>
    </div>
    
    ${users.length === 0 ? createEmptyState(
      'No Users',
      'Add users to your organization',
      '<button id="create-user-empty-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">+ New User</button>'
    ) : `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${users.map(user => renderUserCard(user, assignments, roles, projectId)).join('')}
      </div>
    `}
  `;
  
  const createBtn = document.getElementById('create-user-btn');
  const createEmptyBtn = document.getElementById('create-user-empty-btn');
  
  if (createBtn) {
    createBtn.addEventListener('click', () => showCreateUserModal());
  }
  
  if (createEmptyBtn) {
    createEmptyBtn.addEventListener('click', () => showCreateUserModal());
  }
  
  document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.userId;
      const user = store.getUser(userId);
      showEditUserModal(user);
    });
  });
  
  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.userId;
      const user = store.getUser(userId);
      showConfirm(
        'Delete User',
        `Are you sure you want to delete "${user.name}"?`,
        () => {
          store.deleteUser(userId);
          showToast('User deleted successfully', 'success');
          renderUsers(params);
        }
      );
    });
  });
}

function renderUserCard(user, assignments, roles, projectId) {
  const userAssignments = assignments.filter(a => a.userId === user.userId);
  const userRoles = userAssignments.map(a => roles.find(r => r.roleId === a.roleId)).filter(Boolean);
  
  return `
    <div class="bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            ${user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 class="text-white font-semibold">${escapeHtml(user.name)}</h3>
            <p class="text-sm text-gray-400">${escapeHtml(user.email)}</p>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-400 mb-2">Roles in this project:</p>
        ${userRoles.length > 0 ? `
          <div class="flex flex-wrap gap-2">
            ${userRoles.map(r => `
              <span class="px-2 py-1 text-xs rounded ${r.isLeadership ? 'bg-yellow-600' : 'bg-gray-700'} text-white">
                ${escapeHtml(r.name)}
              </span>
            `).join('')}
          </div>
        ` : '<p class="text-xs text-gray-500">No roles assigned</p>'}
      </div>
      
      <div class="flex gap-2">
        <button class="edit-user-btn flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded" data-user-id="${user.userId}">
          Edit
        </button>
        <button class="delete-user-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded" data-user-id="${user.userId}">
          Delete
        </button>
      </div>
    </div>
  `;
}

function showCreateUserModal() {
  const content = `
    <form id="user-form">
      ${createInput('Full Name', 'name', 'text', '', true)}
      ${createInput('Email', 'email', 'email', '', true)}
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">Create User</button>
      </div>
    </form>
  `;
  
  const modal = showModal('Create User', content);
  const form = modal.querySelector('#user-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const user = {
      name: formData.get('name'),
      email: formData.get('email')
    };
    
    store.createUser(user);
    showToast('User created successfully', 'success');
    modal.remove();
    window.location.reload(); // Refresh to update the list
  });
}

function showEditUserModal(user) {
  const content = `
    <form id="user-form">
      ${createInput('Full Name', 'name', 'text', user.name, true)}
      ${createInput('Email', 'email', 'email', user.email, true)}
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">Save Changes</button>
      </div>
    </form>
  `;
  
  const modal = showModal('Edit User', content);
  const form = modal.querySelector('#user-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const updates = {
      name: formData.get('name'),
      email: formData.get('email')
    };
    
    store.updateUser(user.userId, updates);
    showToast('User updated successfully', 'success');
    modal.remove();
    window.location.reload();
  });
}
