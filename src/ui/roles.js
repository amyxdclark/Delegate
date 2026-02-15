// Roles management screen

import { store } from '../store/store.js';
import { setCurrentProject, renderLayout } from './layout.js';
import { showModal, showConfirm, showToast, createInput, createTextarea, createSelect, createEmptyState } from './components.js';
import { escapeHtml } from '../utils/dom.js';

export function renderRoles(params) {
  const { id: projectId } = params;
  setCurrentProject(projectId);
  renderLayout();
  
  const state = store.getState();
  const project = state.projects.find(p => p.projectId === projectId);
  const roles = state.roles.filter(r => r.projectId === projectId);
  const users = state.users;
  const assignments = state.roleAssignments.filter(a => a.projectId === projectId);
  
  const content = document.querySelector('#main-content > div');
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">Role Hierarchy</h1>
      <button id="create-role-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
        + New Role
      </button>
    </div>
    
    ${roles.length === 0 ? createEmptyState(
      'No Roles',
      'Create roles to organize your project team',
      '<button id="create-role-empty-btn" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">+ New Role</button>'
    ) : `
      <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
        ${renderRoleTree(roles, assignments, users)}
      </div>
    `}
  `;
  
  // Attach event listeners
  const createBtn = document.getElementById('create-role-btn');
  const createEmptyBtn = document.getElementById('create-role-empty-btn');
  
  if (createBtn) {
    createBtn.addEventListener('click', () => showCreateRoleModal(projectId, roles));
  }
  
  if (createEmptyBtn) {
    createEmptyBtn.addEventListener('click', () => showCreateRoleModal(projectId, roles));
  }
  
  document.querySelectorAll('.edit-role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roleId = e.currentTarget.dataset.roleId;
      const role = store.getRole(roleId);
      showEditRoleModal(role, roles);
    });
  });
  
  document.querySelectorAll('.delete-role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roleId = e.currentTarget.dataset.roleId;
      const role = store.getRole(roleId);
      showConfirm(
        'Delete Role',
        `Are you sure you want to delete "${role.name}"?`,
        () => {
          store.deleteRole(roleId);
          showToast('Role deleted successfully', 'success');
          renderRoles(params);
        }
      );
    });
  });
  
  document.querySelectorAll('.assign-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roleId = e.currentTarget.dataset.roleId;
      const role = store.getRole(roleId);
      showAssignUserModal(role, projectId, users, assignments);
    });
  });
}

function renderRoleTree(roles, assignments, users) {
  const rootRoles = roles.filter(r => !r.parentRoleId).sort((a, b) => a.sortOrder - b.sortOrder);
  
  function renderRole(role, level = 0) {
    const children = roles.filter(r => r.parentRoleId === role.roleId).sort((a, b) => a.sortOrder - b.sortOrder);
    const roleAssignments = assignments.filter(a => a.roleId === role.roleId);
    const assignedUsers = roleAssignments.map(a => users.find(u => u.userId === a.userId)).filter(Boolean);
    
    return `
      <div class="mb-2" style="margin-left: ${level * 2}rem">
        <div class="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h3 class="text-white font-semibold">${escapeHtml(role.name)}</h3>
              ${role.isLeadership ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-yellow-600 text-white">Leadership</span>' : ''}
            </div>
            <p class="text-sm text-gray-400 mt-1">${escapeHtml(role.description || 'No description')}</p>
            ${assignedUsers.length > 0 ? `
              <div class="mt-2 flex flex-wrap gap-2">
                ${assignedUsers.map(u => `
                  <span class="px-2 py-1 text-xs rounded bg-primary-600 text-white">${escapeHtml(u.name)}</span>
                `).join('')}
              </div>
            ` : '<p class="text-xs text-gray-500 mt-2">No users assigned</p>'}
          </div>
          <div class="flex gap-2 ml-4">
            <button class="assign-user-btn px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded" data-role-id="${role.roleId}" title="Assign user">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
            <button class="edit-role-btn px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded" data-role-id="${role.roleId}" title="Edit role">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="delete-role-btn px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded" data-role-id="${role.roleId}" title="Delete role">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
        ${children.map(child => renderRole(child, level + 1)).join('')}
      </div>
    `;
  }
  
  return rootRoles.map(role => renderRole(role)).join('');
}

function showCreateRoleModal(projectId, roles) {
  const parentOptions = [
    { value: '', label: '(None - Top Level)' },
    ...roles.map(r => ({ value: r.roleId, label: r.name }))
  ];
  
  const content = `
    <form id="role-form">
      ${createInput('Role Name', 'name', 'text', '', true)}
      ${createTextarea('Description', 'description', '', false)}
      ${createSelect('Parent Role', 'parentRoleId', parentOptions, '', false)}
      <label class="flex items-center gap-2 mb-4">
        <input type="checkbox" name="isLeadership" class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded">
        <span class="text-gray-300">Mark as Leadership Role</span>
      </label>
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">Create Role</button>
      </div>
    </form>
  `;
  
  const modal = showModal('Create Role', content);
  const form = modal.querySelector('#role-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const role = {
      projectId,
      name: formData.get('name'),
      description: formData.get('description'),
      parentRoleId: formData.get('parentRoleId') || null,
      isLeadership: formData.get('isLeadership') === 'on'
    };
    
    store.createRole(role);
    showToast('Role created successfully', 'success');
    modal.remove();
    renderRoles({ id: projectId });
  });
}

function showEditRoleModal(role, roles) {
  const parentOptions = [
    { value: '', label: '(None - Top Level)' },
    ...roles.filter(r => r.roleId !== role.roleId).map(r => ({ value: r.roleId, label: r.name }))
  ];
  
  const content = `
    <form id="role-form">
      ${createInput('Role Name', 'name', 'text', role.name, true)}
      ${createTextarea('Description', 'description', role.description || '', false)}
      ${createSelect('Parent Role', 'parentRoleId', parentOptions, role.parentRoleId || '', false)}
      <label class="flex items-center gap-2 mb-4">
        <input type="checkbox" name="isLeadership" ${role.isLeadership ? 'checked' : ''} class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded">
        <span class="text-gray-300">Mark as Leadership Role</span>
      </label>
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">Save Changes</button>
      </div>
    </form>
  `;
  
  const modal = showModal('Edit Role', content);
  const form = modal.querySelector('#role-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const updates = {
      name: formData.get('name'),
      description: formData.get('description'),
      parentRoleId: formData.get('parentRoleId') || null,
      isLeadership: formData.get('isLeadership') === 'on'
    };
    
    store.updateRole(role.roleId, updates);
    showToast('Role updated successfully', 'success');
    modal.remove();
    renderRoles({ id: role.projectId });
  });
}

function showAssignUserModal(role, projectId, users, assignments) {
  const assignedUserIds = assignments.filter(a => a.roleId === role.roleId).map(a => a.userId);
  const availableUsers = users.filter(u => !assignedUserIds.includes(u.userId));
  
  if (availableUsers.length === 0) {
    showToast('All users are already assigned to this role', 'info');
    return;
  }
  
  const content = `
    <form id="assign-form">
      ${createSelect('Select User', 'userId', availableUsers.map(u => ({ value: u.userId, label: u.name })), '', true)}
      
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded">Assign User</button>
      </div>
    </form>
  `;
  
  const modal = showModal(`Assign User to ${role.name}`, content);
  const form = modal.querySelector('#assign-form');
  const cancelBtn = modal.querySelector('.cancel-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const assignment = {
      roleId: role.roleId,
      userId: formData.get('userId'),
      projectId
    };
    
    store.createRoleAssignment(assignment);
    showToast('User assigned successfully', 'success');
    modal.remove();
    renderRoles({ id: projectId });
  });
}
