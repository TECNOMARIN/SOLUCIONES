const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

code = code.replace(
    'className="h-16 object-contain mb-6 rounded-xl" style={{ height: 64, width: "auto", maxWidth: "100%", objectFit: "contain" }}',
    'className="object-contain mb-6 rounded-xl" style={{ height: "64px", width: "auto", maxWidth: "200px" }}'
);

code = code.replace(
    'className="h-8 object-contain rounded-md" style={{ height: 32, width: "auto", maxWidth: "100%", objectFit: "contain" }}',
    'className="object-contain rounded-md" style={{ height: "32px", width: "auto", maxWidth: "150px" }}'
);

code = code.replace(
    'className={`object-contain rounded-md transition-all duration-300 ${isSidebarCollapsed ? \'h-8\' : \'h-10\'}`} style={{ height: isSidebarCollapsed ? 32 : 40, width: "auto", maxWidth: "100%", objectFit: "contain" }}',
    'className="object-contain rounded-md transition-all duration-300" style={{ height: isSidebarCollapsed ? "32px" : "40px", width: "auto", maxWidth: "180px" }}'
);

fs.writeFileSync('src/main.jsx', code);
