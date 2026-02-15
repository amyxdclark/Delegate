// DOM utility functions

export function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function show(element) {
  element.classList.remove('hidden');
}

export function hide(element) {
  element.classList.add('hidden');
}

export function toggle(element) {
  element.classList.toggle('hidden');
}
