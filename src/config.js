// Base path configuration for GitHub Pages deployment

/**
 * Determines the base path for the application.
 * When deployed to GitHub Pages at /delegate/, this returns '/delegate/'
 * When running locally, this returns '/'
 */
export function getBasePath() {
  // Check if we're on GitHub Pages
  const { pathname } = window.location;
  
  // If pathname starts with /delegate/, we're on GitHub Pages
  if (pathname.startsWith('/delegate/')) {
    return '/delegate/';
  }
  
  // Otherwise, we're running locally or on root domain
  return '/';
}

/**
 * Resolves a path relative to the base path
 * @param {string} path - Path to resolve (e.g., 'data/projects.json')
 * @returns {string} - Full path including base (e.g., '/delegate/data/projects.json')
 */
export function resolvePath(path) {
  const base = getBasePath();
  
  // Remove leading ./ if present
  const cleanPath = path.replace(/^\.\//, '');
  
  // Remove leading / if present to avoid double slashes
  const normalizedPath = cleanPath.replace(/^\//, '');
  
  return `${base}${normalizedPath}`;
}

// Export base path as a constant for use in imports
export const BASE_PATH = getBasePath();
