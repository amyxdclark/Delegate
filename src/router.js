// Hash-based router

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};
    
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }
  
  // Register a route
  register(pattern, handler) {
    this.routes.set(pattern, handler);
  }
  
  // Navigate to a route
  navigate(path) {
    window.location.hash = path;
  }
  
  // Get current route params
  getParams() {
    return this.params;
  }
  
  // Parse route and extract params
  matchRoute(path) {
    for (const [pattern, handler] of this.routes) {
      const regex = this.patternToRegex(pattern);
      const match = path.match(regex);
      
      if (match) {
        const params = this.extractParams(pattern, match);
        return { handler, params };
      }
    }
    
    return null;
  }
  
  // Convert route pattern to regex
  patternToRegex(pattern) {
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/:([^\/]+)/g, '([^/]+)');
    return new RegExp(`^${regexPattern}$`);
  }
  
  // Extract params from matched route
  extractParams(pattern, match) {
    const params = {};
    const paramNames = pattern.match(/:([^\/]+)/g);
    
    if (paramNames) {
      paramNames.forEach((paramName, index) => {
        const name = paramName.substring(1);
        params[name] = match[index + 1];
      });
    }
    
    return params;
  }
  
  // Handle route change
  async handleRoute() {
    const hash = window.location.hash.substring(1) || '/projects';
    const matched = this.matchRoute(hash);
    
    if (matched) {
      this.currentRoute = hash;
      this.params = matched.params;
      await matched.handler(matched.params);
    } else {
      // 404 - redirect to projects
      this.navigate('/projects');
    }
  }
  
  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();
