const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

code = code.replace(
    /\{availableClientes\.map\(c => \(\s*<option key=\{c\.id_cliente \|\| c\.ID_CLIENTE\} value=\{c\.id_cliente \|\| c\.ID_CLIENTE\}>/g,
    '{availableClientes.map((c, i) => (\n                                                <option key={`${c.id_cliente || c.ID_CLIENTE}-${i}`} value={c.id_cliente || c.ID_CLIENTE}>'
);

fs.writeFileSync('src/main.jsx', code);
console.log("Fixed availableClientes keys.");
