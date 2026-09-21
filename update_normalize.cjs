const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

// First replace normalizeRowPayload signature
const normStart = `const normalizeRowPayload = (rowObj, rowIdx = 0) => {`;
const newNormStart = `const normalizeRowPayload = (rowObj, rowIdx = 0, customMap = {}) => {
                            const getMapped = (key, defaults) => customMap[key] ? [customMap[key], ...defaults] : defaults;`;
content = content.replace(normStart, newNormStart);

// Now I will replace all the findValue calls in normalizeRowPayload!
content = content.replace(/findValue\(rowObj, \['cc',/g, "findValue(rowObj, getMapped('CEDULA', ['cc',"));
content = content.replace(/findValue\(rowObj, \['nombres',/g, "findValue(rowObj, getMapped('NOMBRE', ['nombres',"));
content = content.replace(/findValue\(rowObj, \['apellidos',/g, "findValue(rowObj, getMapped('APELLIDO', ['apellidos',"));
content = content.replace(/findValue\(rowObj, \['nombre del cliente',/g, "findValue(rowObj, getMapped('NOMBRE_COMPLETO', ['nombre del cliente',"));
content = content.replace(/findValue\(rowObj, \[\n                                'número de contrato',/g, "findValue(rowObj, getMapped('CODIGO_DISPOSITIVO', [\n                                'número de contrato',"));
content = content.replace(/findValue\(rowObj, \['celular del cliente',/g, "findValue(rowObj, getMapped('CELULAR', ['celular del cliente',"));
content = content.replace(/findValue\(rowObj, \['email',/g, "findValue(rowObj, getMapped('CORREO', ['email',"));
content = content.replace(/findValue\(rowObj, \['imei',/g, "findValue(rowObj, getMapped('IMEI', ['imei',"));
content = content.replace(/findValue\(rowObj, \['modelo',/g, "findValue(rowObj, getMapped('EQUIPO', ['modelo',"));
content = content.replace(/findValue\(rowObj, \['valor cuota inicial',/g, "findValue(rowObj, getMapped('INICIAL', ['valor cuota inicial',"));
content = content.replace(/findValue\(rowObj, \['valor credito',/g, "findValue(rowObj, getMapped('SALDO', ['valor credito',"));
content = content.replace(/findValue\(rowObj, \['total venta',/g, "findValue(rowObj, getMapped('VALOR_VENTA', ['total venta',"));
content = content.replace(/findValue\(rowObj, \['% cuota inicial',/g, "findValue(rowObj, getMapped('PORCENTAJE_INICIAL', ['% cuota inicial',"));

// Add fetching customMap before the else block
const elseBlockStart = `} else {
                                    let newRow = normalizeRowPayload(row, rowIdx);`;

const newElseBlockStart = `} else {
                                    let mappedKeys = {};
                                    if (props.db && props.db.config_archivos_cartera) {
                                        const configRow = props.db.config_archivos_cartera.find(r => String(r.financiera).toUpperCase() === String(portfolio).toUpperCase());
                                        if (configRow && configRow.config_json) {
                                            try { mappedKeys = JSON.parse(configRow.config_json); } catch(e) {}
                                        }
                                    }
                                    let newRow = normalizeRowPayload(row, rowIdx, mappedKeys);
                                    
                                    // Custom logic for Alocredit missing VALOR_VENTA
                                    if (portfolio === 'alocredit' && newRow['VALOR VENTA'] === 0) {
                                        if (newRow['CUOTA INICIAL'] > 0 || newRow['SALDO A FINANCIAR'] > 0) {
                                            newRow['VALOR VENTA'] = (newRow['CUOTA INICIAL'] || 0) + (newRow['SALDO A FINANCIAR'] || 0);
                                        }
                                    }`;

content = content.replace(elseBlockStart, newElseBlockStart);

fs.writeFileSync('src/main.jsx', content);
