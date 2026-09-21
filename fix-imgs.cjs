const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

code = code.replace(
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className="h-16 object-contain mb-6 rounded-xl" />',
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className="h-16 object-contain mb-6 rounded-xl" style={{ height: 64, width: "auto", objectFit: "contain" }} />'
);

code = code.replace(
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className="h-8 object-contain rounded-md" />',
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className="h-8 object-contain rounded-md" style={{ height: 32, width: "auto", objectFit: "contain" }} />'
);

code = code.replace(
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className={`object-contain rounded-md transition-all duration-300 ${isSidebarCollapsed ? \'h-8\' : \'h-10\'}`} />',
    '<img src="/soluciones_logo.png" alt="Logo Multimarcas" className={`object-contain rounded-md transition-all duration-300 ${isSidebarCollapsed ? \'h-8\' : \'h-10\'}`} style={{ height: isSidebarCollapsed ? 32 : 40, width: "auto", objectFit: "contain" }} />'
);

fs.writeFileSync('src/main.jsx', code);
