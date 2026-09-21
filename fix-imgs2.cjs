const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

code = code.replace(
    'style={{ height: 64, width: "auto", objectFit: "contain" }}',
    'style={{ height: 64, width: "auto", maxWidth: "100%", objectFit: "contain" }}'
);

code = code.replace(
    'style={{ height: 32, width: "auto", objectFit: "contain" }}',
    'style={{ height: 32, width: "auto", maxWidth: "100%", objectFit: "contain" }}'
);

code = code.replace(
    'style={{ height: isSidebarCollapsed ? 32 : 40, width: "auto", objectFit: "contain" }}',
    'style={{ height: isSidebarCollapsed ? 32 : 40, width: "auto", maxWidth: "100%", objectFit: "contain" }}'
);

fs.writeFileSync('src/main.jsx', code);
