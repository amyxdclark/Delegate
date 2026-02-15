/* Delegate PWA Service Worker (simple, GitHub Pages friendly) */
const CACHE_NAME = "delegate-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./app/app.js",
  "./app/state.js",
  "./app/ui.js",
  "./app/utils.js",
  "./assets/styles.css",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./data/seed.json",
  "./data/tenants.json",
  "./data/users.json",
  "./data/roles.json",
  "./data/userRoles.json",
  "./data/userSessions.json",
  "./data/featureFlags.json",
  "./data/tenantFeatureFlags.json",
  "./data/settings.json",
  "./data/tenantBranding.json",
  "./data/contracts.json",
  "./data/taskNodes.json",
  "./data/taskAssignments.json",
  "./data/contractStakeholders.json",
  "./data/workSessions.json",
  "./data/workSessionEvents.json",
  "./data/timeEntries.json",
  "./data/hoursChangeRequests.json",
  "./data/forumThreads.json",
  "./data/forumPosts.json",
  "./data/forumAttachments.json",
  "./data/workflowDefinitions.json",
  "./data/workflowSteps.json",
  "./data/workflowTransitions.json",
  "./data/taskWorkflowInstances.json",
  "./data/taskWorkflowHistory.json",
  "./data/approvalRequirements.json",
  "./data/approvalDecisions.json",
  "./data/notifications.json",
  "./data/notificationPreferences.json",
  "./data/emailOutbox.json",
  "./data/emailDeliveryLog.json",
  "./data/deadlines.json",
  "./data/deadlineReminders.json",
  "./data/calendarSubscriptions.json",
  "./data/chatThreads.json",
  "./data/chatParticipants.json",
  "./data/chatMessages.json",
  "./data/meetings.json",
  "./data/meetingAttendees.json",
  "./data/aiPolicy.json",
  "./data/aiConversations.json",
  "./data/aiMessages.json",
  "./data/skills.json",
  "./data/userSkills.json",
  "./data/taskRequiredSkills.json",
  "./data/ptoEntries.json",
  "./data/auditLogs.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for app shell, network-first for anything else
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // For navigation, serve index.html (SPA)
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then(resp => resp || fetch("./index.html"))
    );
    return;
  }

  // Cache first for known assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(net => {
      // Update cache opportunistically for GET
      if (req.method === "GET") {
        const copy = net.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return net;
    }).catch(() => cached))
  );
});
