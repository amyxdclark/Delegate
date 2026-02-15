# GitHub Pages Deployment Guide

This guide explains how to deploy the Delegate application to GitHub Pages at the subpath `/delegate/`.

## Prerequisites

- GitHub repository named `delegate` (or any name - the app will auto-detect)
- Repository pushed to GitHub
- GitHub Pages enabled in repository settings

## Deployment Steps

### Step 1: Configure GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

### Step 2: Workflow is Already Configured

The repository includes `.github/workflows/static.yml` which:
- Triggers on every push to `main` branch
- Creates a `.nojekyll` file for proper GitHub Pages serving
- Uploads the entire repository as an artifact
- Deploys to GitHub Pages using official actions

No changes needed - it works out of the box!

### Step 3: Push to Main Branch

```bash
git push origin main
```

The workflow will automatically:
1. Checkout the code
2. Create `.nojekyll` file
3. Configure Pages
4. Upload artifact
5. Deploy to GitHub Pages

### Step 4: Access Your Deployed Site

Your site will be available at:
```
https://yourusername.github.io/delegate/
```

**Note**: If your repository has a different name, replace `delegate` with your repository name.

## How Base Path Detection Works

The application automatically detects its deployment path:

### 1. Dynamic Base Tag (index.html)
```javascript
<script>
  (function() {
    const pathname = window.location.pathname;
    const basePath = pathname.startsWith('/delegate/') ? '/delegate/' : '/';
    document.write('<base href="' + basePath + '">');
  })();
</script>
```

This ensures all relative paths in HTML work correctly.

### 2. Base Path Configuration (src/config.js)
```javascript
export function getBasePath() {
  const { pathname } = window.location;
  if (pathname.startsWith('/delegate/')) {
    return '/delegate/';
  }
  return '/';
}
```

This is used by JavaScript modules to resolve data file paths.

### 3. Data Loading (src/store/store.js)
```javascript
import { resolvePath } from '../config.js';

fetch(resolvePath('data/projects.json'))  // Becomes '/delegate/data/projects.json' on GitHub Pages
```

## Testing Locally

### Test with Root Path (local development)
```bash
python -m http.server 8000
# Visit: http://localhost:8000
# Base path will be: /
```

### Test with Subpath (simulate GitHub Pages)
This requires a reverse proxy or web server configuration to serve the app at `/delegate/`:

**Option 1: Using nginx (Docker)**
```bash
# Create nginx.conf
cat > nginx.conf << 'EOF'
server {
  listen 8080;
  location /delegate/ {
    alias /usr/share/nginx/html/;
    try_files $uri $uri/ /delegate/index.html;
  }
}
EOF

# Run with Docker
docker run -v $(pwd):/usr/share/nginx/html:ro -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro -p 8080:8080 nginx
# Visit: http://localhost:8080/delegate/
```

**Option 2: Simple verification**
Just deploy to GitHub Pages and test there - the app will work automatically!

## Verification Checklist

After deployment, verify:

- [ ] Home page loads at `https://yourusername.github.io/delegate/`
- [ ] Navigation works (click through different pages)
- [ ] Direct URL access works: `https://yourusername.github.io/delegate/#/projects`
- [ ] Browser refresh on any route continues to work
- [ ] All data loads correctly (no 404 errors in Network tab)
- [ ] CSS and styles are applied correctly
- [ ] Drag-and-drop functionality works in Agile board:
  - [ ] Drag backlog items between epics
  - [ ] Drag items from backlog to sprints (in Sprints tab)
  - [ ] Drag kanban cards between status columns
- [ ] Changes persist after page refresh (localStorage)

## Troubleshooting

### Issue: 404 errors for JavaScript or data files

**Cause**: Base path not detected correctly

**Solution**: 
1. Check browser console for exact 404 URLs
2. Verify the repository name matches the subpath detection in `src/config.js`
3. Update the detection logic if using a different repository name

### Issue: Hash routing not working

**Cause**: This shouldn't happen with hash routing, but if routes don't load:

**Solution**:
1. Check browser console for JavaScript errors
2. Verify `src/router.js` loaded correctly
3. Clear browser cache and reload

### Issue: Drag-and-drop not working

**Cause**: JavaScript not loaded or event listeners not attached

**Solution**:
1. Check browser console for errors
2. Verify you're on the Agile Board page
3. Switch between tabs (Backlog, Kanban, Sprints) to reinitialize

### Issue: Changes don't persist

**Cause**: Demo mode might be enabled, or localStorage is disabled

**Solution**:
1. Check if demo mode badge appears (top-right corner)
2. Go to Settings → Demo and disable demo mode
3. Verify localStorage is enabled in browser settings

## Advanced Configuration

### Custom Repository Name

If your repository is not named `delegate`, update the detection logic:

**File**: `index.html`
```javascript
const basePath = pathname.startsWith('/yourreponame/') ? '/yourreponame/' : '/';
```

**File**: `src/config.js`
```javascript
if (pathname.startsWith('/yourreponame/')) {
  return '/yourreponame/';
}
```

### Custom Domain

If using a custom domain (e.g., `delegate.example.com`):

1. Add `CNAME` file with your domain:
```bash
echo "delegate.example.com" > CNAME
```

2. Update DNS records at your domain provider
3. Configure custom domain in GitHub Pages settings
4. The app will automatically use `/` as base path (no subpath needed)

## Workflow File Reference

The complete workflow is in `.github/workflows/static.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Create .nojekyll file
        run: touch .nojekyll
      
      - name: Setup Pages
        uses: actions/configure-pages@v5
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Security Notes

- No build process means no dependency vulnerabilities from build tools
- All code runs client-side in the browser
- No server-side components or APIs
- Data stored only in browser localStorage
- Safe to use with any data - nothing leaves the browser

## Performance Notes

- **First Load**: ~50-100KB (HTML + CSS + JS modules)
- **Data Files**: ~25KB total (JSON seed data)
- **CDN**: Tailwind CSS loaded from CDN (cached by browser)
- **Subsequent Loads**: Instant (cached + localStorage)

## Support

For issues or questions:
1. Check GitHub Issues
2. Review browser console for errors
3. Test locally first to isolate the problem
4. Verify GitHub Actions workflow completed successfully
