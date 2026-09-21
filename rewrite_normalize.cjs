const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

const targetFunctionStart = `const normalizeRowPayload = (rowObj, rowIdx = 0`;
// Find the end of normalizeRowPayload. It ends at `return newRow; }`
// Actually let's just do a manual string replace for the specific fields that Alocredit has in the schema:
// CEDULA, NOMBRE, CELULAR, EQUIPO, IMEI, FECHA_VENTA, VALOR_VENTA, INICIAL, SALDO, PLAZO, CUOTA, TIENDA, ESTADO, DIAS_MORA, SALDO_MORA
