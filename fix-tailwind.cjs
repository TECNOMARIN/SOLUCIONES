const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Force tailwind to reload
html = html.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<script src="https://cdn.tailwindcss.com?v=1"></script>'
);

// Enhance the unregister script
const newScript = `<script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister().then(function(boolean) {
                        console.log('SW unregistered: ', boolean);
                    });
                }
            });
            // Clear caches from the client side too
            if (window.caches) {
                caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                });
            }
        }
    </script>`;

html = html.replace(/<script>\s*if \('serviceWorker' in navigator\).*?<\/script>/s, newScript);

fs.writeFileSync('index.html', html);
