// Reusable UI components

import { escapeHtml } from '../utils/dom.js';

// Modal component
export function showModal(title, content, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black bg-opacity-50';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');
  
  const width = options.width || 'max-w-2xl';
  
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg shadow-xl ${width} w-full mx-4 max-h-screen overflow-y-auto">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 id="modal-title" class="text-xl font-semibold text-white">${escapeHtml(title)}</h2>
        <button class="close-btn text-gray-400 hover:text-white p-1" aria-label="Close modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-6">
        ${content}
      </div>
    </div>
  `;
  
  const closeBtn = modal.querySelector('.close-btn');
  const close = () => {
    modal.remove();
    if (options.onClose) options.onClose();
  };
  
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  document.body.appendChild(modal);
  return modal;
}

// Confirm dialog
export function showConfirm(title, message, onConfirm) {
  const content = `
    <p class="text-gray-300 mb-6">${escapeHtml(message)}</p>
    <div class="flex justify-end gap-3">
      <button class="cancel-btn px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
        Cancel
      </button>
      <button class="confirm-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
        Confirm
      </button>
    </div>
  `;
  
  const modal = showModal(title, content, { width: 'max-w-md' });
  
  const cancelBtn = modal.querySelector('.cancel-btn');
  const confirmBtn = modal.querySelector('.confirm-btn');
  
  cancelBtn.addEventListener('click', () => modal.remove());
  confirmBtn.addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });
}

// Toast notification
export function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="close-btn hover:text-gray-200" aria-label="Close">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;
  
  const closeBtn = toast.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => toast.remove());
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 5000);
}

// Badge component
export function createBadge(text, color) {
  return `<span class="inline-block px-2 py-1 text-xs font-semibold rounded ${color}">${escapeHtml(text)}</span>`;
}

// Empty state component
export function createEmptyState(title, description, actionHtml = '') {
  return `
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-300">${escapeHtml(title)}</h3>
      <p class="mt-1 text-sm text-gray-500">${escapeHtml(description)}</p>
      ${actionHtml ? `<div class="mt-6">${actionHtml}</div>` : ''}
    </div>
  `;
}

// Loading spinner
export function createLoadingSpinner(message = 'Loading...') {
  return `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
      <p class="text-gray-400">${escapeHtml(message)}</p>
    </div>
  `;
}

// Card component
export function createCard(title, content, footer = '') {
  return `
    <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      ${title ? `
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">${escapeHtml(title)}</h3>
        </div>
      ` : ''}
      <div class="p-6">
        ${content}
      </div>
      ${footer ? `
        <div class="px-6 py-4 bg-gray-750 border-t border-gray-700">
          ${footer}
        </div>
      ` : ''}
    </div>
  `;
}

// Button component
export function createButton(text, options = {}) {
  const variant = options.variant || 'primary';
  const size = options.size || 'md';
  const icon = options.icon || '';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return `
    <button class="inline-flex items-center gap-2 ${variants[variant]} ${sizes[size]} rounded font-medium transition-colors">
      ${icon ? `<span>${icon}</span>` : ''}
      <span>${escapeHtml(text)}</span>
    </button>
  `;
}

// Table component
export function createTable(headers, rows) {
  return `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-750">
          <tr>
            ${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">${escapeHtml(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
          ${rows.map(row => `
            <tr class="hover:bg-gray-700 transition-colors">
              ${row.map(cell => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Form field helpers
export function createInput(label, name, type = 'text', value = '', required = false) {
  return `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        ${escapeHtml(label)} ${required ? '<span class="text-red-500">*</span>' : ''}
      </label>
      <input 
        type="${type}" 
        name="${name}" 
        value="${escapeHtml(value)}"
        ${required ? 'required' : ''}
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
    </div>
  `;
}

export function createTextarea(label, name, value = '', required = false) {
  return `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        ${escapeHtml(label)} ${required ? '<span class="text-red-500">*</span>' : ''}
      </label>
      <textarea 
        name="${name}" 
        rows="4"
        ${required ? 'required' : ''}
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >${escapeHtml(value)}</textarea>
    </div>
  `;
}

export function createSelect(label, name, options, value = '', required = false) {
  return `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        ${escapeHtml(label)} ${required ? '<span class="text-red-500">*</span>' : ''}
      </label>
      <select 
        name="${name}"
        ${required ? 'required' : ''}
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        ${options.map(opt => `
          <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
            ${escapeHtml(opt.label)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}
