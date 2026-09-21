const fs = require('fs');

// Fix vite.config.js
let viteCode = fs.readFileSync('vite.config.js', 'utf8');
viteCode = viteCode.replace("res.setHeader('Clear-Site-Data', '\"cache\", \"storage\", \"executionContexts\"');", "");
fs.writeFileSync('vite.config.js', viteCode);

// Fix server.js
let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace("res.setHeader('Clear-Site-Data', '\"cache\", \"storage\", \"executionContexts\"');", "");
fs.writeFileSync('server.js', serverCode);

// Cache bust Tailwind
let indexCode = fs.readFileSync('index.html', 'utf8');
indexCode = indexCode.replace('<script src="https://cdn.tailwindcss.com?v=1"></script>', '<script src="https://cdn.tailwindcss.com?v=2"></script>');
fs.writeFileSync('index.html', indexCode);

