const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove CDN script and tailwind config
html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com[^>]*><\/script>/, '');
html = html.replace(/<script>\s*tailwind\.config = {[\s\S]*?}\s*<\/script>/, '');

fs.writeFileSync('index.html', html);
