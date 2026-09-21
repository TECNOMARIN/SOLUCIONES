const fs = require('fs');
let code = fs.readFileSync('vite.config.js', 'utf8');
if (!code.includes('strictPort')) {
    code = code.replace("port: 3000,", "port: 3000,\n    strictPort: true,");
    fs.writeFileSync('vite.config.js', code);
}
