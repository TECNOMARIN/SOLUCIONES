const fs = require('fs');

// 1. Unregister any existing service workers in index.html
let html = fs.readFileSync('index.html', 'utf8');
const oldScriptRegex = /<script>\s*if \('serviceWorker' in navigator\).*?<\/script>/s;
const newScript = `<script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
    </script>`;

if (oldScriptRegex.test(html)) {
    html = html.replace(oldScriptRegex, newScript);
} else {
    html = html.replace('</body>', newScript + '\n</body>');
}
fs.writeFileSync('index.html', html);

// 2. Overwrite sw.js to delete caches and unregister itself
const swContent = `self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    }).then(() => {
      self.registration.unregister();
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Let the browser handle the request normally
});`;

fs.writeFileSync('public/sw.js', swContent);
