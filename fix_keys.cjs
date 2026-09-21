const fs = require('fs');
let code = fs.readFileSync('src/main.jsx', 'utf8');

code = code.replace(/\{filteredTiendas\.map\(c => <option key=\{c\.id_cliente\}/g, '{filteredTiendas.map((c, i) => <option key={`${c.id_cliente}-${i}`}');
code = code.replace(/\{filterClientsList\.map\(c=><option key=\{c\.id_cliente\}/g, '{filterClientsList.map((c, i)=><option key={`${c.id_cliente}-${i}`}');
code = code.replace(/\{cliList\.map\(c=><option key=\{c\.id_cliente\}/g, '{cliList.map((c, i)=><option key={`${c.id_cliente}-${i}`}');
code = code.replace(/\{filteredClientes\.map\(c=><option key=\{c\.id_cliente\}/g, '{filteredClientes.map((c, i)=><option key={`${c.id_cliente}-${i}`}');

fs.writeFileSync('src/main.jsx', code);
console.log("Fixed keys.");
