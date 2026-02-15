# Delegate

A production-quality static web application for delegation and project management, supporting Agile, PMI/Traditional, and Hybrid methodologies.

## Overview

**Delegate** is a comprehensive project management tool designed for organizations managing multiple projects with different methodologies. It runs entirely in the browser with no backend required, making it perfect for GitHub Pages deployment.

### Key Features

- ✅ **Multi-Methodology Support**: Choose Agile, PMI/Traditional, or Hybrid mode per project
- ✅ **Role Hierarchy Management**: Define organizational structure with parent-child relationships
- ✅ **Delegation Tracking**: Track work delegation with RACI matrices and accountability
- ✅ **Agile Features**: Backlog, Sprints, Kanban boards, Story points, Burndown charts
- ✅ **PMI Features**: WBS tree, Milestones, RAID log, Timeline views
- ✅ **Hybrid Mapping**: Link Agile items to PMI WBS nodes with coverage indicators
- ✅ **Feature Flags**: Control which features are enabled globally or per-project
- ✅ **Demo Mode**: Separate storage for presentations with reset capabilities
- ✅ **Data Portability**: Import/Export JSON for backup and migration
- ✅ **Responsive Design**: Mobile-first design with dark theme

## Technology Stack

- **Frontend**: Vanilla JavaScript ES6+ Modules
- **Styling**: Tailwind CSS (via CDN)
- **Routing**: Hash-based routing (no server required)
- **Storage**: LocalStorage for persistence
- **Data**: JSON seed files for initial data

## Getting Started

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/amyxdclark/Delegate.git
cd Delegate
```

2. Serve the files using any local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Or simply open index.html directly in your browser
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Deploying to GitHub Pages

1. Push your code to a GitHub repository

2. Go to repository Settings → Pages

3. Set the source to deploy from the `main` branch, root directory `/`

4. GitHub will provide a URL like: `https://yourusername.github.io/Delegate`

5. Visit the URL to use your deployed app

## Project Structure

```
Delegate/
├── index.html              # Main HTML file
├── styles.css              # Custom CSS styles
├── README.md              # This file
├── data/                  # Seed data JSON files
│   ├── company.json
│   ├── projects.json
│   ├── users.json
│   ├── roles.json
│   ├── roleAssignments.json
│   ├── sprints.json
│   ├── workItems.json
│   ├── raid.json
│   ├── mappings.json
│   └── features.json
└── src/                   # JavaScript source files
    ├── index.js           # Application entry point
    ├── router.js          # Hash-based router
    ├── store/             # State management
    │   ├── store.js       # Central store with CRUD operations
    │   └── schema.js      # Data schemas and enums
    ├── ui/                # UI components and screens
    │   ├── layout.js      # App shell and navigation
    │   ├── components.js  # Reusable UI components
    │   ├── projects.js    # Projects list
    │   ├── dashboard.js   # Project dashboard
    │   ├── roles.js       # Role hierarchy management
    │   ├── users.js       # User management
    │   ├── agile.js       # Agile features (backlog, kanban, sprints)
    │   ├── pmi.js         # PMI features (WBS, RAID, timeline)
    │   ├── hybridMapping.js # Hybrid methodology mapping
    │   ├── delegation.js  # Delegation tracking
    │   ├── settings.js    # Settings main page
    │   ├── featureFlags.js # Feature flag configuration
    │   ├── demo.js        # Demo mode settings
    │   └── disabledFeature.js # Disabled feature page
    └── utils/             # Utility functions
        ├── id.js          # ID generation
        ├── dates.js       # Date formatting
        ├── dragdrop.js    # Drag and drop helpers
        ├── download.js    # File export/import
        └── dom.js         # DOM manipulation helpers
```

## Key Concepts

### Methodologies

**Delegate** supports three project methodologies:

1. **Agile**: Sprint-based development with backlog, kanban boards, and story points
2. **PMI/Traditional**: Structured approach with WBS, milestones, and RAID logs
3. **Hybrid**: Combines both Agile and PMI, with mapping capabilities

### Role Hierarchy

Projects have a tree-structured role hierarchy where:
- Roles can have parent roles (reporting structure)
- Leadership roles are highlighted
- Users are assigned to roles per project
- Roles can be reordered and reorganized

### Work Items

Unified work item model supporting:
- **Agile types**: Epic, Story, Task, Bug
- **PMI types**: Deliverable, Work Package, Activity, Milestone
- All types include delegation fields, RACI, dependencies, and more

### Feature Flags

Control which features are available:
- **Global flags**: Default settings for all projects
- **Per-project overrides**: Customize features per project
- Disabled features hide navigation and block routes

### Demo Mode

Perfect for presentations and training:
- Enable via URL parameter: `?demo=1` OR toggle in settings
- Uses separate LocalStorage key (no impact on real data)
- Optional "Reset on refresh" automatically reloads seed data
- Visual "DEMO MODE" badge when active

## Data Management

### LocalStorage Persistence

All changes are automatically saved to browser LocalStorage:
- **Normal mode**: Key `delegate.appState.v1`
- **Demo mode**: Key `delegate.demoState.v1`

### Export Data

Export all current data as JSON:
1. Navigate to **Settings**
2. Click **Export** under Data Management
3. JSON file downloads with timestamp

### Import Data

Replace current data with exported JSON:
1. Navigate to **Settings**
2. Click **Import** and select JSON file
3. Data validates and replaces current state

### Reset to Seed

Restore original demo data:
1. Navigate to **Settings**
2. Click **Reset** under Data Management
3. Confirm to reload seed data

## Routes

All routes use hash-based routing (e.g., `#/projects`):

- `#/projects` - Project list
- `#/projects/:id/dashboard` - Project dashboard
- `#/projects/:id/roles` - Role hierarchy
- `#/projects/:id/users` - User management
- `#/projects/:id/agile` - Agile board (if enabled)
- `#/projects/:id/pmi` - PMI features (if enabled)
- `#/projects/:id/hybrid-mapping` - Hybrid mapping (if enabled)
- `#/projects/:id/delegation` - Delegation tracking
- `#/settings` - Settings main page
- `#/settings/features` - Feature flags
- `#/settings/demo` - Demo mode settings

## Browser Compatibility

**Delegate** works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requirements:
- ES6+ JavaScript support
- LocalStorage enabled
- JavaScript enabled

## Development

### Adding New Features

1. Create UI component in `src/ui/`
2. Add route in `src/index.js`
3. Update store if new data types needed
4. Add feature flag if optional

### Modifying Seed Data

Edit JSON files in `/data/` directory. Changes take effect after "Reset to Seed".

### Customizing Theme

Edit Tailwind config in `index.html` or add custom styles in `styles.css`.

## License

This project is available for use as-is. Modify and deploy as needed.

## Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## Support

For issues or questions, please refer to the GitHub repository issues page.

---

**Built with ❤️ using Vanilla JavaScript and Tailwind CSS**