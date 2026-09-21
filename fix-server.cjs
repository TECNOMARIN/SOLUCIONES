const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const middleware = `app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Clear-Site-Data', '"cache", "storage", "executionContexts"');
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));`;

code = code.replace("app.use(express.static(path.join(__dirname, 'dist')));", middleware);
fs.writeFileSync('server.js', code);
