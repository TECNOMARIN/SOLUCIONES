/**
 * @file backend_maestro_unificado_v3.1.gs
 * @version 3.1 Consolidado (Catálogo, Tesorería, Permisos, Aliados, Simulador, Payjoy)
 * @description Motor Backend unificado para Soluciones Efectivas CTG.
 * Diseñado para gestionar el portal maestro, sin cortes ni omisiones.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const VERSION = "V3.1 Consolidado Master";

// ============================================================================
// 1. CATÁLOGO CENTRAL Y CONFIGURACIÓN DE PESTAÑAS
// ============================================================================
const PESTANAS_CATALOGO = {
  "payjoy":            { sheetName: "CARTERA PAYJOY GENERAL", headerRow: 1, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO", "TAG", "CODIGO_VENTA"] },
  "ventas_payjoy":     { sheetName: "VENTAS PAYJOY",          headerRow: 1, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO"] },
  "alocredit":         { sheetName: "CARTERA ALOCREDIT GENERAL", headerRow: 2, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO"] },
  "ventas_alocredit":  { sheetName: "VENTAS ALOCREDIT",        headerRow: 1, keyCol: ["CC", "CEDULA", "CÉDULA", "DOCUMENTO"] },
  "krediya":           { sheetName: "CARTERA KREDIYA GENERAL",  headerRow: 2, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO", "NOMBRE CLIENTE", "CLIENTE", "TAG", "CODIGO_VENTA", "# CREDITO", "CREDITO", "ID APLICACION"] },
  "ventas_krediya":    { sheetName: "VENTAS KREDIYA",          headerRow: 1, keyCol: ["CC", "CEDULA", "CÉDULA", "DOCUMENTO", "TAG", "CODIGO_VENTA", "# CREDITO", "CREDITO", "ID APLICACION", "CLIENTE"] },
  "credismart":        { sheetName: "CARTERA CREDISMART GENERAL", headerRow: 1, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO"] },
  "ventas_credismart": { sheetName: "VENTAS CREDISMART",      headerRow: 1, keyCol: ["CC", "CEDULA", "CÉDULA", "DOCUMENTO"] },
  "onboarding":        { sheetName: "ONBOARDING",               headerRow: 1, keyCol: ["CEDULA", "CÉDULA", "CC", "DOCUMENTO"] },
  "simulaciones":      { sheetName: "SIMULACION",               headerRow: 1, keyCol: ["ID_SIMULACION", "ID", "CC", "CEDULA"] },
  "usuarios_payjoy":   { sheetName: "USUARIOS PAYJOY",          headerRow: 3, keyCol: ["NOMBRE", "TIENDA", "ASIGNACION"] },
  "precios":           { sheetName: "precios",                  headerRow: 1, keyCol: ["REFERENCIA", "EQUIPO", "MARCA"] },
  "clientes":          { sheetName: "Aliados_Clientes",         headerRow: 1, keyCol: ["ID_CLIENTE", "ID"] },
  "financieras":       { sheetName: "Financieras",              headerRow: 1, keyCol: ["ID_FINANCIERA", "ID"] },
  "cuotas":            { sheetName: "Financiera_Cuotas",        headerRow: 1, keyCol: ["ID_CUOTA", "ID"] },
  "porcentajes":       { sheetName: "Porcentajes_Cliente_Financiera", headerRow: 1, keyCol: ["ID_CLIENTE"] },
  "roles":             { sheetName: "Roles",                    headerRow: 1, keyCol: ["ID_ROL", "ROL"] },
  "roles_permisos":    { sheetName: "Roles_permisos",           headerRow: 1, keyCol: ["ROL"] },
  "bancos":            { sheetName: "Aliados_Bancos",           headerRow: 1, keyCol: ["ID_CLIENTE"] },
  "cuentas_tesoreria": { sheetName: "Cuentas_Tesoreria",        headerRow: 1, keyCol: ["ID_CUENTA"] },
  "unidades_negocio":  { sheetName: "Unidades_Negocio",         headerRow: 1, keyCol: ["ID_UN"] },
  "trop_tareas":       { sheetName: "trop_tareas",           headerRow: 1, keyCol: ["ID_TAREA", "ID"] },
  "trop_visitas":      { sheetName: "trop_visitas",          headerRow: 1, keyCol: ["ID_VISITA", "ID"] },
  "trop_fotos_gps":    { sheetName: "trop_fotos_gps",        headerRow: 1, keyCol: ["ID_EVIDENCIA", "ID"] },
  "config_columnas":   { sheetName: "Config_Columnas",          headerRow: 1, keyCol: ["MARCA", "CAMPO"] },
  "config_aliados":    { sheetName: "Config_Aliados",           headerRow: 1, keyCol: ["ALIADO", "MARCA"] }
};

function getPayjoyKeys() {
  return [
    "CnjxDY6WDfVEUvVcLAOHp6RUMveBW0UW",
    "CwzaIQGsNdPUhyi0hJheA8Cr04LYfWp-"
  ];
}

// ============================================================================
// 2. ENTRADA HTTP (doGet & doPost GENERAL)
// ============================================================================
function doGet(e) {
  const type = e && e.parameter ? e.parameter.type : "";
  const action = e && e.parameter ? e.parameter.action : "";

  if (action) {
    return handleApiRequest(e);
  }

  if (!type) {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Soluciones Efectivas CTG | ' + VERSION)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (type === 'actualizar_un_tag') {
    const res = sincronizarUnTagDesdeAPI(e.parameter.tag);
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'guardarConfigPermisos') {
  var dataPayload = [];
  if (e.parameter && e.parameter.data) {
    dataPayload = JSON.parse(e.parameter.data);
  } else if (e.postData && e.postData.contents) {
    var parsedPost = JSON.parse(e.postData.contents);
    dataPayload = parsedPost.data || [];
  }
  
  var result = guardarConfigPermisos(dataPayload);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

  if (type === 'precios') {
    const res = getPreciosCatalogo();
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  const data = getSheetDataDinamica(type);
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function handleApiRequest(e) {
  const action = e.parameter.action;
  let result;
  try {
    const payload = e.parameter.data ? JSON.parse(e.parameter.data) : null;
    
    switch (action) {
      case 'getData': result = getDataConsolidada(); break;
      case 'getPrecios': result = getPreciosCatalogo(); break;
      
      // Catálogo de Precios
      case 'savePrecio': result = savePrecioDB(payload); break;
      case 'deletePrecio': result = deletePrecioDB(payload); break;

      // CRUD Aliados y Financieras
      case 'crearCliente': result = crearCliente(payload.nombre, payload.contrasena, payload.rol, payload.asesor, payload.un); break;
      case 'updateCliente': result = updateClienteCompleto(payload); break;
      case 'updateFinanciera': result = updateFinanciera(payload); break;
      case 'crearFinanciera': result = crearFinanciera(payload.nombre, payload.factor); break;
      case 'crearPlanCuota': result = crearPlanCuota(payload); break;
      case 'asignarFactorCliente': result = asignarFactorCliente(payload); break;
      
      // CRUD Roles
      case 'crearRol': result = crearRol(payload.nombre); break;
      case 'asignarFactorRol': result = asignarFactorRol(payload); break;
      case 'updateRol': result = updateRolCompleto(payload); break;

      // CRUD Unidades Negocio
      case 'crearUN': result = crearUN(payload.nombre); break;
      case 'updateUN': result = updateUN(payload); break;
      case 'deleteUN': result = deleteRowByCol("Unidades_Negocio", "id_un", payload.id_un); break;

      // Borrados
      case 'deleteCliente': result = deleteRowByCol("Aliados_Clientes", "id_cliente", payload.id_cliente); break;
      case 'deleteFinanciera': result = deleteRowByCol("Financieras", "id_financiera", payload.id_financiera); break;
      case 'deletePorcentaje': result = deletePorcentaje(payload); break;
      case 'deleteRol': result = deleteRowByCol("Roles", "id_rol", payload.id_rol); break;
      case 'deletePorcentajeRol': result = deletePorcentajeRol(payload); break;
      
      // Operaciones Simulador
      case 'guardarSimulacion': result = guardarSimulacion(payload); break;
      case 'actualizarEstadoSimulacion': result = actualizarEstadoSimulacion(payload); break; 
      
      // Configuración Global
      case 'setNotificacion': result = setNotificacion(payload); break;
      case 'guardarConfigPermisos': result = guardarConfigPermisos(payload); break;
      
      // Tesorería
      case 'crearCuentaTesoreria': result = crearCuentaTesoreria(payload); break;
      case 'updateCuentaTesoreria': result = updateCuentaTesoreria(payload); break;
      case 'deleteCuentaTesoreria': result = deleteRowByCol("Cuentas_Tesoreria", "id_cuenta", payload.id_cuenta); break;

      // Parametrizaciones
      case 'saveConfigColumnas': result = saveConfigList("Config_Columnas", payload, ["marca", "campo", "valores"]); break;
      case 'saveConfigAliados': result = saveConfigList("Config_Aliados", payload, ["aliado", "marca", "tipo", "adminPct", "gestorPct", "comisionFija", "utilidadFijaAdmin", "peaje", "aplica4x1000", "aliadoPoneInventario", "incluirRemanente"]); break;

      // Onboarding & Fraude
      case 'check_fraud': result = processCheckFraud(payload); break;
      case 'save_onboarding': result = processSaveOnboarding(payload); break;
        
      // Módulo de Agenda y Visitas (trop_)
      case 'guardarTareaTrop': result = guardarTareaTrop(payload); break;
      case 'registrarCheckInTrop': result = registrarCheckInTrop(payload); break;
      case 'registrarCheckOutTrop': result = registrarCheckOutTrop(payload); break;
      case 'guardarEvidenciaTrop': result = guardarEvidenciaTrop(payload); break;

      default: throw new Error("Acción no reconocida en el sistema multi-pestaña.");
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(12000); 
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: "Servidor ocupado procesando pestañas. Intenta nuevamente." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        params = {};
      }
    }

    // Definición segura de la variable 'action'
    var action = params.action || (e && e.parameter ? e.parameter.action : "");

    if (action === 'check_fraud') {
      return ContentService.createTextOutput(JSON.stringify(processCheckFraud(params))).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'save_onboarding') {
      return ContentService.createTextOutput(JSON.stringify(processSaveOnboarding(params.data || params))).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'bulk' || action === 'bulk_upload') {
      const res = processBulkUpload(params.type, params.data || []);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'guardarConfigPermisos') {
      var dataPayload = params.data || (e && e.parameter && e.parameter.data ? JSON.parse(e.parameter.data) : []);
      var result = guardarConfigPermisos(dataPayload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'guardarTareaTrop') {
      return ContentService.createTextOutput(JSON.stringify(guardarTareaTrop(params.data || params))).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'registrarCheckInTrop') {
      return ContentService.createTextOutput(JSON.stringify(registrarCheckInTrop(params.data || params))).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'registrarCheckOutTrop') {
      return ContentService.createTextOutput(JSON.stringify(registrarCheckOutTrop(params.data || params))).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'guardarEvidenciaTrop') {
      return ContentService.createTextOutput(JSON.stringify(guardarEvidenciaTrop(params.data || params))).setMimeType(ContentService.MimeType.JSON);
    }

    const res = processSingleUpdate(params);
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// 3. LECTURA UNIVERSAL DE CUALQUIER PESTAÑA DEL LIBRO
// ============================================================================
function getSheetDataDinamica(keyOrName) {
  let config = PESTANAS_CATALOGO[String(keyOrName).toLowerCase()];
  let sheetName = config ? config.sheetName : keyOrName;
  let startRow = config ? config.headerRow : 1;

  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < startRow || lastCol === 0) return [];

  const dataRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getValues();
  if (dataRange.length === 0) return [];

  const headers = dataRange[0];
  const rows = dataRange.slice(1);
  const timeZone = SS.getSpreadsheetTimeZone();

  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h && String(h).trim() !== "") {
        let val = row[i];
        if (val instanceof Date) {
          const userOffset = val.getTimezoneOffset() * 60000;
          const adjustedDate = new Date(val.getTime() + userOffset);
          val = Utilities.formatDate(adjustedDate, timeZone, "dd/MM/yyyy");
        }
        obj[h] = val;
      }
    });
    return obj;
  });
}

function getDataConsolidada() {
  verificarCrearHojaUnidadesNegocio();
  verificarCrearHojaCuentas();
  verificarCrearHojaConfigPermisos();
  verificarCrearHojasTrop();
  verificarCrearHojasParametrizacion();
  const props = PropertiesService.getScriptProperties();

  return {
    financieras:       getSheetDataDinamica("financieras"),
    cuotas:            getSheetDataDinamica("cuotas"),
    clientes:          getSheetDataDinamica("clientes"),
    porcentajes:       getSheetDataDinamica("porcentajes"),
    simulaciones:      getSheetDataDinamica("simulaciones"),
    roles:             getSheetDataDinamica("roles"),
    roles_permisos:    getSheetDataDinamica("roles_permisos"),
    bancos:            getSheetDataDinamica("bancos"),
    cuentas_tesoreria: getSheetDataDinamica("cuentas_tesoreria"),
    unidades_negocio:  getSheetDataDinamica("unidades_negocio"),
    config_permisos:   getSheetDataDinamica("CONFIG_PERMISOS"),
    trop_tareas:       getSheetDataDinamica("trop_tareas"),
    trop_visitas:      getSheetDataDinamica("trop_visitas"),
    trop_fotos_gps:    getSheetDataDinamica("trop_fotos_gps"),
    config_columnas:   getSheetDataDinamica("config_columnas"),
    config_aliados:    getSheetDataDinamica("config_aliados"),
    notificacion: {
      mensaje: props.getProperty('notif_msg') || '',
      tipo: props.getProperty('notif_tipo') || 'info',
      activo: props.getProperty('notif_activo') === 'true'
    },
    version: VERSION
  };
}

// ============================================================================
// 4. VERIFICACIÓN Y AUTOCREACIÓN DE PESTAÑAS FALTANTES
// ============================================================================
function verificarCrearHojaUnidadesNegocio() {
  let sheet = SS.getSheetByName("Unidades_Negocio");
  if (!sheet) {
    sheet = SS.insertSheet("Unidades_Negocio");
    sheet.appendRow(["id_un", "nombre", "estado"]);
    sheet.appendRow(["UN-ATL", "ATLANTICO", "activo"]);
    sheet.appendRow(["UN-BOL", "BOLIVAR", "activo"]);
    sheet.appendRow(["UN-MAG", "MAGDALENA", "activo"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:C1").setFontWeight("bold");
  }
}

function verificarCrearHojaCuentas() {
  let sheet = SS.getSheetByName("Cuentas_Tesoreria");
  if (!sheet) {
    sheet = SS.insertSheet("Cuentas_Tesoreria");
    sheet.appendRow(["id_cuenta", "banco", "tipo_cuenta", "numero_cuenta", "estado"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#f3f4f6");
    sheet.appendRow(["CTA-001", "Bancolombia", "Ahorros", "78800011050", "activo"]);
    sheet.appendRow(["CTA-002", "Efecty", "Convenio", "112978", "activo"]);
    sheet.appendRow(["CTA-003", "PuntoRed", "Convenio", "ALO CREDIT", "activo"]);
  }
  return sheet;
}

function verificarCrearHojaConfigPermisos() {
  let sheet = SS.getSheetByName("CONFIG_PERMISOS");
  if (!sheet) {
    sheet = SS.insertSheet("CONFIG_PERMISOS");
    sheet.appendRow(["ID_PERMISO", "TIPO_USUARIO", "MODULO", "PESTANA", "VER", "INTERACTUAR"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f4f6");
    sheet.appendRow(["PERM-1", "ADMINISTRADOR", "todos", "TODAS", true, true]);
    sheet.appendRow(["PERM-2", "CIA", "sim", "TODAS", true, true]);
    sheet.appendRow(["PERM-3", "CIA", "ext", "TODAS", true, true]);
    sheet.appendRow(["PERM-4", "ADMIN", "dash", "TODAS", true, true]);
    sheet.appendRow(["PERM-5", "TESORERO", "tes", "TODAS", true, true]);
    sheet.appendRow(["PERM-6", "CARTERA", "con", "TODAS", true, true]);
  }
  return sheet;
}

function guardarConfigPermisos(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CONFIG_PERMISOS');
  
  // Si la pestaña no existe, se crea con sus encabezados
  if (!sheet) {
    sheet = ss.insertSheet('CONFIG_PERMISOS');
    sheet.appendRow(['ID_PERMISO', 'TIPO_USUARIO', 'MODULO', 'PESTANA', 'VER', 'INTERACTUAR']);
  }
  
  // 1. Limpiar todas las filas de datos anteriores (desde la fila 2 hacia abajo)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // 2. Insertar la nueva lista de permisos activos enviada por la aplicación
  if (Array.isArray(payload) && payload.length > 0) {
    var newRows = payload.map(function(item) {
      return [
        item.ID_PERMISO || item.id || item.cedula || ('PERM-' + new Date().getTime()),
        item.TIPO_USUARIO || item.tipo_usuario || '',
        item.MODULO || item.modulo || '',
        item.PESTANA || item.pestana || 'TODAS',
        item.VER === true || item.ver === true || String(item.VER).toLowerCase() === 'true',
        item.INTERACTUAR === true || item.interactuar === true || String(item.INTERACTUAR).toLowerCase() === 'true'
      ];
    });
    
    sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return { status: 'success', message: 'Configuración de seguridad guardada correctamente' };
}

// ============================================================================
// 5.GESTIÓN DE CATÁLOGO DE PRECIOS (MEJORADO Y FLEXIBLE)
// ============================================================================
function getHojaPrecios(ss) {
  var sheet = ss.getSheetByName("precios");
  if (sheet) return sheet;
  
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    var sName = sheets[j].getName().toUpperCase().trim();
    if (sName === "PRECIOS" || sName.includes("PRECIO") || sName.includes("CATALOGO") || sName.includes("CATÁLOGO")) {
      return sheets[j];
    }
  }
  return null;
}

function getPreciosCatalogo() {
  try {
    const sheetPrecios = getHojaPrecios(SS);
    if (!sheetPrecios) return [];
    
    const dataRange = sheetPrecios.getDataRange().getValues();
    if (dataRange.length < 2) return [];

    // Detectar fila de encabezados automáticamente
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(5, dataRange.length); r++) {
      let rowStr = dataRange[r].join("").toUpperCase();
      if (rowStr.includes("MARCA") || rowStr.includes("REFERENCIA") || rowStr.includes("EQUIPO") || rowStr.includes("VENTA")) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = dataRange[headerRowIdx];
    const catalog = [];

    const colRef = headers.findIndex(h => {
      let s = String(h).toUpperCase();
      return s.includes("REFERENCIA") || s.includes("EQUIPO") || s.includes("MODELO") || s.includes("DESCRIPCION");
    });
    const colMarca = headers.findIndex(h => String(h).toUpperCase().includes("MARCA"));
    const colCosto = headers.findIndex(h => String(h).toUpperCase().includes("COSTO"));
    const colVenta = headers.findIndex(h => {
      let s = String(h).toUpperCase();
      return s.includes("VENTA") || s.includes("PÚBLICO") || s.includes("PUBLICO") || s.includes("PRECIO");
    });
    const colInicial = headers.findIndex(h => String(h).toUpperCase().includes("INICIAL"));
    const colRecibe = headers.findIndex(h => String(h).toUpperCase().includes("RECIBE") || String(h).toUpperCase().includes("EFECTIVO"));
    const colReturn = headers.findIndex(h => String(h).toUpperCase().includes("DEVOLUCION") || String(h).toUpperCase().includes("RETORNO"));
    const colCommTienda = headers.findIndex(h => String(h).toUpperCase().includes("COMISION TIENDA") || String(h).toUpperCase().includes("COMISIÓN TIENDA"));
    const colCommDist = headers.findIndex(h => String(h).toUpperCase().includes("GANANCIA DIST") || String(h).toUpperCase().includes("COMISION DIST"));

    for (let p = headerRowIdx + 1; p < dataRange.length; p++) {
      let row = dataRange[p];
      let refStr = colRef > -1 ? String(row[colRef]) : String(row[1] || "");
      let marcaStr = colMarca > -1 ? String(row[colMarca]) : String(row[0] || "");
      let costoNum = colCosto > -1 ? Number(String(row[colCosto]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let ventaNum = colVenta > -1 ? Number(String(row[colVenta]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let initialNum = colInicial > -1 ? Number(String(row[colInicial]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let receiveNum = colRecibe > -1 ? Number(String(row[colRecibe]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let returnNum = colReturn > -1 ? Number(String(row[colReturn]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let commTiendaNum = colCommTienda > -1 ? Number(String(row[colCommTienda]).replace(/[^0-9.-]+/g,"")) || 0 : 0;
      let commDistNum = colCommDist > -1 ? Number(String(row[colCommDist]).replace(/[^0-9.-]+/g,"")) || 0 : 0;

      if (refStr.trim() !== "") {
        catalog.push({
          brand: marcaStr.trim(),
          ref: refStr.trim(),
          cost: costoNum,
          sale: ventaNum,
          initial: initialNum,
          receive: receiveNum,
          return: returnNum,
          commTienda: commTiendaNum,
          commDist: commDistNum
        });
      }
    }
    return catalog;
  } catch(e) {
    return [];
  }
}

// ============================================================================
// 6. GESTIÓN DE CLIENTES, ALIADOS Y ROLES (CRUD)
// ============================================================================
function crearCliente(nombre, contrasena, rol, asesor, un) { 
  const idCliente = "CLI-" + Date.now().toString().slice(-4);
  const sheetClientes = SS.getSheetByName("Aliados_Clientes");
  
  const headers = sheetClientes.getRange(1, 1, 1, sheetClientes.getLastColumn()).getValues()[0];
  const newRow = new Array(headers.length).fill("");
  const setVal = (keys, val) => {
      const idx = headers.findIndex(h => keys.some(k => String(h).toUpperCase().trim() === k));
      if (idx !== -1) newRow[idx] = val;
  };
  
  setVal(["ID_CLIENTE", "ID"], idCliente);
  setVal(["NOMBRE_CLIENTE", "NOMBRE CLIENTE", "NOMBRE", "TIENDA"], nombre);
  setVal(["ESTADO"], "activo");
  setVal(["FECHA", "FECHA_REGISTRO", "FECHA REGISTRO"], new Date());
  setVal(["CONTRASENA", "CLAVE", "PASSWORD"], contrasena);
  setVal(["ROL"], rol || "");
  setVal(["ASESOR", "KAM"], asesor || "");
  setVal(["UN", "UNIDAD DE NEGOCIO", "UNIDAD_DE_NEGOCIO", "UNIDAD"], un || "");
  
  sheetClientes.appendRow(newRow);

  if (rol && rol !== "") {
    const sheetPermisos = SS.getSheetByName("Roles_permisos");
    const permisosData = sheetPermisos.getDataRange().getValues();
    const sheetPorcentajes = SS.getSheetByName("Porcentajes_Cliente_Financiera");
    
    for (let i = 1; i < permisosData.length; i++) {
      if (String(permisosData[i][0]).trim() === String(rol).trim()) {
        const idFin = permisosData[i][1];
        const factor = permisosData[i][2];
        sheetPorcentajes.appendRow([idCliente, idFin, Number(factor), "activo"]);
      }
    }
  }
  return "Aliado registrado y factores asignados."; 
}

function updateClienteCompleto(d) {
  updateRow("Aliados_Clientes", "id_cliente", d.id_cliente, { nombre_cliente: d.nombre_cliente, contrasena: d.contrasena, rol: d.rol || "", asesor: d.asesor || "" });
  var sheetBancos = SS.getSheetByName("Aliados_Bancos");
  if (sheetBancos) {
    var dataB = sheetBancos.getDataRange().getValues();
    var foundB = -1;
    for (var i = 1; i < dataB.length; i++) {
      if (String(dataB[i][0]).trim() === String(d.id_cliente).trim()) { foundB = i + 1; break; }
    }
    if (foundB > -1) {
      updateRow("Aliados_Bancos", "id_cliente", d.id_cliente, {
        nombre_comercio: d.nombre_comercio || "", 
        cedula_nit: d.cedula_nit || "",
        correo: d.correo || "",
        banco: d.banco || "",
        tipo_cuenta: d.tipo_cuenta || "",
        cuenta_bancaria: d.cuenta_bancaria || ""
      });
    } else {
      sheetBancos.appendRow([d.id_cliente, d.nombre_comercio || "", d.cedula_nit || "", d.correo || "", d.banco || "", d.tipo_cuenta || "", d.cuenta_bancaria || ""]);
    }
  }

  if (d.factores && d.factores.length > 0) {
    const sheetRel = SS.getSheetByName("Porcentajes_Cliente_Financiera");
    const dataRel = sheetRel.getDataRange().getValues();
    d.factores.forEach(f => {
      if (f.valor === "" || f.valor === null) return;
      let foundIndex = -1;
      for (let i = 1; i < dataRel.length; i++) {
        if (String(dataRel[i][0]).trim() === String(d.id_cliente).trim() && String(dataRel[i][1]).trim() === String(f.id_fin).trim()) {
          foundIndex = i + 1; break;
        }
      }
      if (foundIndex > -1) { sheetRel.getRange(foundIndex, 3).setValue(Number(f.valor)); } 
      else { sheetRel.appendRow([d.id_cliente, f.id_fin, Number(f.valor), "activo"]); }
    });
  }
  return "Actualización de Aliado exitosa.";
}

function crearRol(nombre) {
  SS.getSheetByName("Roles").appendRow(["ROL-" + Date.now().toString().slice(-4), nombre, "activo"]);
  return "Rol creado correctamente.";
}

function crearUN(nombre) {
  SS.getSheetByName("Unidades_Negocio").appendRow(["UN-" + Date.now().toString().slice(-4), nombre, "activo"]);
  return "Unidad de Negocio creada correctamente.";
}

function updateUN(d) {
  updateRow("Unidades_Negocio", "id_un", d.id_un, { nombre: d.nombre, estado: d.estado });
  return "Unidad de Negocio actualizada.";
}

function asignarFactorRol(d) {
  const sheet = SS.getSheetByName("Roles_permisos");
  const data = sheet.getDataRange().getValues();
  let found = -1;
  for(let i=1; i<data.length; i++){
      if(String(data[i][0]).trim() === String(d.id_rol).trim() && String(data[i][1]).trim() === String(d.id_financiera).trim()){
          found = i + 1; break;
      }
  }
  if(found > -1) {
      sheet.getRange(found, 3).setValue(Number(d.factor_cliente));
      return "Factor de rol actualizado.";
  } else {
      sheet.appendRow([d.id_rol, d.id_financiera, Number(d.factor_cliente), "activo"]);
      return "Factor de rol asignado.";
  }
}

function updateRolCompleto(d) {
  updateRow("Roles", "id_rol", d.id_rol, { nombre_rol: d.nombre_rol });
  if (d.factores) {
    const sheetRel = SS.getSheetByName("Roles_permisos");
    const dataRel = sheetRel.getDataRange().getValues();
    d.factores.forEach(f => {
      let foundIndex = -1;
      for (let i = 1; i < dataRel.length; i++) {
        if (String(dataRel[i][0]).trim() === String(d.id_rol).trim() && String(dataRel[i][1]).trim() === String(f.id_fin).trim()) {
          foundIndex = i + 1; break;
        }
      }
      if (f.valor === "" || f.valor === null) {
          if (foundIndex > -1) sheetRel.deleteRow(foundIndex);
      } else {
          if (foundIndex > -1) { sheetRel.getRange(foundIndex, 3).setValue(Number(f.valor)); } 
          else { sheetRel.appendRow([d.id_rol, f.id_fin, Number(f.valor), "activo"]); }
      }
    });
  }
  return "Rol y permisos actualizados exitosamente.";
}

function deletePorcentajeRol(d) {
  const sheet = SS.getSheetByName("Roles_permisos");
  const values = sheet.getDataRange().getValues();
  for(let i = 1; i < values.length; i++) {
    if(String(values[i][0]).trim() === String(d.id_rol).trim() && String(values[i][1]).trim() === String(d.id_financiera).trim()) {
      sheet.deleteRow(i + 1); return "Factor de rol borrado.";
    }
  }
  return "No encontrado.";
}

function updateRow(sheetName, idColName, idValue, data) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return false;
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIndex = headers.indexOf(idColName);
  if (colIndex === -1) return false;
  for(let i = 1; i < values.length; i++) {
    if(String(values[i][colIndex]).trim() === String(idValue).trim()) {
      for(let key in data) {
        let hIdx = headers.indexOf(key);
        if(hIdx > -1) {
          let val = data[key];
          if(!isNaN(val) && val !== "" && typeof val !== "boolean") val = Number(val);
          sheet.getRange(i + 1, hIdx + 1).setValue(val);
        }
      }
      return true;
    }
  }
  return false;
}

function updateFinanciera(d) { return updateRow("Financieras", "id_financiera", d.id_financiera, { nombre_financiera: d.nombre_financiera, factor_financiera: d.factor_financiera }) ? "Entidad actualizada." : "Error."; }
function crearFinanciera(nombre, factor) { SS.getSheetByName("Financieras").appendRow(["FIN-" + Date.now().toString().slice(-4), nombre, Number(factor), "activo"]); return "Entidad registrada."; }
function crearPlanCuota(d) { SS.getSheetByName("Financiera_Cuotas").appendRow(["PC-" + Date.now().toString().slice(-4), d.id_financiera, d.tipo_cuota, Number(d.tasa_interes), Number(d.tasa_fianza || 0), Number(d.numero_cuotas), "activo"]); return "Plan registrado."; }
function asignarFactorCliente(d) { SS.getSheetByName("Porcentajes_Cliente_Financiera").appendRow([d.id_cliente, d.id_financiera, Number(d.factor_cliente), "activo"]); return "Vinculación personalizada creada."; }

function crearCuentaTesoreria(d) {
  const sheet = verificarCrearHojaCuentas();
  const idCuenta = "CTA-" + Date.now().toString().slice(-4);
  sheet.appendRow([idCuenta, d.banco, d.tipo_cuenta, d.numero_cuenta, "activo"]);
  return "Cuenta agregada exitosamente.";
}

function updateCuentaTesoreria(d) {
  return updateRow("Cuentas_Tesoreria", "id_cuenta", d.id_cuenta, { 
    banco: d.banco, 
    tipo_cuenta: d.tipo_cuenta, 
    numero_cuenta: d.numero_cuenta,
    estado: d.estado || "activo"
  }) ? "Cuenta actualizada exitosamente." : "Error al actualizar la cuenta.";
}

function deleteRowByCol(sheetName, idColName, idValue) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return "Error: Hoja no encontrada";
  const values = sheet.getDataRange().getValues();
  const colIdx = values[0].indexOf(idColName);
  if (colIdx === -1) return "Error: Columna ID no encontrada";

  let deleted = false;
  for(let i = 1; i < values.length; i++) {
    if(String(values[i][colIdx]).trim() === String(idValue).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
      break; 
    }
  }

  if (deleted) {
    if (sheetName === "Aliados_Clientes") {
      borrarDatosRelacionadosCascada("Porcentajes_Cliente_Financiera", "id_cliente", idValue);
      borrarDatosRelacionadosCascada("Aliados_Bancos", "id_cliente", idValue);
    } 
    else if (sheetName === "Financieras") {
      borrarDatosRelacionadosCascada("Porcentajes_Cliente_Financiera", "id_financiera", idValue);
      borrarDatosRelacionadosCascada("Financiera_Cuotas", "id_financiera", idValue);
      borrarDatosRelacionadosCascada("Roles_permisos", "id_financiera", idValue);
    }
    else if (sheetName === "Roles") {
      borrarDatosRelacionadosCascada("Roles_permisos", "ROL", idValue);
    }
    return "Borrado exitoso con limpieza de datos relacionados.";
  }
  return "No se encontró el registro.";
}

function borrarDatosRelacionadosCascada(sheetName, colName, idValue) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const colIdx = data[0].indexOf(colName);
  if (colIdx === -1) return;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]).trim() === String(idValue).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deletePorcentaje(d) {
  const sheet = SS.getSheetByName("Porcentajes_Cliente_Financiera");
  const values = sheet.getDataRange().getValues();
  for(let i = 1; i < values.length; i++) {
    if(String(values[i][0]).trim() === String(d.id_cliente).trim() && String(values[i][1]).trim() === String(d.id_financiera).trim()) {
      sheet.deleteRow(i + 1); return "Vínculo borrado.";
    }
  }
  return "No encontrado.";
}

// ============================================================================
// 7. GESTIÓN DE SIMULACIONES Y ESTADOS
// ============================================================================
function guardarSimulacion(d) { 
  const simId = "SIM-" + Date.now().toString().slice(-6); 
  const fechaSimple = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "dd/MM/yyyy"); 
  let sheet = SS.getSheetByName("SIMULACION");
  if (!sheet) {
    sheet = SS.insertSheet("SIMULACION");
    sheet.appendRow(["ID_SIMULACION", "FECHA", "ID_CLIENTE", "ID_FINANCIERA", "ID_CUOTA", "PRECIO_PRODUCTO", "VALOR_A_CONSIGNAR", "UTILIDAD", "VALOR_CUOTA", "TOTAL_FINANCIADO", "N_CUOTAS", "CC", "NOMBRE", "CORREO", "CELULAR", "ESTADO"]);
  }
  sheet.appendRow([simId, fechaSimple, d.id_cliente, d.id_financiera, d.id_cuota, Number(d.precio_producto), Number(d.valor_a_consignar), Number(d.utilidad || 0), Number(d.valor_cuota), Number(d.total_financiado || 0), Number(d.n_cuotas), d.cc, d.nombre, d.correo, d.celular, "Pendiente"]); 
  return "Simulación registrada."; 
}

function actualizarEstadoSimulacion(d) {
  const sheet = SS.getSheetByName("SIMULACION");
  if (!sheet) throw new Error("La hoja SIMULACION no existe.");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
  const colId = headers.findIndex(h => String(h).toUpperCase() === "ID_SIMULACION" || String(h).toUpperCase() === "ID");
  const colCc = headers.findIndex(h => String(h).toUpperCase() === "CC" || String(h).toUpperCase() === "CEDULA");
  let colEstado = headers.findIndex(h => String(h).toUpperCase() === "ESTADO" || String(h).toUpperCase() === "PAGOS");
  if (colEstado === -1) colEstado = 15; 

  let colCuentaOrigen = headers.findIndex(h => String(h).toUpperCase() === "CUENTA ORIGEN" || String(h).toUpperCase() === "BANCO ORIGEN");
  if (colCuentaOrigen === -1 && d.cuenta_origen) {
    colCuentaOrigen = headers.length;
    sheet.getRange(1, colCuentaOrigen + 1).setValue("CUENTA ORIGEN");
  }

  const searchId = String(d.id_simulacion).trim();
  for (let i = values.length - 1; i > 0; i--) {
    let matchId = false;
    let matchCc = false;

    if (colId !== -1) {
      if (String(values[i][colId]).trim() === searchId) matchId = true;
    }
    if (colCc !== -1 && !matchId) {
      if (String(values[i][colCc]).trim() === searchId) matchCc = true;
    }

    if (matchId || matchCc) {
      sheet.getRange(i + 1, colEstado + 1).setValue(d.estado);
      if (d.cuenta_origen && colCuentaOrigen !== -1) {
        sheet.getRange(i + 1, colCuentaOrigen + 1).setValue(d.cuenta_origen);
      }
      return "Estado cambiado con éxito a " + d.estado;
    }
  }
  throw new Error("No se pudo encontrar la solicitud en el historial para actualizar el estado.");
}

// ============================================================================
// 8. PROCESAMIENTO DE FRAUDE Y ONBOARDING MULTI-CARTERA
// ============================================================================
function processCheckFraud(params) {
  const cedulaToSearch = String(params.cedula).replace(/\D/g, '');
  if (!cedulaToSearch) throw new Error("Cédula no válida.");

  const carteras = [
    { key: "payjoy", brand: "PAYJOY" },
    { key: "alocredit", brand: "ALOCREDIT" },
    { key: "krediya", brand: "KREDIYA" },
    { key: "credismart", brand: "CREDISMART" }
  ];

  for (let c of carteras) {
    const data = getSheetDataDinamica(c.key);
    for (let r of data) {
      const doc = String(r["CEDULA"] || r["CC"] || r["DOCUMENTO"] || "").replace(/\D/g, '');
      if (doc === cedulaToSearch) {
        let fecha = r["FECHA"] || r["FECHA VENTA"] || r["FECHA FIRMA"] || "Desconocida";
        return { result: "fraud", brand: c.brand, date: String(fecha) };
      }
    }
  }

  const dataOnb = getSheetDataDinamica("onboarding");
  let existingData = null;
  for (let ro of dataOnb) {
    const doc = String(ro["CEDULA"] || ro["CC"] || ro["DOCUMENTO"] || "").replace(/\D/g, '');
    if (doc === cedulaToSearch) {
      existingData = {
        nombre: ro["NOMBRE"] || "",
        fechaNac: ro["FECHA DE NACIMIENTO"] || ro["NACIMIENTO"] || "",
        telefono: ro["TELEFONO"] || ro["CELULAR"] || "",
        responsable: ro["RESPONSABLE"] || ro["VENDEDOR"] || "",
        ref1: ro["REFERENCIA 1"] || ro["REF1"] || "",
        telRef1: ro["TEL REFERENCIA 1"] || ro["TELREF1"] || "",
        ref2: ro["REFERENCIA 2"] || ro["REF2"] || "",
        telRef2: ro["TEL REFERENCIA 2"] || ro["TELREF2"] || ""
      };
      break;
    }
  }

  return { result: "clean", existingData: existingData };
}

function processSaveOnboarding(params) {
  let sheet = SS.getSheetByName("ONBOARDING");
  if (!sheet) {
    sheet = SS.insertSheet("ONBOARDING");
    sheet.appendRow(["CEDULA", "NOMBRE", "FECHA DE NACIMIENTO", "TELEFONO", "REFERENCIA 1", "TEL REFERENCIA 1", "REFERENCIA 2", "TEL REFERENCIA 2", "FECHA", "ESTADO", "FINANCIERA", "RESPONSABLE"]);
    sheet.setFrozenRows(1);
  }

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).toUpperCase().replace(/\s+/g, ''));

  const findIdx = (keys) => headers.findIndex(h => keys.some(k => h.includes(k.replace(/\s+/g, ''))));

  const idxCed = findIdx(["CEDULA", "CC", "DOCUMENTO"]);
  const idxNom = findIdx(["NOMBRE"]);
  const idxNac = findIdx(["NACIMIENTO", "FECHADENACIMIENTO"]);
  const idxTel = findIdx(["TELEFONO", "CELULAR"]);
  const idxR1  = findIdx(["REFERENCIA1", "REF1"]);
  const idxT1  = findIdx(["TELREFERENCIA1", "TELREF1"]);
  const idxR2  = findIdx(["REFERENCIA2", "REF2"]);
  const idxT2  = findIdx(["TELREFERENCIA2", "TELREF2"]);
  const idxFec = findIdx(["FECHA"]);
  const idxEst = findIdx(["ESTADO"]);
  const idxFin = findIdx(["FINANCIERA"]);
  const idxRes = findIdx(["RESPONSABLE", "VENDEDOR"]);

  const cleanCed = String(params.cedula).replace(/\D/g, '');
  let rowToUpdate = -1;

  if (idxCed !== -1 && sheet.getLastRow() > 1) {
    const dataOnb = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    for (let r = 0; r < dataOnb.length; r++) {
      if (String(dataOnb[r][idxCed]).replace(/\D/g, '') === cleanCed) {
        rowToUpdate = r + 2;
        break;
      }
    }
  }

  const nowStr = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

  if (rowToUpdate !== -1) {
    const rowRange = sheet.getRange(rowToUpdate, 1, 1, lastCol);
    const rowVal = rowRange.getValues()[0];
    if (idxNom !== -1) rowVal[idxNom] = params.nombre;
    if (idxNac !== -1 && params.fechaNac) rowVal[idxNac] = params.fechaNac;
    if (idxTel !== -1) rowVal[idxTel] = params.telefono;
    if (idxR1 !== -1)  rowVal[idxR1]  = params.ref1;
    if (idxT1 !== -1)  rowVal[idxT1]  = params.telRef1;
    if (idxR2 !== -1)  rowVal[idxR2]  = params.ref2;
    if (idxT2 !== -1)  rowVal[idxT2]  = params.telRef2;
    if (idxFec !== -1) rowVal[idxFec] = nowStr;
    if (idxEst !== -1) rowVal[idxEst] = "Aprobado (Actualizado)";
    if (idxFin !== -1 && params.financiera) rowVal[idxFin] = params.financiera;
    if (idxRes !== -1 && params.responsable) rowVal[idxRes] = params.responsable;
    rowRange.setValues([rowVal]);
  } else {
    const newRow = new Array(lastCol).fill("");
    if (idxCed !== -1) newRow[idxCed] = params.cedula;
    if (idxNom !== -1) newRow[idxNom] = params.nombre;
    if (idxNac !== -1) newRow[idxNac] = params.fechaNac || "";
    if (idxTel !== -1) newRow[idxTel] = params.telefono;
    if (idxR1 !== -1)  newRow[idxR1]  = params.ref1;
    if (idxT1 !== -1)  newRow[idxT1]  = params.telRef1;
    if (idxR2 !== -1)  newRow[idxR2]  = params.ref2;
    if (idxT2 !== -1)  newRow[idxT2]  = params.telRef2;
    if (idxFec !== -1) newRow[idxFec] = nowStr;
    if (idxEst !== -1) newRow[idxEst] = "Aprobado (Nuevo)";
    if (idxFin !== -1) newRow[idxFin] = params.financiera || "";
    if (idxRes !== -1) newRow[idxRes] = params.responsable || "";
    sheet.appendRow(newRow);
  }

  return { result: "success" };
}

function superCleanHeader(h) {
  if (!h && h !== 0) return "";
  var s = String(h).toUpperCase().trim();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents (É -> E, etc.)
  return s.replace(/[^A-Z0-9]/g, ""); // Remove spaces and punctuation
}

function normalizeKeyForMatch(val) {
  if (val === null || val === undefined) return "";
  var s = String(val).toUpperCase().trim();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.replace(/[^A-Z0-9]/g, ""); // Keeps letters & digits, removes spaces, dashes, dots, #
}

// ============================================================================
// 9. INYECCIÓN MASIVA (`bulk`) DE EXCEL A CUALQUIERA DE LAS PESTAÑAS
// ============================================================================
function processBulkUpload(typeKey, incomingData) {
  if (!incomingData || incomingData.length === 0) {
    throw new Error("No hay datos para sincronizar.");
  }

  let targetConfig = PESTANAS_CATALOGO[String(typeKey).toLowerCase()];
  let sheetName = targetConfig ? targetConfig.sheetName : typeKey;
  let sheet = SS.getSheetByName(sheetName);

  if (!sheet) {
    sheet = SS.insertSheet(sheetName);
  }

  let lastCol = sheet.getLastColumn();
  let lastRow = sheet.getLastRow();
  let headerRow = targetConfig ? targetConfig.headerRow : 1;

  if (lastCol === 0 || lastRow < headerRow) {
    const defaultHeaders = [
      "FECHA", "CEDULA", "NOMBRE CLIENTE", "TELEFONO", "CORREO", "IMEI",
      "EQUIPO", "VALOR VENTA", "CUOTA INICIAL", "SALDO A FINANCIAR", "PLAZO",
      "VALOR CUOTA", "ALIADO", "VENDEDOR", "ASIGNADO", "COMENTARIOS", "# CREDITO"
    ];
    sheet.getRange(headerRow, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    lastCol = defaultHeaders.length;
    lastRow = headerRow;
  }

  let headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  let cleanedHeaders = headers.map(superCleanHeader);

  // Auto-detect header row if configured row is empty or lacks key headers
  let hasValidHeader = cleanedHeaders.some(h => h.includes("CEDULA") || h.includes("DOCUMENTO") || h === "CC" || h.includes("CLIENTE") || h.includes("TAG") || h.includes("NOMBRE") || h.includes("CREDITO"));
  if (!hasValidHeader) {
    for (let r = 1; r <= Math.min(5, Math.max(lastRow, 1)); r++) {
      let testHeaders = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
      let testCleaned = testHeaders.map(superCleanHeader);
      if (testCleaned.some(h => h.includes("CEDULA") || h.includes("DOCUMENTO") || h === "CC" || h.includes("CLIENTE") || h.includes("TAG") || h.includes("NOMBRE") || h.includes("CREDITO"))) {
        headerRow = r;
        headers = testHeaders;
        cleanedHeaders = testCleaned;
        break;
      }
    }
  }

  const isVentasSheet = String(typeKey).toLowerCase().includes("ventas") || String(sheetName).toLowerCase().includes("ventas");

  // Identify ALL Cédula and Crédito column indices in sheet headers
  const cedulaCols = [];
  const creditoCols = [];
  for (let idx = 0; idx < cleanedHeaders.length; idx++) {
    let h = cleanedHeaders[idx];
    if (h.includes("FECHA") || h.includes("ESTADO") || h.includes("VALOR") || h.includes("MONTO") || h.includes("TIPO") || h.includes("FOTO") || h.includes("CUOTA")) continue;

    if (h === "CEDULA" || h === "CC" || h === "DOCUMENTO" || h === "ID" || h === "IDENTIFICACION" || h.includes("CEDULA") || h.includes("DOCUMENTO") || h.includes("IDENTIFICACION")) {
      cedulaCols.push(idx);
    }
    if (h === "CREDITO" || h === "TAG" || h === "CODIGOVENTA" || h === "IDAPLICACION" || h === "CONTRATO" || h.includes("CREDITO") || h.includes("TAG") || h.includes("CODIGO") || h.includes("APLICACION") || h.includes("CONTRATO") || h.includes("DISPOSITIVO") || h.includes("SIMULACION")) {
      creditoCols.push(idx);
    }
  }

  const startDataRow = headerRow + 1;
  const initialRowCount = (lastRow >= startDataRow) ? (lastRow - startDataRow + 1) : 0;
  let initialData = initialRowCount > 0
    ? sheet.getRange(startDataRow, 1, initialRowCount, lastCol).getValues()
    : [];

  // Build existingMap mapping Cédula and Crédito keys -> row index in initialData
  const existingMap = {};
  for (let r = 0; r < initialData.length; r++) {
    for (let colIdx of creditoCols) {
      let k = normalizeKeyForMatch(initialData[r][colIdx]);
      if (k && k.length >= 3) existingMap["CRED_" + k] = r;
    }
    if (!isVentasSheet) {
      for (let colIdx of cedulaCols) {
        let k = normalizeKeyForMatch(initialData[r][colIdx]);
        if (k && k.length >= 3) existingMap["CED_" + k] = r;
      }
    }
  }

  const newRowsToAppend = [];
  const newRowsMap = {};
  let hasExistingUpdates = false;

  // Helper to map item properties into ALL matching sheet row columns
  const fillRowFromArray = (itemObj, targetRow) => {
    let updated = false;

    // Pass 1: Exact column header matches across ALL matching column indices
    Object.keys(itemObj).forEach(k => {
      let normK = superCleanHeader(k);
      if (!normK) return;
      let val = itemObj[k];
      if (val === undefined || val === null || val === "") return;

      cleanedHeaders.forEach((h, idx) => {
        if (h === normK) {
          targetRow[idx] = val;
          updated = true;
        }
      });
    });

    // Pass 2: Fuzzy matches for unfilled columns (keys >= 4 chars)
    Object.keys(itemObj).forEach(k => {
      let normK = superCleanHeader(k);
      if (!normK || normK.length < 4) return;
      let val = itemObj[k];
      if (val === undefined || val === null || val === "") return;

      cleanedHeaders.forEach((h, idx) => {
        if (!h || h.length < 4) return;
        if (targetRow[idx] !== "") return; // Don't overwrite filled columns
        if (h === 'COSTOEQUIPO' && normK !== 'COSTOEQUIPO') return; // Do not fuzzy fill COSTO EQUIPO with EQUIPO or MARCA
        
        // Prevent cross-matching between completely different types of fields
        const isFecha1 = h.includes("FECHA");
        const isFecha2 = normK.includes("FECHA");
        if (isFecha1 !== isFecha2) return;

        const isValor1 = h.includes("VALOR") || h.includes("MONTO") || h.includes("PRECIO") || h.includes("TOTAL") || h.includes("SALDO");
        const isValor2 = normK.includes("VALOR") || normK.includes("MONTO") || normK.includes("PRECIO") || normK.includes("TOTAL") || normK.includes("SALDO");
        if (isValor1 !== isValor2) return;

        const isEstado1 = h.includes("ESTADO") || h.includes("STATUS");
        const isEstado2 = normK.includes("ESTADO") || normK.includes("STATUS");
        if (isEstado1 !== isEstado2) return;

        if (h.includes(normK) || normK.includes(h)) {
          targetRow[idx] = val;
          updated = true;
        }
      });
    });

    return updated;
  };

  const credKeys = [
    "CREDITO", "TAG", "CODIGOVENTA", "IDAPLICACION", "CONTRATO", "CODIGO_VENTA",
    "NUMERODECONTRATO", "NUMCONTRATO", "NROCONTRATO", "NOCONTRATO",
    "CODIGODISPOSITIVO", "CODIGODELDISPOSITIVO", "IDSIMULACION", "SIMULACION",
    "CODIGO", "IDCLIENTE", "NUMCREDITO"
  ];
  const cedKeys = ["CEDULA", "CC", "DOCUMENTO", "ID", "IDENTIFICACION", "CEDULACLIENTE"];

  for (let item of incomingData) {
    // Extract Crédito candidate from item
    let rawCredito = "";
    let credMatchLevel = 0;
    for (let k in item) {
      let normK = superCleanHeader(k);
      if (normK.includes("FECHA") || normK.includes("ESTADO") || normK.includes("VALOR") || normK.includes("MONTO") || normK.includes("TIPO") || normK.includes("FOTO") || normK.includes("CUOTA")) continue;

      if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") {
        if (credKeys.includes(normK)) {
          rawCredito = item[k];
          credMatchLevel = 2;
          break;
        } else if (credMatchLevel < 1 && credKeys.some(ck => ck.length >= 4 && normK.length >= 4 && (normK.includes(ck) || ck.includes(normK)))) {
          rawCredito = item[k];
          credMatchLevel = 1;
        }
      }
    }

    // Extract Cédula candidate from item
    let rawCedula = "";
    let cedMatchLevel = 0;
    for (let k in item) {
      let normK = superCleanHeader(k);
      if (normK.includes("FECHA") || normK.includes("ESTADO") || normK.includes("VALOR") || normK.includes("MONTO") || normK.includes("TIPO") || normK.includes("FOTO") || normK.includes("CUOTA")) continue;

      if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") {
        if (cedKeys.includes(normK)) {
          rawCedula = item[k];
          cedMatchLevel = 2;
          break;
        } else if (cedMatchLevel < 1 && cedKeys.some(ck => ck.length >= 4 && normK.length >= 4 && normK.includes(ck))) {
          rawCedula = item[k];
          cedMatchLevel = 1;
        }
      }
    }

    let cleanCred = normalizeKeyForMatch(rawCredito);
    let cleanCed = normalizeKeyForMatch(rawCedula);

    let rIndex = undefined;
    if (cleanCred && existingMap["CRED_" + cleanCred] !== undefined) {
      rIndex = existingMap["CRED_" + cleanCred];
    } else if (!cleanCred && cleanCed && !isVentasSheet && existingMap["CED_" + cleanCed] !== undefined) {
      rIndex = existingMap["CED_" + cleanCed];
    }

    if (rIndex !== undefined) {
      let currentRow = initialData[rIndex];
      let isUpdated = fillRowFromArray(item, currentRow);
      if (isUpdated) hasExistingUpdates = true;
    } else {
      // Check if this item matches a new row created earlier in this same batch
      let newIdx = undefined;
      if (cleanCred && newRowsMap["CRED_" + cleanCred] !== undefined) {
        newIdx = newRowsMap["CRED_" + cleanCred];
      } else if (!cleanCred && cleanCed && !isVentasSheet && newRowsMap["CED_" + cleanCed] !== undefined) {
        newIdx = newRowsMap["CED_" + cleanCed];
      }

      if (newIdx !== undefined) {
        fillRowFromArray(item, newRowsToAppend[newIdx]);
      } else {
        let newRow = new Array(lastCol).fill("");
        fillRowFromArray(item, newRow);
        newRowsToAppend.push(newRow);
        let createdIdx = newRowsToAppend.length - 1;
        if (cleanCred) newRowsMap["CRED_" + cleanCred] = createdIdx;
        if (cleanCed && !isVentasSheet) newRowsMap["CED_" + cleanCed] = createdIdx;
      }
    }
  }

  // Fast batch update for existing initial rows
  if (hasExistingUpdates && initialData.length > 0) {
    sheet.getRange(startDataRow, 1, initialData.length, lastCol).setValues(initialData);
  }

  // Fast batch append for new rows
  if (newRowsToAppend.length > 0) {
    let insertStart = sheet.getLastRow() + 1;
    if (insertStart < startDataRow) insertStart = startDataRow;
    sheet.getRange(insertStart, 1, newRowsToAppend.length, lastCol).setValues(newRowsToAppend);
  }

  return { result: "success", countInserted: newRowsToAppend.length, countUpdated: hasExistingUpdates ? initialData.length : 0 };
}

// ============================================================================
// 10. EDICIÓN Y ACTUALIZACIÓN EN VIVO (TABLEROS Y OPERACIONES)
// ============================================================================
function processSingleUpdate(params) {
  const typeKey = params.type;
  const idVal = String(params.id || '').replace(/\D/g, '');
  const updates = params.updates || [];

  if (!idVal) throw new Error("Falta el identificador ID/Cédula.");
  if (updates.length === 0) throw new Error("No hay campos para actualizar.");

  let targetConfig = PESTANAS_CATALOGO[String(typeKey).toLowerCase()];
  let sheetName = targetConfig ? targetConfig.sheetName : typeKey;
  let sheet = SS.getSheetByName(sheetName);

  if (!sheet) throw new Error("Pestaña '" + sheetName + "' no encontrada.");

  const startRow = targetConfig ? targetConfig.headerRow : 1;
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  if (lastRow <= startRow) throw new Error("No hay datos registrados en " + sheetName);

  const headers = sheet.getRange(startRow, 1, 1, lastCol).getValues()[0];
  let idColIndex = -1;

  for (let idx = 0; idx < headers.length; idx++) {
    let hi = String(headers[idx]).toUpperCase().trim();
    if (hi.includes("CEDULA") || hi.includes("DOCUMENTO") || hi === "CC" || hi === "ID" || hi === "NIT") {
      idColIndex = idx;
      break;
    }
  }

  if (idColIndex === -1) throw new Error("No se halló columna Cédula/ID en " + sheetName);

  const dataRange = sheet.getRange(startRow + 1, 1, lastRow - startRow, lastCol).getValues();
  let foundRow = -1;

  for (let r = 0; r < dataRange.length; r++) {
    let cleanVal = String(dataRange[r][idColIndex]).replace(/\D/g, '');
    if (cleanVal === idVal) {
      foundRow = (startRow + 1) + r;
      break;
    }
  }

  if (foundRow === -1) throw new Error("Registro no encontrado en " + sheetName);

  const dateStr = Utilities.formatDate(new Date(), SS.getSpreadsheetTimeZone(), "dd/MM");

  for (let upd of updates) {
    let colNameUpper = String(upd.column).toUpperCase().trim();
    let colIndex = headers.findIndex(h => String(h).toUpperCase().trim() === colNameUpper);

    if (colIndex === -1) {
      colIndex = headers.findIndex(h => String(h).toUpperCase().trim().includes(colNameUpper));
    }

    if (colIndex !== -1) {
      let cell = sheet.getRange(foundRow, colIndex + 1);
      let finalVal = upd.value;

      if (!upd.cleanWrite && upd.append) {
        let curVal = cell.getValue();
        if (curVal && String(curVal).trim() !== "") {
          finalVal = "[" + dateStr + "] " + upd.value + " | " + curVal;
        } else {
          finalVal = "[" + dateStr + "] " + upd.value;
        }
      }
      cell.setValue(finalVal);
    }
  }

  return { result: "success" };
}

// ============================================================================
// 11. FUNCIONES AUXILIARES DE LIMPIEZA Y FORMATEO
// ============================================================================
function parseDineroBackend(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  var numStr = String(val).replace(/[^0-9.,-]/g, '');
  numStr = numStr.replace(/[.,]00$/, ''); 
  numStr = numStr.replace(/[.,]/g, ''); 
  return parseInt(numStr, 10) || 0;
}

function parseDateStringBackend(d) {
  if (!d) return null;
  if (d instanceof Date) {
    var dStr = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var parts = dStr.split('-');
    return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
  }
  if (!isNaN(d)) {
    var num = Number(d);
    if (num > 30000 && num < 60000) { 
      return new Date(Math.round((num - 25569) * 86400 * 1000));
    }
  }
  var s = String(d).trim().toUpperCase();
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
    var parts = s.split('-');
    return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
  }
  var parts = s.split('/');
  if (parts.length === 3) {
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var year = parseInt(parts[2], 10);
    if (year < 100) year += 2000; 
    return new Date(year, month, day);
  }
  parts = s.split('-');
  if (parts.length === 3) {
    var day = parseInt(parts[0], 10);
    var year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    var monthStr = parts[1];
    var months = { 'ENE': 0, 'JAN': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AGO': 7, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11, 'DEC': 11 };
    var month = months[monthStr.substring(0, 3)];
    if (month !== undefined) {
      return new Date(year, month, day);
    } else if (!isNaN(monthStr)) {
      return new Date(year, parseInt(monthStr, 10) - 1, day);
    }
  }
  var parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
      var userOffset = parsed.getTimezoneOffset() * 60000;
      return new Date(parsed.getTime() + userOffset);
  }
  return null;
}

function superCleanString(str) {
  if (!str) return "";
  var s = String(str).toUpperCase();
  s = s.replace(/[ÁÄÀÂ]/g, 'A').replace(/[ÉËÈÊ]/g, 'E').replace(/[ÍÏÌÎ]/g, 'I').replace(/[ÓÖÒÔ]/g, 'O').replace(/[ÚÜÙÛ]/g, 'U').replace(/[Ñ]/g, 'N');
  return s.replace(/[^A-Z0-9]/g, ''); 
}

// ============================================================================
// 12. MENÚ PERSONALIZADO DE GOOGLE SHEETS Y MACROS PAYJOY
// ============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 MultiMarcas Auto')
    .addItem('📥 Descargar y Sincronizar Payjoy', 'obtenerVentasPayJoy')
    .addItem('⚡ Sincronizar Ventas a Cartera (Credismart, Krediya, Alocredit)', 'menuSincronizarNuevasCarteras')
    .addItem('🪄 Rellenar Datos Vacíos en Cartera', 'rellenarDatosFaltantesDesdeVentas')
    .addItem('🛡️ Sincronizar Onboarding a Carteras/Ventas', 'sincronizarOnboardingMasivo')
    .addItem('🛠️ Rescatar TAGs Faltantes (Payjoy)', 'repararTagsFaltantes')
    .addItem('🔄 Sincronizar Cartera Krediya (Antiguo)', 'sincronizarCarteraKrediya')
    .addItem('💵 Reparar Liquidación Payjoy (Últ. 7 Días)', 'recalcularLiquidacionPayjoy7Dias')
    .addItem('⚠️ FORZAR LLENADO REFERENCIAS', 'FORZAR_LLENADO_REFERENCIAS')
    .addToUi();
}

function sincronizarUnTagDesdeAPI(tagBuscado) {
  if (!tagBuscado) return { error: "TAG no proporcionado." };
  tagBuscado = String(tagBuscado).trim().toUpperCase();

  var apiKeys = getPayjoyKeys();
  var hojaNombre = "CARTERA PAYJOY GENERAL"; 
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(hojaNombre);
  if (!hoja) return { error: "No se encontró la hoja." };

  var ultFila = hoja.getLastRow();
  var ultCol = hoja.getLastColumn();
  if (ultFila < 2) return { error: "La hoja está vacía." };

  var datosIniciales = hoja.getRange(1, 1, Math.min(5, ultFila), ultCol).getValues();
  var filaEncabezados = 0;
  for (var i = 0; i < datosIniciales.length; i++) {
    var filaStr = datosIniciales[i].join("").toUpperCase();
    if (filaStr.includes("CEDULA") || filaStr.includes("TAG") || filaStr.includes("CODIGO")) { filaEncabezados = i; break; }
  }

  var cabeceras = hoja.getRange(filaEncabezados + 1, 1, 1, ultCol).getValues()[0];
  var colTag = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "TAG" || h === "CODIGO_VENTA" || h === "CÓDIGO_VENTA" || h === "CODIGO DEL DISPOSITIVO"; });
  var colCuotasPagas = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "CUOTAS PAGAS" || h === "CUOTAS PAGADAS" || h === "PAGADAS"; });
  var colCuotasAtrasadas = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "CUOTAS ATRASADAS" || h === "ATRASADAS" || h === "CUOTAS_ATRASADAS"; });
  var colFechaVenta = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "FECHA" || h === "FECHA VENTA" || h === "FECHA DE VENTA"; });
  var colPrimeraCuota = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "PRIMERA CUOTA" || h === "1ERA CUOTA" || h === "FECHA PAGO" || h === "FECHA DE PAGO"; });
  var colPlazo = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "PLAZO" || h === "# CUOTAS" || h === "SEMANAS"; });
  var colNombre = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "NOMBRE CLIENTE" || h === "NOMBRE COMPLETO" || h === "CLIENTE"; });

  if (colTag === -1 || colCuotasPagas === -1 || colCuotasAtrasadas === -1) return { error: "Faltan columnas vitales en la cabecera de la hoja Excel." };

  var columnaTAGs = hoja.getRange(filaEncabezados + 2, colTag + 1, ultFila - filaEncabezados - 1, 1).getValues();
  var filaCliente = -1;
  for (var r = 0; r < columnaTAGs.length; r++) {
    if (String(columnaTAGs[r][0]).trim().toUpperCase() === tagBuscado) { filaCliente = filaEncabezados + 2 + r; break; }
  }

  if (filaCliente === -1) return { error: "El TAG " + tagBuscado + " no se encuentra en tu Excel." };

  var hoy = new Date();
  hoy.setHours(0,0,0,0);
  var clienteEncontrado = false; 

  var cuotasPagasEnExcel = parseInt(hoja.getRange(filaCliente, colCuotasPagas + 1).getValue()) || 0;
  var plazoMaximo = colPlazo !== -1 ? parseInt(hoja.getRange(filaCliente, colPlazo + 1).getValue()) || 0 : 0;
  var fechaVentaVal = colFechaVenta !== -1 ? hoja.getRange(filaCliente, colFechaVenta + 1).getValue() : null;
  var primeraCuotaVal = colPrimeraCuota !== -1 ? hoja.getRange(filaCliente, colPrimeraCuota + 1).getValue() : null;
  var nombreCliente = colNombre !== -1 ? hoja.getRange(filaCliente, colNombre + 1).getValue() : "Desconocido";

  var cuotasPagasCalculadas = cuotasPagasEnExcel;
  var cuotasAtrasadasCalculadas = parseInt(hoja.getRange(filaCliente, colCuotasAtrasadas + 1).getValue()) || 0;
  var deudaTotal = 0;

  for (var k = 0; k < apiKeys.length; k++) {
    if (clienteEncontrado) break; 
    var url = "https://partner.payjoy.com/v1/lookup-customer.php?key=" + apiKeys[k] + "&customerLocator=" + tagBuscado + "&fields=device,financeOrder,customer";
    try {
      var respuesta = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
      if (respuesta.getResponseCode() === 200) {
         var json = JSON.parse(respuesta.getContentText());
         if (json.valid && (json.paymentHistory || json.financeOrder)) {
            clienteEncontrado = true;
            if (json.financeOrder && json.financeOrder.remainingBalance) deudaTotal = json.financeOrder.remainingBalance;
            var cuotasEstimadas = 0; var cuotaSemanal = 0; var totalPagado = 0; var conteoBloques = 0;
            if (json.paymentOptions) { for (var o = 0; o < json.paymentOptions.length; o++) { if (json.paymentOptions[o].type === "week") { cuotaSemanal = parseFloat(json.paymentOptions[o].amount) || 0; break; } } }
            if (json.paymentHistory) { conteoBloques = json.paymentHistory.length; for (var p = 0; p < json.paymentHistory.length; p++) { var monto = json.paymentHistory[p].amount; if (monto !== "" && monto !== null && !isNaN(monto)) totalPagado += parseFloat(monto); } }
            if (cuotaSemanal > 0 && totalPagado > 0) cuotasEstimadas = Math.floor(totalPagado / cuotaSemanal);
            else if (conteoBloques === 1 && (!json.paymentHistory[0].amount || json.paymentHistory[0].amount === "")) cuotasEstimadas = 0;
            else cuotasEstimadas = conteoBloques;
            
            if (cuotasEstimadas > cuotasPagasEnExcel) cuotasPagasCalculadas = cuotasEstimadas;
            var fechaBase = null; var esPrimeraCuota = false;
            if (primeraCuotaVal) { fechaBase = parseDateStringBackend(primeraCuotaVal); esPrimeraCuota = true; }
            if (!fechaBase && fechaVentaVal) { fechaBase = parseDateStringBackend(fechaVentaVal); esPrimeraCuota = false; }
            var diasMoraCalculados = 0; 
            
            if (fechaBase && !isNaN(fechaBase.getTime())) {
                fechaBase.setHours(0,0,0,0);
                var diasTranscurridos = Math.floor((hoy.getTime() - fechaBase.getTime()) / (1000 * 60 * 60 * 24));
                var cuotasDeberiaLlevar = 0;
                if (esPrimeraCuota) {
                    if (diasTranscurridos >= 0) cuotasDeberiaLlevar = Math.floor(diasTranscurridos / 14) + 1;
                    diasMoraCalculados = diasTranscurridos - (cuotasPagasCalculadas * 14);
                } else {
                    if (diasTranscurridos >= 14) cuotasDeberiaLlevar = Math.floor(diasTranscurridos / 14);
                    diasMoraCalculados = (diasTranscurridos - 14) - (cuotasPagasCalculadas * 14);
                }
                var limiteCuotas = plazoMaximo > 0 ? plazoMaximo : 16;
                if (cuotasDeberiaLlevar > limiteCuotas) cuotasDeberiaLlevar = limiteCuotas;
                cuotasAtrasadasCalculadas = Math.max(0, cuotasDeberiaLlevar - cuotasPagasCalculadas);
                if (cuotasPagasCalculadas >= limiteCuotas) { cuotasAtrasadasCalculadas = 0; diasMoraCalculados = 0; }
            }
            hoja.getRange(filaCliente, colCuotasPagas + 1).setValue(cuotasPagasCalculadas);
            hoja.getRange(filaCliente, colCuotasAtrasadas + 1).setValue(cuotasAtrasadasCalculadas);

            return { success: true, tag: tagBuscado, cliente: nombreCliente, pagas: cuotasPagasCalculadas, mora: cuotasAtrasadasCalculadas, diasMora: diasMoraCalculados, deuda: deudaTotal, cuota: cuotaSemanal > 0 ? (cuotaSemanal * 2) : 0 };
         }
      }
    } catch(e) { }
  }
  if (!clienteEncontrado) return { error: "No se pudo obtener información de PayJoy para el TAG: " + tagBuscado };
}

function obtenerVentasPayJoy() {
  var apiKeys = getPayjoyKeys();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaVentas = ss.getSheetByName("VENTAS PAYJOY");
  var hojaCartera = ss.getSheetByName("CARTERA PAYJOY GENERAL");
  var hojaUsuarios = ss.getSheetByName("USUARIOS PAYJOY");
  if (!hojaVentas || !hojaCartera) {
    SpreadsheetApp.getUi().alert("❌ Error: No se encontró la hoja VENTAS PAYJOY o CARTERA PAYJOY GENERAL");
    return;
  }

  var hoy = new Date();
  var haceTiempo = new Date();
  haceTiempo.setDate(hoy.getDate() - 30);
  var startTs = Math.floor(haceTiempo.getTime() / 1000); 
  var endTs = Math.floor(hoy.getTime() / 1000) + 86400;   

  var listaVentas = [];
  for (var k = 0; k < apiKeys.length; k++) {
    var url = "https://partner.payjoy.com/v1/list-transactions.php?key=" + apiKeys[k] + "&starttime=" + startTs + "&endtime=" + endTs;
    try {
      var respuesta = UrlFetchApp.fetch(url, { "method": "GET", "muteHttpExceptions": true });
      if (respuesta.getResponseCode() === 200) {
        var json = JSON.parse(respuesta.getContentText());
        if (json.transactions && json.transactions.length > 0) {
          listaVentas = listaVentas.concat(json.transactions);
        }
      }
    } catch (e) { console.log("Fallo API: " + e.toString()); }
  }

  if (listaVentas.length === 0) return;

  try {
    var ultFilaVentas = hojaVentas.getLastRow();
    var cedulasExistentesVentas = [];
    if (ultFilaVentas > 1) {
      var headersVentas = hojaVentas.getRange(1, 1, 1, hojaVentas.getLastColumn()).getValues()[0];
      var colCedulaVentas = headersVentas.findIndex(function(h) { return String(h).toUpperCase().includes("CEDULA") || String(h).toUpperCase() === "CC"; });
      if (colCedulaVentas === -1) colCedulaVentas = 6;
      var rangoCedulas = hojaVentas.getRange(2, colCedulaVentas + 1, ultFilaVentas - 1, 1).getValues();
      cedulasExistentesVentas = rangoCedulas.map(function(r) { return String(r[0]).trim().toLowerCase().replace("ppt", ""); });
    }
    
    var ultFilaCartera = hojaCartera.getLastRow();
    var ultColCartera = hojaCartera.getLastColumn();
    var cedulasExistentesCartera = [];
    var datosCarteraActual = [];
    var headersCartera = [];
    
    if (ultFilaCartera > 3) { 
       headersCartera = hojaCartera.getRange(1, 1, 1, ultColCartera).getValues()[0];
       datosCarteraActual = hojaCartera.getRange(4, 1, ultFilaCartera - 3, ultColCartera).getValues();
       
       var colCedulaCartera = headersCartera.findIndex(function(h) { return String(h).toUpperCase().trim().includes("CEDULA") || String(h).toUpperCase().trim() === "CC"; });
       if (colCedulaCartera === -1) colCedulaCartera = 5;
       cedulasExistentesCartera = datosCarteraActual.map(function(r) { return String(r[colCedulaCartera]).trim().toLowerCase().replace("ppt", ""); });
    }

    var colAsignadoIdx = headersCartera.length > 0 ? headersCartera.findIndex(function(h) { return String(h).toUpperCase().trim() === "ASIGNADO"; }) : -1;
    var colResponsableIdx = headersCartera.length > 0 ? headersCartera.findIndex(function(h) { return String(h).toUpperCase().trim() === "RESPONSABLE"; }) : -1;

    var mapaAsignaciones = {};
    if (hojaUsuarios) {
      var ultFilaUsu = hojaUsuarios.getLastRow();
      var ultColUsu = hojaUsuarios.getLastColumn();
      if (ultFilaUsu >= 3 && ultColUsu > 0) {
        var headersUsu = hojaUsuarios.getRange(3, 1, 1, ultColUsu).getValues()[0]; 
        var cNomUsu = headersUsu.findIndex(function(h) { return String(h).toUpperCase().includes("NOMBRE") || String(h).toUpperCase().includes("APELLIDO"); });
        var cAsigUsu = headersUsu.findIndex(function(h) { return String(h).toUpperCase().includes("ASINGACION") || String(h).toUpperCase().includes("ASIGNACION"); });
        var cConvUsu = headersUsu.findIndex(function(h) { return String(h).toUpperCase().includes("CONVENIO"); });
        var cTiendaUsu = headersUsu.findIndex(function(h) { return String(h).toUpperCase() === "TIENDA"; });
        
        if ((cNomUsu !== -1 || cTiendaUsu !== -1) && ultFilaUsu >= 4) { 
            var datosUsu = hojaUsuarios.getRange(4, 1, ultFilaUsu - 3, ultColUsu).getValues(); 
            for (var u = 0; u < datosUsu.length; u++) {
                var nombreVendedorUsu = cNomUsu !== -1 ? String(datosUsu[u][cNomUsu]).trim().toLowerCase() : "";
                var asignadoA = cAsigUsu !== -1 ? String(datosUsu[u][cAsigUsu]).trim() : "";
                var rawConvenio = cConvUsu !== -1 ? String(datosUsu[u][cConvUsu]).trim().toUpperCase() : "";
                var convenioVal = (rawConvenio === "") ? "SIN CONVENIO" : rawConvenio; 
                var tiendaUsu = cTiendaUsu !== -1 ? String(datosUsu[u][cTiendaUsu]).trim().toLowerCase() : "";
                
                if (nombreVendedorUsu) mapaAsignaciones[nombreVendedorUsu] = { asignado: asignadoA, convenio: convenioVal };
                if (tiendaUsu) mapaAsignaciones[tiendaUsu] = { asignado: asignadoA, convenio: convenioVal };
            }
        }
      }
    }

    var mapaPrecios = [];
    try {
      var hojaPrecios = ss.getSheetByName("precios");
      if (hojaPrecios) {
        var ultFilaPrecios = hojaPrecios.getLastRow();
        if (ultFilaPrecios > 1) {
          mapaPrecios = hojaPrecios.getRange(2, 1, ultFilaPrecios - 1, 15).getValues();
        }
      }
    } catch (e) { }

    var nuevasFilasVentas = [];
    var nuevasFilasCartera = [];
    var huboActualizacionesCartera = false;

    for (var i = 0; i < listaVentas.length; i++) {
      var t = listaVentas[i];
      var customer = t.customer || {};
      var device = t.device || {};
      var finance = t.financeOrder || {};
      var salesClerk = t.salesClerk || {};
      var merchant = t.merchant || {}; 

      var cedulaLimpia = String(customer.nationalId || "").toLowerCase().replace("ppt", "").trim();
      if (cedulaLimpia) {
        var fechaNormal = t.time ? new Date(t.time * 1000) : new Date();
        var marcaModelo = device.family ? (device.family.manufacturer + " " + (device.model ? device.model.name : "")) : "";
        var nombreVendedor = salesClerk.name || "";
        var nombreTienda = merchant.name || "";

        var infoVendedor = mapaAsignaciones[nombreTienda.toLowerCase().trim()] || 
                           mapaAsignaciones[nombreVendedor.toLowerCase().trim()] || 
                           { asignado: "", convenio: "SIN CONVENIO" }; 
        var asignadoEncontrado = infoVendedor.asignado;
        var convenioEncontrado = infoVendedor.convenio;

        var costoEqNum = 0;
        var referenciaFinal = marcaModelo;
        var purchaseAmount = parseDineroBackend(finance.purchaseAmount);
        var palabrasMarcaModelo = marcaModelo.toLowerCase().split(" ").filter(function(p) { return p.trim() !== ""; });
        var maxCoincidencias = 0;
        var teniaPrecioExacto = false; 

        for (var p = 0; p < mapaPrecios.length; p++) {
          var refSim = String(mapaPrecios[p][1]).toLowerCase();
          var precioSim = parseDineroBackend(mapaPrecios[p][3]);
          var coincidencias = 0;
          palabrasMarcaModelo.forEach(function(pal) { if (refSim.includes(pal)) coincidencias++; });
          var esPrecioExacto = (precioSim === purchaseAmount);

          if (coincidencias > maxCoincidencias || (coincidencias === maxCoincidencias && !teniaPrecioExacto && esPrecioExacto)) {
            maxCoincidencias = coincidencias;
            costoEqNum = parseDineroBackend(mapaPrecios[p][2]);
            referenciaFinal = mapaPrecios[p][1];
            teniaPrecioExacto = esPrecioExacto;
          }
        }

        var cuotaInicial = parseDineroBackend(finance.downPayment);
        var montoAConsignar = purchaseAmount - cuotaInicial;
        var remanenteInicial = (cuotaInicial > (purchaseAmount * 0.30)) ? (cuotaInicial - (purchaseAmount * 0.30)) : 0;
        
        var asignadoMin = asignadoEncontrado.toLowerCase();
        var tiendaMin = nombreTienda.toLowerCase();
        
        var esPipeOChamorro = asignadoMin.includes("pipe") || asignadoMin.includes("chamorro") || asignadoMin.includes("edwin ortiz") || asignadoMin.includes("melissa") || asignadoMin.includes("beltran");
        var esRicardo = asignadoMin.includes("ricardo");
        var esJuanCamilo = asignadoMin.includes("camilo");
        var esEjecutivo = asignadoMin.includes("ejecutivo") || asignadoMin.includes("vitrina cristhian") || asignadoMin.includes("vitrina criathian");
        var esAliadoOVitrina = tiendaMin.includes("aliado") || tiendaMin.includes("vitrina");

        var carteraFee = 40000;
        var comisionRetailB = ""; 
        var liquidacionAdmin112 = 0;
        var utilidadBase = (montoAConsignar + remanenteInicial - costoEqNum);
        
        if (esPipeOChamorro) { liquidacionAdmin112 = 70000; } 
        else if (esRicardo) { liquidacionAdmin112 = (utilidadBase * 0.5) - (carteraFee / 2); } 
        else if (esJuanCamilo || esEjecutivo || esAliadoOVitrina) {
             comisionRetailB = 40000;
             liquidacionAdmin112 = montoAConsignar + remanenteInicial - (costoEqNum + 40000) - carteraFee;
        } else { liquidacionAdmin112 = utilidadBase - carteraFee; }

        var aConsignarPipeChamorro = esPipeOChamorro ? (montoAConsignar - liquidacionAdmin112 - carteraFee) : "";
        var aConsignarRicardo = esRicardo ? (((utilidadBase * 0.5) - (carteraFee / 2)) + costoEqNum) : "";
        var aConsignarJuanCamilo = esJuanCamilo ? (costoEqNum + 40000) : "";
        var aConsignarEjecutivos = esEjecutivo ? (costoEqNum + 40000) : "";
        var porcentajeCalculado = purchaseAmount > 0 ? Math.round((cuotaInicial / purchaseAmount) * 100) + "%" : "0%";
        var primeraCuota = new Date(fechaNormal); 
        primeraCuota.setDate(primeraCuota.getDate() + 14);

        if (!cedulasExistentesVentas.includes(cedulaLimpia)) {
            var newRowV = new Array(headersVentas.length).fill("");
            headersVentas.forEach(function(header, hv) {
                var h = String(header).toUpperCase().trim();
                if (h === "FECHA" || h === "FECHA VENTA") newRowV[hv] = fechaNormal;
                else if (h === "ASIGNADO" || h === "RESPONSABLE") newRowV[hv] = asignadoEncontrado;
                else if (h === "CONVENIO") newRowV[hv] = convenioEncontrado;
                else if (h === "VENDEDOR") newRowV[hv] = nombreVendedor;
                else if (h === "TIENDA" || h === "SUCURSAL") newRowV[hv] = nombreTienda;
                else if (h.includes("NOMBRE DEL CLIENTE") || h === "NOMBRE CLIENTE" || h === "CLIENTE") newRowV[hv] = customer.name || "";
                else if (h === "CEDULA" || h === "CC" || h === "DOCUMENTO") newRowV[hv] = cedulaLimpia;
                else if (h.includes("NACIMIENTO") || h.includes("NACIMENTO")) newRowV[hv] = ""; 
                else if (h === "CELULAR" || h === "TELEFONO" || h === "CONTACTO") newRowV[hv] = device.phoneNumber || "";
                else if (h === "TAG" || h.includes("CODIGO")) newRowV[hv] = device.deviceTag || "";
                else if (h.includes("REFERENCIA") || h === "EQUIPO" || h === "MODELO") newRowV[hv] = referenciaFinal;
                else if (h === "IMEI 1" || h === "IMEI") newRowV[hv] = device.imei || "";
                else if (h === "IMEI 2") newRowV[hv] = device.imei2 || "";
                else if (h === "VENTA" || h.includes("TOTAL VENTA") || h === "PRECIO DE VENTA") newRowV[hv] = purchaseAmount;
                else if (h === "CUOTA INICIAL" || h.includes("VALOR CUOTA INICIAL")) newRowV[hv] = cuotaInicial;
                else if (h === "% CUOTA INICIAL" || h === "% INICIAL") newRowV[hv] = porcentajeCalculado;
                else if (h.includes("REMANENTE")) newRowV[hv] = remanenteInicial;
                else if (h === "MONTO A CONSIGNAR" || h === "SALDO A FINANCIAR") newRowV[hv] = montoAConsignar;
                else if (h.includes("COSTOS EQUIPO") || h.includes("COSTO EQUIPO")) newRowV[hv] = costoEqNum;
                else if (h.includes("RETAIL B")) newRowV[hv] = comisionRetailB;
                else if (h === "CARTERA" || h.includes("FEE")) newRowV[hv] = carteraFee;
                else if (h.includes("ADMIN 112") || h.includes("UTILIDADES ADMIN")) newRowV[hv] = liquidacionAdmin112;
                else if (h.includes("PIPE Y CHAMORRO") || h.includes("LIQUIDACION PIPE")) newRowV[hv] = aConsignarPipeChamorro;
                else if (h.includes("RICARDO")) newRowV[hv] = aConsignarRicardo;
                else if (h.includes("JUAN CAMILO")) newRowV[hv] = aConsignarJuanCamilo;
                else if (h.includes("EJECUTIVO")) newRowV[hv] = aConsignarEjecutivos;
                else if (h === "ESTADO" || h === "PAGOS") newRowV[hv] = "Pendiente";
            });

            nuevasFilasVentas.push(newRowV);
            cedulasExistentesVentas.push(cedulaLimpia);
        }

        var idxC = cedulasExistentesCartera.indexOf(cedulaLimpia);
        if (idxC === -1) {
            var newRowC = new Array(headersCartera.length).fill("");
            headersCartera.forEach(function(header, idx) {
                var h = String(header).toUpperCase().trim();
                if (h === "FECHA" || h === "FECHA VENTA") newRowC[idx] = fechaNormal;
                else if (h === "VENDEDOR") newRowC[idx] = nombreVendedor;
                else if (h === "TIENDA" || h === "EMPRESA") newRowC[idx] = nombreTienda;
                else if (h === "ASIGNADO" || h === "RESPONSABLE") newRowC[idx] = asignadoEncontrado;
                else if (h === "CONVENIO") newRowC[idx] = convenioEncontrado;
                else if (h.includes("NOMBRE CLIENTE") || h === "CLIENTE" || h === "NOMBRE COMPLETO" || h === "NOMBRES") newRowC[idx] = customer.name || "";
                else if (h === "CC" || h === "CEDULA" || h === "DOCUMENTO") newRowC[idx] = cedulaLimpia;
                else if (h === "PRIMERA CUOTA" || h === "FECHA PAGO") newRowC[idx] = primeraCuota;
                else if (h === "CELULAR" || h.includes("CEL CLIENTE") || h === "TELEFONO" || h === "CONTACTO") newRowC[idx] = device.phoneNumber || "";
                else if (h === "TAG" || h.includes("CODIGO")) newRowC[idx] = device.deviceTag || "";
                else if (h.includes("EQUIPO") || h === "REFERENCIA" || h === "MODELO") newRowC[idx] = referenciaFinal;
                else if (h === "IMEI 1" || h === "IMEI") newRowC[idx] = device.imei || "";
                else if (h === "IMEI 2") newRowC[idx] = device.imei2 || "";
                else if (h === "VENTA" || h.includes("VENTA ADELANTOS") || h.includes("TOTAL VENTA") || h === "PRECIO DE VENTA") newRowC[idx] = purchaseAmount;
                else if (h === "CUOTA INICIAL" || h.includes("VALOR CUOTA INICIAL")) newRowC[idx] = cuotaInicial;
                else if (h === "% INICIAL" || h === "%" || h === "% CUOTA INICIAL") newRowC[idx] = porcentajeCalculado;
                else if (h === "PAGOS" || h === "ESTADO") newRowC[idx] = "Pendiente";
            });
            nuevasFilasCartera.push(newRowC);
        } else {
            var f = datosCarteraActual[idxC];
            headersCartera.forEach(function(header, idx) {
                var h = String(header).toUpperCase().trim();
                if (h === "FECHA" || h === "FECHA VENTA") f[idx] = fechaNormal;
                else if (h === "VENDEDOR") f[idx] = nombreVendedor;
                else if (h === "TIENDA" || h === "EMPRESA") f[idx] = nombreTienda;
                else if (h.includes("NOMBRE CLIENTE") || h === "CLIENTE" || h === "NOMBRE COMPLETO") { if(customer.name) f[idx] = customer.name; }
                else if (h === "CELULAR" || h.includes("CEL CLIENTE") || h === "TELEFONO") { if(device.phoneNumber) f[idx] = device.phoneNumber; }
                else if (h === "TAG" || h.includes("CODIGO")) { if(device.deviceTag) f[idx] = device.deviceTag; }
                else if (h.includes("EQUIPO") || h === "REFERENCIA" || h === "MODELO") f[idx] = referenciaFinal;
                else if (h === "IMEI 1" || h === "IMEI") f[idx] = device.imei || "";
                else if (h === "IMEI 2") f[idx] = device.imei2 || "";
                else if (h === "VENTA" || h.includes("VENTA ADELANTOS") || h.includes("TOTAL VENTA")) f[idx] = purchaseAmount;
                else if (h === "CUOTA INICIAL" || h.includes("VALOR CUOTA INICIAL")) f[idx] = cuotaInicial;
                else if (h === "% INICIAL" || h === "%" || h === "% CUOTA INICIAL") f[idx] = porcentajeCalculado;
                else if (h === "CONVENIO" && String(f[idx]).trim() === "") f[idx] = convenioEncontrado;
            });

            var vAsi = colAsignadoIdx !== -1 ? String(f[colAsignadoIdx]).trim() : "";
            var vRes = colResponsableIdx !== -1 ? String(f[colResponsableIdx]).trim() : "";
            if (vAsi === "" && vRes === "") {
                if (colAsignadoIdx !== -1) f[colAsignadoIdx] = asignadoEncontrado;
                if (colResponsableIdx !== -1) f[colResponsableIdx] = asignadoEncontrado;
            } else if (vAsi !== "" && vRes !== vAsi) {
                if (colResponsableIdx !== -1) f[colResponsableIdx] = vAsi;
            } else if (vRes !== "" && vAsi !== vRes) {
                if (colAsignadoIdx !== -1) f[colAsignadoIdx] = vRes;
            }
            huboActualizacionesCartera = true;
        }
      }
    }

    if (nuevasFilasVentas.length > 0) { 
        hojaVentas.getRange(ultFilaVentas + 1, 1, nuevasFilasVentas.length, nuevasFilasVentas[0].length).setValues(nuevasFilasVentas);
    }
    if (huboActualizacionesCartera && ultFilaCartera > 3) { 
        hojaCartera.getRange(4, 1, ultFilaCartera - 3, ultColCartera).setValues(datosCarteraActual);
    }
    if (nuevasFilasCartera.length > 0) {
        var filaIns = ultFilaCartera < 3 ? 4 : ultFilaCartera + 1;
        hojaCartera.getRange(filaIns, 1, nuevasFilasCartera.length, nuevasFilasCartera[0].length).setValues(nuevasFilasCartera);
    }
  } catch (e) { console.log("Fallo durante el procesamiento: " + e.toString()); }
}

function sincronizarVentasACartera(marca) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let nombreHojaVentas, nombreHojaCartera;
  
  if (marca === "CREDISMART") { nombreHojaVentas = "VENTAS CREDISMART"; nombreHojaCartera = "CARTERA CREDISMART GENERAL"; } 
  else if (marca === "KREDIYA") { nombreHojaVentas = "VENTAS KREDIYA"; nombreHojaCartera = "CARTERA KREDIYA GENERAL"; } 
  else if (marca === "ALOCREDIT") { nombreHojaVentas = "VENTAS ALOCREDIT"; nombreHojaCartera = "CARTERA ALOCREDIT GENERAL"; } 
  else return 0;

  const hojaVentas = ss.getSheetByName(nombreHojaVentas);
  const hojaCartera = ss.getSheetByName(nombreHojaCartera);
  if (!hojaVentas || !hojaCartera) return 0;

  const ultFilaV = hojaVentas.getLastRow();
  const ultColV = hojaVentas.getLastColumn();
  if (ultFilaV < 2) return 0;
  
  let headerRowV = 1;
  const headersVData = hojaVentas.getRange(1, 1, Math.min(5, ultFilaV), ultColV).getValues();
  for (let r = 0; r < headersVData.length; r++) {
    const esCabecera = headersVData[r].some(function(celda) {
        const val = String(celda).toUpperCase().replace(/\s+/g, '');
        return val === "CEDULA" || val === "CC" || val === "DOCUMENTO" || val === "IDENTIFICACION";
    });
    if (esCabecera) { headerRowV = r + 1; break; }
  }
  
  const headersV = hojaVentas.getRange(headerRowV, 1, 1, ultColV).getValues()[0].map(h => String(h).toUpperCase().trim());
  const dataV = hojaVentas.getRange(headerRowV + 1, 1, ultFilaV - headerRowV, ultColV).getValues();

  const ultFilaC = hojaCartera.getLastRow();
  const ultColC = hojaCartera.getLastColumn();
  if (ultColC === 0) return 0;
  
  let tempHeaderRowC = 1;
  const headersCData = hojaCartera.getRange(1, 1, Math.min(5, Math.max(ultFilaC, 5)), ultColC).getValues();
  for (let r = 0; r < headersCData.length; r++) {
    const esCabecera = headersCData[r].some(function(celda) {
        const val = String(celda).toUpperCase().replace(/\s+/g, '');
        return val === "CEDULA" || val === "CC" || val === "DOCUMENTO" || val === "IDENTIFICACION";
    });
    if (esCabecera) { 
        tempHeaderRowC = r + 1; 
        if (marca === 'ALOCREDIT' && tempHeaderRowC === 2) {
            const row3 = hojaCartera.getRange(3, 1, 1, ultColC).getValues()[0];
            const hasData = row3.some(cell => String(cell).trim() !== "");
            if(!hasData) tempHeaderRowC = 3; 
        }
        break; 
    }
  }
  
  const headersC = hojaCartera.getRange(tempHeaderRowC, 1, 1, ultColC).getValues()[0].map(h => String(h).toUpperCase().trim());
  const findIdx = (headers, keys) => {
      let idx = headers.findIndex(h => keys.includes(h));
      if (idx !== -1) return idx;
      return headers.findIndex(h => keys.some(k => h.includes(k) && !h.includes("#")));
  };
  const vColCedula = findIdx(headersV, ["CC", "CEDULA", "DOCUMENTO"]);
  const cColCedula = findIdx(headersC, ["CC", "CEDULA", "DOCUMENTO"]);
  if (vColCedula === -1 || cColCedula === -1) return 0;

  let cedulasEnCartera = new Set();
  if (ultFilaC > tempHeaderRowC) {
    const dataC = hojaCartera.getRange(tempHeaderRowC + 1, cColCedula + 1, ultFilaC - tempHeaderRowC, 1).getValues();
    dataC.forEach(r => { let num = String(r[0]).replace(/\D/g, ''); if (num) cedulasEnCartera.add(num); });
  }

  const hojaUsuarios = ss.getSheetByName("USUARIOS PAYJOY");
  let mapaAsignaciones = {};
  if (hojaUsuarios) {
    const ultFilaUsu = hojaUsuarios.getLastRow();
    const ultColUsu = hojaUsuarios.getLastColumn();
    if (ultFilaUsu >= 3 && ultColUsu > 0) {
      const headersUsu = hojaUsuarios.getRange(3, 1, 1, ultColUsu).getValues()[0];
      const cNomUsu = headersUsu.findIndex(h => String(h).toUpperCase().includes("NOMBRE") || String(h).toUpperCase().includes("APELLIDO"));
      const cAsigUsu = headersUsu.findIndex(h => String(h).toUpperCase().includes("ASINGACION") || String(h).toUpperCase().includes("ASIGNACION"));
      const cConvUsu = headersUsu.findIndex(h => String(h).toUpperCase().includes("CONVENIO"));
      const cTiendaUsu = headersUsu.findIndex(h => String(h).toUpperCase() === "TIENDA");
      
      if ((cNomUsu !== -1 || cTiendaUsu !== -1) && ultFilaUsu >= 4) {
          const datosUsu = hojaUsuarios.getRange(4, 1, ultFilaUsu - 3, ultColUsu).getValues();
          for (let u = 0; u < datosUsu.length; u++) {
              const nombreVendedorUsu = cNomUsu !== -1 ? String(datosUsu[u][cNomUsu]).trim().toLowerCase() : "";
              const asignadoA = cAsigUsu !== -1 ? String(datosUsu[u][cAsigUsu]).trim() : "";
              let rawConvenio = cConvUsu !== -1 ? String(datosUsu[u][cConvUsu]).trim().toUpperCase() : "";
              const convenioVal = (rawConvenio === "") ? "SIN CONVENIO" : rawConvenio;
              const tiendaUsu = cTiendaUsu !== -1 ? String(datosUsu[u][cTiendaUsu]).trim().toLowerCase() : "";
              if (nombreVendedorUsu) mapaAsignaciones[nombreVendedorUsu] = { asignado: asignadoA, convenio: convenioVal };
              if (tiendaUsu) mapaAsignaciones[tiendaUsu] = { asignado: asignadoA, convenio: convenioVal };
          }
      }
    }
  }

  const nuevasFilas = [];
  dataV.forEach(rowV => {
    let rawCedula = rowV[vColCedula];
    if (!rawCedula) return;
    let cedulaV = String(rawCedula).replace(/\D/g, '');
    if (cedulaV === "" || cedulasEnCartera.has(cedulaV)) return;

    let nuevaFila = new Array(ultColC).fill("");

    const getV = (keys) => {
      let idx = headersV.findIndex(h => keys.includes(h));
      if (idx !== -1) return rowV[idx];
      idx = headersV.findIndex(h => {
         return keys.some(k => {
             if (k === "CUOTA INICIAL" && h.includes("%")) return false; 
             if (k === "VALOR CUOTA" && h.includes("INICIAL")) return false; 
             if (k === "MONTO A FINANCIAR" && h.includes("REMANENTE")) return false; 
             if (h.includes("#")) return false; 
             return h.includes(k);
         });
      });
      return idx !== -1 ? rowV[idx] : "";
    };

    let colNombresIdx = headersV.findIndex(h => h === "NOMBRES" || h === "NOMBRE");
    let colApellidosIdx = headersV.findIndex(h => h === "APELLIDOS" || h === "APELLIDO");
    
    let n1 = colNombresIdx !== -1 ? rowV[colNombresIdx] : "";
    let a1 = colApellidosIdx !== -1 ? rowV[colApellidosIdx] : "";
    
    if(!n1 && !a1) n1 = getV(["NOMBRE CLIENTE", "CLIENTE", "NOMBRE COMPLETO"]);

    let nombreCompleto = a1 ? (String(n1).trim() + " " + String(a1).trim()) : String(n1).trim();

    let nombreVendedor = getV(["VENDEDOR", "NOMBRE VENDEDOR"]);
    let nombreTienda = getV(["TIENDA", "SUCURSAL"]);
    let infoVendedor = mapaAsignaciones[String(nombreTienda).toLowerCase().trim()] || 
                       mapaAsignaciones[String(nombreVendedor).toLowerCase().trim()] || 
                       { asignado: "", convenio: "SIN CONVENIO" };
                       
    let convenioEncontrado = infoVendedor.convenio;
    let fecha = getV(["FECHA FIRMA", "FECHA", "FECHA VENTA"]);
    let primeraCuota = "";
    if (fecha instanceof Date) {
        let pc = new Date(fecha);
        pc.setDate(pc.getDate() + 14);
        primeraCuota = pc;
    }

    var cuotaInicial = parseDineroBackend(getV(["VALOR CUOTA INICIAL", "CUOTA INICIAL"]));
    var montoAConsignar = parseDineroBackend(getV(["SALDO A FINANCIAR", "SALDO A FINACIAR", "MONTO TOTAL A FINANCIAR", "MONTO A FINANCIAR", "MONTO A CONSIGNAR", "VALOR CREDITO"]));
    
    var purchaseAmount = 0;
    if (montoAConsignar > 0) {
        purchaseAmount = montoAConsignar + cuotaInicial;
    } else {
        purchaseAmount = parseDineroBackend(getV(["TOTAL VENTA", "PRECIO DE VENTA", "VALOR VENTA", "VENTA"]));
        montoAConsignar = purchaseAmount - cuotaInicial;
    }

    var remanenteInicial = (cuotaInicial > (purchaseAmount * 0.30)) ? (cuotaInicial - (purchaseAmount * 0.30)) : 0;
    var asignadoMin = infoVendedor.asignado ? infoVendedor.asignado.toLowerCase() : "";
    var esPipeOChamorro = asignadoMin.includes("pipe") || asignadoMin.includes("chamorro") || asignadoMin.includes("edwin ortiz") || asignadoMin.includes("melissa") || asignadoMin.includes("beltran");
    
    var carteraFee = 40000;
    var aConsignarPipeChamorro = "";
    var liquidacionAdmin112 = "";
    var isNewRuleDate = (fecha instanceof Date) && fecha.getTime() >= new Date(2026, 4, 26).getTime();

    if (esPipeOChamorro) {
        if (isNewRuleDate) {
            var colCostoEq = headersV.findIndex(function(h) { return String(h).toUpperCase().trim().includes('COSTO EQUIPO') || String(h).toUpperCase().trim().includes('COSTOS EQUIPOS'); });
            var costoEqNum = colCostoEq !== -1 ? parseDineroBackend(rowV[colCostoEq]) : 0;
            var utilidadReal = montoAConsignar + remanenteInicial - costoEqNum;
            liquidacionAdmin112 = utilidadReal * 0.40;
            aConsignarPipeChamorro = (utilidadReal * 0.60) - carteraFee;
        } else {
            liquidacionAdmin112 = 70000;
            aConsignarPipeChamorro = montoAConsignar - 70000 - carteraFee;
        }
    }

    headersC.forEach((hC, idx) => {
      let h = hC.toUpperCase().trim();
      if (h === "CC" || h === "CEDULA" || h === "DOCUMENTO" || h === "IDENTIFICACION") nuevaFila[idx] = cedulaV;
      else if (h === "NOMBRE CLIENTE" || h === "CLIENTE" || h === "NOMBRE COMPLETO" || h.includes("NOMBRE CLIENTE") || h.includes("NOMBRE DEL CLIENTE")) nuevaFila[idx] = nombreCompleto;
      else if (h === "FECHA" || h === "FECHA VENTA" || h === "FECHA FIRMA") nuevaFila[idx] = fecha;
      else if (h === "PRIMERA CUOTA" || h === "FECHA PAGO") nuevaFila[idx] = primeraCuota;
      else if (h === "VENDEDOR" || h.includes("ASESOR") || h === "NOMBRE VENDEDOR") nuevaFila[idx] = nombreVendedor;
      else if (h === "ASIGNADO" || h === "RESPONSABLE" || h === "ASIGNADO ") nuevaFila[idx] = infoVendedor.asignado;
      else if (h === "TIENDA" || h === "SUCURSAL") nuevaFila[idx] = nombreTienda;
      else if (h === "CONVENIO") nuevaFila[idx] = convenioEncontrado;
      else if (h === "CELULAR" || h === "TELEFONO" || h === "CEL CLIENTE") nuevaFila[idx] = getV(["CELULAR", "TELEFONO", "MOVIL"]);
      else if (h === "EQUIPO" || h === "REFERENCIA" || h === "DESCRIPCION") {
          let ref = getV(["DESCRIPCION", "DESCRIPCIÓN", "EQUIPO", "REFERENCIA", "MODELO"]);
          let marca = getV(["MARCA"]);
          nuevaFila[idx] = (marca && ref && !String(ref).toUpperCase().includes(String(marca).toUpperCase())) ? marca + " " + ref : ref;
      }
      else if (h === "IMEI 1" || h === "IMEI" || h.includes("IMEI")) nuevaFila[idx] = getV(["IMEI", "IMEI 1", "IMEI 2"]);
      else if (h === "ID APLICACION" || h === "ID APLICACION " || h === "CONTRATO" || h === "CREDITO" || h.includes("# CREDITO")) nuevaFila[idx] = getV(["# CREDITO", "CONTRATO", "ID APLICACION", "ID APLICACION "]);
      else if (h === "CORREO" || h === "EMAIL" || h === "E MAIL") nuevaFila[idx] = getV(["EMAIL", "E MAIL", "CORREO"]);
      else if (h === "TOTAL VENTA" || h === "VALOR VENTA" || h === "PRECIO DE VENTA" || h === "VENTA") nuevaFila[idx] = purchaseAmount;
      else if (h === "CUOTA INICIAL" || h === "VALOR CUOTA INICIAL") nuevaFila[idx] = cuotaInicial;
      else if (h === "% INICIAL" || h === "%" || h === "% CUOTA INICIAL") nuevaFila[idx] = getV(["% CUOTA INICIAL", "% INICIAL", "%"]);
      else if (h === "SALDO A FINANCIAR" || h === "SALDO A FINACIAR" || h === "MONTO TOTAL A FINANCIAR" || h === "MONTO A FINANCIAR" || h.includes("FINANCIAR")) nuevaFila[idx] = getV(["SALDO A FINANCIAR", "SALDO A FINACIAR", "MONTO TOTAL A FINANCIAR", "MONTO A FINANCIAR"]);
      else if (h === "VALOR CUOTA" || h === "MONTO CUOTA") nuevaFila[idx] = getV(["MONTO CUOTA", "VALOR CUOTA"]);
      else if (h === "PLAZO" || h === "# CUOTAS") nuevaFila[idx] = getV(["PLAZO", "# CUOTAS"]);
      else if (h === "PAGOS" || h === "ESTADO") nuevaFila[idx] = "Pendiente";
      else if (h.includes("NACIMIENTO")) nuevaFila[idx] = getV(["NACIMIENTO", "FECHA NACIMENTO", "FECHA DE NACIMIENTO"]);
      else if (h.includes("PIPE Y CHAMORRO") || h.includes("LIQUIDACION PIPE")) nuevaFila[idx] = aConsignarPipeChamorro;
      else if (h.includes("ADMIN 112") || h.includes("UTILIDADES ADMIN")) nuevaFila[idx] = liquidacionAdmin112;
    });

    nuevasFilas.push(nuevaFila);
    cedulasEnCartera.add(cedulaV);
  });

  if (nuevasFilas.length > 0) {
    const startRowInsert = Math.max(ultFilaC + 1, tempHeaderRowC + 1);
    hojaCartera.getRange(startRowInsert, 1, nuevasFilas.length, ultColC).setValues(nuevasFilas);
    return nuevasFilas.length;
  }
  return 0;
}

function menuSincronizarNuevasCarteras() {
  const ui = SpreadsheetApp.getUi();
  let credismartCount = sincronizarVentasACartera("CREDISMART");
  let krediyaCount = sincronizarVentasACartera("KREDIYA");
  let alocreditCount = sincronizarVentasACartera("ALOCREDIT");
  if (credismartCount > 0 || krediyaCount > 0 || alocreditCount > 0) {
      ui.alert(`✅ ¡Migración y Sincronización Completada!\n\nSe copiaron los clientes nuevos de Ventas a Cartera exitosamente:\n\n- ALOCREDIT: ${alocreditCount || 0} nuevos clientes.\n- CREDISMART: ${credismartCount || 0} nuevos clientes.\n- KREDIYA: ${krediyaCount || 0} nuevos clientes.`);
  } else {
      ui.alert(`✅ ¡Todo al día!\n\nNo se encontraron clientes nuevos en las hojas de Ventas que falten en Cartera.`);
  }
}

function sincronizarCarteraKrediya() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaVentas = ss.getSheetByName("VENTAS KREDIYA");
  var hojaCartera = ss.getSheetByName("CARTERA KREDIYA GENERAL");
  var hojaActualizar = ss.getSheetByName("actualizar cartera krediya");
  if (!hojaVentas || !hojaCartera || !hojaActualizar) return;

  var ultimaFilaAct = hojaActualizar.getLastRow();
  if (ultimaFilaAct < 2) return;
  var datosActualizar = hojaActualizar.getRange(2, 1, ultimaFilaAct - 1, 23).getValues();

  var ultimaFilaCartera = hojaCartera.getLastRow();
  var datosCartera = []; var mapCedulasCartera = {};
  if (ultimaFilaCartera >= 4) {
    datosCartera = hojaCartera.getRange(4, 1, ultimaFilaCartera - 3, 23).getValues();
    for (var i = 0; i < datosCartera.length; i++) { var ced = String(datosCartera[i][5]).trim(); if (ced !== "") mapCedulasCartera[ced] = i; }
  }

  var ultimaFilaVentas = hojaVentas.getLastRow();
  var mapCedulasVentas = {};
  if (ultimaFilaVentas >= 2) {
    var datosVentas = hojaVentas.getRange(2, 1, ultimaFilaVentas - 1, 32).getValues();
    for (var j = 0; j < datosVentas.length; j++) { var ced2 = String(datosVentas[j][5]).trim(); if (ced2 !== "") mapCedulasVentas[ced2] = j; }
  }

  var nuevasFilasCartera = []; var nuevasFilasVentas = []; var huboActualizaciones = false;
  for (var k = 0; k < datosActualizar.length; k++) {
    var fila = datosActualizar[k];
    var cedulaActualizar = String(fila[4]).trim();
    if (cedulaActualizar === "") continue;

    var nombreCompleto = (String(fila[5] || "") + " " + String(fila[6] || "")).trim();
    var indexEnCartera = mapCedulasCartera[cedulaActualizar];

    if (indexEnCartera !== undefined) {
        var filaC = datosCartera[indexEnCartera];
        filaC[0] = fila[22];  
        filaC[1] = fila[21];  
        filaC[2] = fila[1];   
        filaC[3] = fila[2];   
        filaC[4] = nombreCompleto; 
        filaC[7] = fila[8];
        filaC[9] = fila[7];   
        filaC[10] = fila[14]; 
        filaC[11] = fila[11]; 
        filaC[12] = fila[15]; 
        filaC[13] = fila[17]; 
        filaC[14] = fila[18];
        filaC[15] = fila[20]; 
        filaC[16] = fila[19]; 
        huboActualizaciones = true;
    } else {
      var primeraCuotaDate = "";
      if (fila[22]) { var pDate = new Date(fila[22]); if (!isNaN(pDate.getTime())) { pDate.setDate(pDate.getDate() + 14); primeraCuotaDate = pDate; } }

      var nFilaCartera = new Array(23).fill("");
      nFilaCartera[0] = fila[22]; nFilaCartera[1] = fila[21]; nFilaCartera[2] = fila[1]; nFilaCartera[3] = fila[2]; nFilaCartera[4] = nombreCompleto; nFilaCartera[5] = cedulaActualizar; nFilaCartera[6] = primeraCuotaDate; nFilaCartera[7] = fila[8]; nFilaCartera[9] = fila[7]; nFilaCartera[10] = fila[14]; nFilaCartera[11] = fila[11]; nFilaCartera[12] = fila[15]; nFilaCartera[13] = fila[17]; nFilaCartera[14] = fila[18]; nFilaCartera[15] = fila[20]; nFilaCartera[16] = fila[19]; nFilaCartera[17] = "Pendiente"; 
      nuevasFilasCartera.push(nFilaCartera);
      if (mapCedulasVentas[cedulaActualizar] === undefined) {
        var precioVenta = parseDineroBackend(fila[15]);
        var cuotaInicial = parseDineroBackend(fila[17]); 
        var montoFinanciar = parseDineroBackend(fila[18]); 
        var costoEquipo = precioVenta * 0.70;
        var comisionRetailB = ""; 
        var utilidadesAdmin = 0;

        if (String(fila[21]).toUpperCase().includes("PROMOTORA") || String(fila[21]).toUpperCase().includes("VITRINA")) { 
            comisionRetailB = 40000;
            utilidadesAdmin = montoFinanciar - (costoEquipo + 40000) - 40000; 
        } else { 
            utilidadesAdmin = montoFinanciar - costoEquipo - 40000;
        }

        var nFilaVentas = new Array(32).fill("");
        nFilaVentas[2] = fila[1]; nFilaVentas[3] = fila[2]; nFilaVentas[5] = cedulaActualizar; nFilaVentas[6] = fila[5]; nFilaVentas[7] = fila[6]; nFilaVentas[8] = fila[7]; nFilaVentas[9] = fila[8]; nFilaVentas[12] = fila[11]; nFilaVentas[13] = fila[12]; nFilaVentas[14] = fila[14]; nFilaVentas[15] = fila[19]; nFilaVentas[16] = fila[20]; nFilaVentas[17] = fila[21]; nFilaVentas[18] = fila[22]; nFilaVentas[20] = precioVenta; nFilaVentas[21] = (precioVenta > 0) ? Math.round((cuotaInicial / precioVenta) * 100) + "%" : "0%"; nFilaVentas[22] = cuotaInicial; nFilaVentas[23] = montoFinanciar; nFilaVentas[24] = costoEquipo; nFilaVentas[25] = 40000; nFilaVentas[26] = comisionRetailB; nFilaVentas[27] = utilidadesAdmin; nFilaVentas[31] = "Activo"; 
        nuevasFilasVentas.push(nFilaVentas);
      }
    }
  }

  if (huboActualizaciones) hojaCartera.getRange(4, 1, datosCartera.length, 23).setValues(datosCartera);
  if (nuevasFilasCartera.length > 0) hojaCartera.getRange(ultimaFilaCartera + 1, 1, nuevasFilasCartera.length, 23).setValues(nuevasFilasCartera);
  if (nuevasFilasVentas.length > 0) hojaVentas.getRange(ultimaFilaVentas + 1, 1, nuevasFilasVentas.length, 32).setValues(nuevasFilasVentas);
  SpreadsheetApp.getUi().alert("Sincronización de Krediya completada con éxito.");
}

function sincronizarOnboardingMasivo(desdeMenu) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaOnb = ss.getSheetByName("ONBOARDING");
  if (!hojaOnb) {
    if (desdeMenu) SpreadsheetApp.getUi().alert("❌ No se encontró la hoja ONBOARDING.");
    return;
  }

  var ultFilaOnb = hojaOnb.getLastRow();
  var ultColOnb = hojaOnb.getLastColumn();
  if (ultFilaOnb < 2) return;

  var headersOnb = hojaOnb.getRange(1, 1, 1, ultColOnb).getValues()[0].map(function(h) { 
      return String(h).toUpperCase().replace(/\s+/g, ''); 
  });
  var datosOnb = hojaOnb.getRange(2, 1, ultFilaOnb - 1, ultColOnb).getValues();

  var findIdx = function(headers, keywords) {
      return headers.findIndex(function(h) { return keywords.some(function(k) { return h.includes(String(k).toUpperCase().replace(/\s+/g, '')); }); });
  };

  var idxCedOnb = findIdx(headersOnb, ["CEDULA", "CC", "DOCUMENTO"]);
  var idxNomOnb = findIdx(headersOnb, ["NOMBRE"]);
  var idxTelOnb = findIdx(headersOnb, ["TELEFONO", "CELULAR"]);
  var idxNacOnb = findIdx(headersOnb, ["NACIMIENTO"]);
  var idxRef1 = findIdx(headersOnb, ["REF1", "REFERENCIA1"]);
  var idxTelRef1 = findIdx(headersOnb, ["TELREF1", "TELREFERENCIA1"]);
  var idxRef2 = findIdx(headersOnb, ["REF2", "REFERENCIA2"]);
  var idxTelRef2 = findIdx(headersOnb, ["TELREF2", "TELREFERENCIA2"]);

  if (idxCedOnb === -1) return;

  var mapaOnboarding = {};
  for (var i = 0; i < datosOnb.length; i++) {
    var cedLimpia = String(datosOnb[i][idxCedOnb]).replace(/\D/g, '');
    if (cedLimpia) {
      mapaOnboarding[cedLimpia] = {
        nombre: idxNomOnb !== -1 ? datosOnb[i][idxNomOnb] : "",
        telefono: idxTelOnb !== -1 ? datosOnb[i][idxTelOnb] : "",
        nacimiento: idxNacOnb !== -1 ? datosOnb[i][idxNacOnb] : "",
        ref1: idxRef1 !== -1 ? datosOnb[i][idxRef1] : "",
        telRef1: idxTelRef1 !== -1 ? datosOnb[i][idxTelRef1] : "",
        ref2: idxRef2 !== -1 ? datosOnb[i][idxRef2] : "",
        telRef2: idxTelRef2 !== -1 ? datosOnb[i][idxTelRef2] : ""
      };
    }
  }

  var isEmpty = function(val) { return !val || String(val).trim() === "" || String(val).trim() === "-"; };
  var totalActualizados = 0;

  var hojaVentasPj = ss.getSheetByName("VENTAS PAYJOY");
  if (hojaVentasPj) {
    var ultFilaV = hojaVentasPj.getLastRow();
    var ultColV = hojaVentasPj.getLastColumn();
    if (ultFilaV > 1) {
      var headersV = hojaVentasPj.getRange(1, 1, 1, ultColV).getValues()[0].map(function(h) { return String(h).toUpperCase().replace(/\s+/g, ''); });
      var idxCedV = findIdx(headersV, ["CEDULA", "CC", "DOCUMENTO"]);
      var idxNomV = findIdx(headersV, ["NOMBREDELCLIENTE", "CLIENTE", "NOMBRECOMPLETO"]);
      var idxTelV = findIdx(headersV, ["CELULAR", "TELEFONO"]);
      var idxNacV = findIdx(headersV, ["FECHANACIMENTO", "FECHADENACIMIENTO", "NACIMIENTO"]);

      if (idxCedV !== -1) {
        var datosV = hojaVentasPj.getRange(2, 1, ultFilaV - 1, ultColV).getValues();
        var cambiosV = false;

        for (var v = 0; v < datosV.length; v++) {
          var cedV = String(datosV[v][idxCedV]).replace(/\D/g, '');
          if (cedV && mapaOnboarding[cedV]) {
            var infoOnb = mapaOnboarding[cedV];
            if (idxNomV !== -1 && isEmpty(datosV[v][idxNomV]) && !isEmpty(infoOnb.nombre)) { datosV[v][idxNomV] = infoOnb.nombre; cambiosV = true; totalActualizados++; }
            if (idxTelV !== -1 && isEmpty(datosV[v][idxTelV]) && !isEmpty(infoOnb.telefono)) { datosV[v][idxTelV] = infoOnb.telefono; cambiosV = true; totalActualizados++; }
            if (idxNacV !== -1 && isEmpty(datosV[v][idxNacV]) && !isEmpty(infoOnb.nacimiento)) { datosV[v][idxNacV] = infoOnb.nacimiento; cambiosV = true; totalActualizados++; }
          }
        }
        if (cambiosV) hojaVentasPj.getRange(2, 1, ultFilaV - 1, ultColV).setValues(datosV);
      }
    }
  }

  var nombresCarteras = [ "CARTERA PAYJOY GENERAL", "CARTERA ALOCREDIT GENERAL", "CARTERA KREDIYA GENERAL", "CARTERA CREDISMART GENERAL" ];

  nombresCarteras.forEach(function(nombreHoja) {
    var hojaC = ss.getSheetByName(nombreHoja);
    if (!hojaC) return;
    
    var ultFilaC = hojaC.getLastRow();
    var ultColC = hojaC.getLastColumn();
    if (ultFilaC < 3 || ultColC === 0) return; 

    var datosTop = hojaC.getRange(1, 1, Math.min(6, ultFilaC), ultColC).getValues();
    var filaHeadReal = -1;
    for (var r = 0; r < datosTop.length; r++) {
        var esCabecera = datosTop[r].some(function(celda) {
            var val = String(celda).toUpperCase().replace(/\s+/g, '');
            return val === "CEDULA" || val === "CC" || val === "DOCUMENTO" || val === "IDENTIFICACION";
        });
        if (esCabecera) { filaHeadReal = r + 1; break; }
    }

    if (filaHeadReal === -1) return; 

    var headersC = hojaC.getRange(filaHeadReal, 1, 1, ultColC).getValues()[0].map(function(h) { return String(h).toUpperCase().replace(/\s+/g, ''); });
    
    var idxCedC = findIdx(headersC, ["CEDULA", "CC", "DOCUMENTO"]);
    var idxRef1C = findIdx(headersC, ["REF1", "REFERENCIA1"]);
    var idxTelRef1C = findIdx(headersC, ["TELREF1", "TELREFERENCIA1"]);
    var idxRef2C = findIdx(headersC, ["REF2", "REFERENCIA2"]);
    var idxTelRef2C = findIdx(headersC, ["TELREF2", "TELREFERENCIA2"]);

    if (idxCedC !== -1 && (idxRef1C !== -1 || idxTelRef1C !== -1 || idxRef2C !== -1 || idxTelRef2C !== -1)) {
      var filaDataReal = filaHeadReal + 1;
      var numFilasDatos = ultFilaC - filaDataReal + 1;
      
      if (numFilasDatos > 0) {
          var datosC = hojaC.getRange(filaDataReal, 1, numFilasDatos, ultColC).getValues();
          var cambiosC = false;

          for (var c = 0; c < datosC.length; c++) {
            var cedC = String(datosC[c][idxCedC]).replace(/\D/g, '');
            if (cedC && mapaOnboarding[cedC]) {
              var infoOnb = mapaOnboarding[cedC];
              if (idxRef1C !== -1 && isEmpty(datosC[c][idxRef1C]) && !isEmpty(infoOnb.ref1)) { datosC[c][idxRef1C] = infoOnb.ref1; cambiosC = true; totalActualizados++; }
              if (idxTelRef1C !== -1 && isEmpty(datosC[c][idxTelRef1C]) && !isEmpty(infoOnb.telRef1)) { datosC[c][idxTelRef1C] = infoOnb.telRef1; cambiosC = true; totalActualizados++; }
              if (idxRef2C !== -1 && isEmpty(datosC[c][idxRef2C]) && !isEmpty(infoOnb.ref2)) { datosC[c][idxRef2C] = infoOnb.ref2; cambiosC = true; totalActualizados++; }
              if (idxTelRef2C !== -1 && isEmpty(datosC[c][idxTelRef2C]) && !isEmpty(infoOnb.telRef2)) { datosC[c][idxTelRef2C] = infoOnb.telRef2; cambiosC = true; totalActualizados++; }
            }
          }
          if (cambiosC) hojaC.getRange(filaDataReal, 1, numFilasDatos, ultColC).setValues(datosC);
      }
    }
  });

  if (desdeMenu) {
    SpreadsheetApp.getUi().alert(`✅ ¡Sincronización de Onboarding Completada!\n\nSe actualizaron y rellenaron ${totalActualizados} campos vacíos en Ventas y Carteras respetando los datos ya existentes.`);
  } else {
    console.log(`✅ Cron Diario: Se rellenaron ${totalActualizados} campos vacíos desde Onboarding.`);
  }
}

function recalcularLiquidacionPayjoy7Dias() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("VENTAS PAYJOY");
  if (!sheet) { ui.alert("❌ No se encontró la hoja VENTAS PAYJOY."); return; }
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) { ui.alert("⚠️ La hoja VENTAS PAYJOY está vacía."); return; }
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var findIdx = function(keywords) { return headers.findIndex(function(h) { return keywords.some(function(k) { return String(h).toUpperCase().includes(k); }); }); };
  
  var colFecha = findIdx(["FECHA"]);
  var colAsignado = findIdx(["ASIGNADO"]);
  var colTienda = findIdx(["TIENDA"]);
  var colReferencia = findIdx(["REFERENCIA EQUIPO", "MODELO", "EQUIPO"]);
  var colVenta = findIdx(["VENTA", "TOTAL VENTA", "VALOR VENTA", "PRECIO DE VENTA"]);
  var colCuotaIni = findIdx(["CUOTA INICIAL"]);
  var colRemanente = findIdx(["REMANENTE DE INICIAL", "REMANENTE"]);
  var colMontoCons = findIdx(["MONTO A CONSIGNAR", "SALDO A FINANCIAR", "VALOR CREDITO"]);
  var colCostoEq = findIdx(["COSTOS EQUIPOS", "COSTO EQUIPO"]);
  var colRetailB = findIdx(["COMISION RETAIL B", "RETAIL B ALIADOS"]); 
  var colCartera = findIdx(["CARTERA"]);
  var colAdmin = findIdx(["UTILIDADES ADMIN 112"]);
  var colPipe = findIdx(["PIPE Y CHAMORRO"]);
  var colRic = findIdx(["RICARDO MARIN"]);
  var colJc = findIdx(["JUAN CAMILO"]);
  var colEjec = findIdx(["EJECUTIVOS"]);
  
  if (colFecha === -1 || colVenta === -1) { ui.alert("❌ Faltan columnas clave (FECHA o VENTA) en VENTAS PAYJOY."); return; }
  
  var mapaPreciosMacro = [];
  try {
    var hojaPrecios = ss.getSheetByName("precios");
    if (hojaPrecios) {
      var ultFilaP = hojaPrecios.getLastRow();
      if (ultFilaP > 1) { mapaPreciosMacro = hojaPrecios.getRange(2, 1, ultFilaP - 1, 5).getValues(); }
    }
  } catch (e) {}
  
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() - 7);
  
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var filasActualizadas = 0;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var fechaVal = row[colFecha];
    var d = null;
    if (fechaVal instanceof Date) d = fechaVal;
    else if (typeof fechaVal === 'number') d = new Date(Math.round((fechaVal - 25569) * 86400 * 1000));
    else if (typeof fechaVal === 'string' && fechaVal.length > 5) d = new Date(fechaVal); 
    
    if (!d || isNaN(d.getTime())) continue;
    if (d.getTime() >= fechaLimite.getTime()) {
      var pAmt = parseDineroBackend(row[colVenta]);
      var cuoIni = colCuotaIni !== -1 ? parseDineroBackend(row[colCuotaIni]) : 0;
      var monCons = colMontoCons !== -1 ? parseDineroBackend(row[colMontoCons]) : 0;
      
      if (monCons > 0) { pAmt = monCons + cuoIni; } 
      else if (pAmt > 0) { monCons = pAmt - cuoIni; }
      
      if (pAmt <= 0) continue; 
      
      var asigEnc = colAsignado !== -1 ? String(row[colAsignado] || "") : "";
      var nTien = colTienda !== -1 ? String(row[colTienda] || "") : "";
      var marcaMod = colReferencia !== -1 ? String(row[colReferencia] || "") : "";
      
      var costEq = "";
      var palMod = marcaMod.toLowerCase().split(" ").filter(function(p) { return p.trim() !== ""; });
      var maxCoin = 0;
      var tenPre = false; 

      for (var pIdx = 0; pIdx < mapaPreciosMacro.length; pIdx++) {
        var rSim = String(mapaPreciosMacro[pIdx][1]).toLowerCase();
        var cSim = String(mapaPreciosMacro[pIdx][2]);
        var preSim = parseDineroBackend(mapaPreciosMacro[pIdx][3]);
        var coin = 0;
        palMod.forEach(function(pal) { if (rSim.includes(pal)) coin++; });
        var esExac = (preSim === pAmt);
        if (coin > maxCoin || (coin === maxCoin && !tenPre && esExac)) { maxCoin = coin; costEq = cSim; tenPre = esExac; }
      }
      
      var remIni = 0;
      var celdaRem = colRemanente !== -1 ? row[colRemanente] : "";
      if (celdaRem !== "" && celdaRem !== null && celdaRem !== undefined) {
          remIni = parseDineroBackend(celdaRem);
      } else {
          remIni = (cuoIni > (pAmt * 0.30)) ? (cuoIni - (pAmt * 0.30)) : 0;
      }
      
      var cEqNum = parseDineroBackend(costEq); 
      var aMin = asigEnc.toLowerCase();
      var tMin = nTien.toLowerCase();
      var isPipe = aMin.includes("pipe") || aMin.includes("chamorro") || aMin.includes("edwin ortiz") || aMin.includes("melissa") || aMin.includes("beltran");
      var isRic = aMin.includes("ricardo");
      var isJC = aMin.includes("camilo");
      var isEj = aMin.includes("ejecutivo") || aMin.includes("vitrina cristhian") || aMin.includes("vitrina criathian");
      var isAl = tMin.includes("aliado") || tMin.includes("vitrina");

      var cFee = 40000;
      var lAdmin = 0;
      var comisionRetailB = ""; 
      var uBase = (monCons + remIni - cEqNum);
      
      if (isPipe) { lAdmin = 70000; } 
      else if (isRic) { lAdmin = (uBase * 0.5) - (cFee / 2); } 
      else if (isJC || isEj || isAl) { comisionRetailB = 40000; lAdmin = monCons + remIni - (cEqNum + 40000) - cFee; } 
      else { lAdmin = uBase - cFee; }

      var aCPipe = isPipe ? (monCons - lAdmin - cFee) : "";
      var aCRic = isRic ? ((uBase * 0.5) - (cFee / 2)) : "";
      var aCJC = isJC ? (cEqNum + 40000) : "";
      var aCEj = isEj ? (cEqNum + 40000) : "";
      
      if (colVenta !== -1) row[colVenta] = pAmt; 
      if (colRemanente !== -1) row[colRemanente] = remIni;
      if (colMontoCons !== -1) row[colMontoCons] = monCons;
      if (colCostoEq !== -1) row[colCostoEq] = cEqNum;
      if (colRetailB !== -1) row[colRetailB] = comisionRetailB;
      if (colCartera !== -1) row[colCartera] = cFee;
      if (colAdmin !== -1) row[colAdmin] = lAdmin;
      if (colPipe !== -1) row[colPipe] = aCPipe;
      if (colRic !== -1) row[colRic] = aCRic;
      if (colJc !== -1) row[colJc] = aCJC;
      if (colEjec !== -1) row[colEjec] = aCEj;
      
      filasActualizadas++;
    }
  }
  
  if (filasActualizadas > 0) {
    sheet.getRange(2, 1, data.length, lastCol).setValues(data);
    ui.alert(`✅ ¡Liquidación Reparada!\n\nSe han recalculado exitosamente las liquidaciones de ${filasActualizadas} créditos recientes.`);
  } else {
    ui.alert(`✅ Revisión Terminada.\n\nNo se encontraron créditos en los últimos 7 días.`);
  }
}

function repararTagsFaltantes() {
  const ui = SpreadsheetApp.getUi();
  const apiKeys = getPayjoyKeys();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaVentas = ss.getSheetByName("VENTAS PAYJOY");
  const hojaCartera = ss.getSheetByName("CARTERA PAYJOY GENERAL");
  if (!hojaVentas || !hojaCartera) { ui.alert("❌ Error: No se encontraron las hojas."); return; }

  const hoy = new Date();
  const haceTiempo = new Date();
  haceTiempo.setDate(hoy.getDate() - 90); 

  const startTs = Math.floor(haceTiempo.getTime() / 1000);
  const endTs = Math.floor(hoy.getTime() / 1000) + 86400;

  let mapaTags = {};
  for (let k = 0; k < apiKeys.length; k++) {
    const url = `https://partner.payjoy.com/v1/list-transactions.php?key=${apiKeys[k]}&starttime=${startTs}&endtime=${endTs}`;
    try {
      const respuesta = UrlFetchApp.fetch(url, { "method": "GET", "muteHttpExceptions": true });
      if (respuesta.getResponseCode() === 200) {
        const json = JSON.parse(respuesta.getContentText());
        if (json.transactions && json.transactions.length > 0) {
          json.transactions.forEach(t => {
            let cedulaLimpia = String(t.customer?.nationalId || "").toLowerCase().replace("ppt", "").replace(/\D/g, '').trim();
            let tag = String(t.device?.deviceTag || "").trim();
            if (cedulaLimpia !== "" && tag !== "") mapaTags[cedulaLimpia] = tag;
          });
        }
      }
    } catch (e) {}
  }

  if (Object.keys(mapaTags).length === 0) { ui.alert("⚠️ No se encontraron TAGs en la API."); return; }

  let tagsRecuperados = 0;
  const ultFilaV = hojaVentas.getLastRow();
  const ultColV = hojaVentas.getLastColumn();
  if (ultFilaV > 1) {
    const headersV = hojaVentas.getRange(1, 1, 1, ultColV).getValues()[0];
    let colCedulaV = headersV.findIndex(h => String(h).toUpperCase().includes("CEDULA") || String(h).toUpperCase() === "CC");
    let colTagV = headersV.findIndex(h => String(h).toUpperCase() === "TAG" || String(h).toUpperCase().includes("CODIGO"));

    if (colCedulaV !== -1 && colTagV !== -1) {
      const dataV = hojaVentas.getRange(2, 1, ultFilaV - 1, ultColV).getValues();
      for (let i = 0; i < dataV.length; i++) {
        let cedulaFila = String(dataV[i][colCedulaV]).toLowerCase().replace("ppt", "").replace(/\D/g, '').trim();
        let tagFila = String(dataV[i][colTagV]).trim();
        if (cedulaFila !== "" && tagFila === "" && mapaTags[cedulaFila]) {
          hojaVentas.getRange(i + 2, colTagV + 1).setValue(mapaTags[cedulaFila]);
          tagsRecuperados++;
        }
      }
    }
  }

  const ultFilaC = hojaCartera.getLastRow();
  const ultColC = hojaCartera.getLastColumn();
  if (ultFilaC > 3) {
    const headersC = hojaCartera.getRange(1, 1, 1, ultColC).getValues()[0];
    let colCedulaC = headersC.findIndex(h => String(h).toUpperCase().trim().includes("CEDULA") || String(h).toUpperCase().trim() === "CC");
    let colTagC = headersC.findIndex(h => String(h).toUpperCase().trim() === "CODIGO_VENTA" || String(h).toUpperCase().trim() === "TAG");

    if (colCedulaC !== -1 && colTagC !== -1) {
      const dataC = hojaCartera.getRange(4, 1, ultFilaC - 3, ultColC).getValues();
      for (let i = 0; i < dataC.length; i++) {
        let cedulaFila = String(dataC[i][colCedulaC]).toLowerCase().replace("ppt", "").replace(/\D/g, '').trim();
        let tagFila = String(dataC[i][colTagC]).trim();
        if (cedulaFila !== "" && tagFila === "" && mapaTags[cedulaFila]) {
          hojaCartera.getRange(i + 4, colTagC + 1).setValue(mapaTags[cedulaFila]);
          tagsRecuperados++;
        }
      }
    }
  }

  if (tagsRecuperados > 0) ui.alert(`✅ Se identificaron e insertaron ${tagsRecuperados} TAG(s) faltantes.`);
  else ui.alert(`✅ Todos los clientes de los últimos 90 días ya tienen su TAG.`);
}

function rellenarDatosFaltantesDesdeVentas() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaVentas = ss.getSheetByName("VENTAS PAYJOY");
  var hojaCartera = ss.getSheetByName("CARTERA PAYJOY GENERAL");
  if (!hojaVentas || !hojaCartera) { ui.alert("❌ Error: No se encontraron las hojas."); return; }

  const findIdx = (headers, keywords) => headers.findIndex(h => keywords.some(k => String(h).toUpperCase().includes(k)));
  const cleanCedula = (val) => val ? String(val).toUpperCase().replace("PPT", "").replace(/\s+/g, "").replace(/\D/g, '').trim() : "";
  const isEmpty = (val) => !val || String(val).trim().toUpperCase() === "" || String(val).trim() === "-";

  const ultFilaV = hojaVentas.getLastRow();
  const ultColV = hojaVentas.getLastColumn();
  if (ultFilaV <= 1) return;

  const headersV = hojaVentas.getRange(1, 1, 1, ultColV).getValues()[0];
  const colCedulaV = findIdx(headersV, ["CEDULA", "CC", "DOCUMENTO"]);
  const colNombreV = findIdx(headersV, ["NOMBRE DEL CLIENTE", "CLIENTE", "NOMBRE COMPLETO"]);
  const colNombresV = headersV.findIndex(h => String(h).toUpperCase().trim() === "NOMBRES" || String(h).toUpperCase().trim() === "NOMBRE");
  const colApellidosV = headersV.findIndex(h => String(h).toUpperCase().trim() === "APELLIDOS" || String(h).toUpperCase().trim() === "APELLIDO");
  const colCelularV = findIdx(headersV, ["CELULAR", "TELEFONO"]);
  const colFechaNacV = findIdx(headersV, ["FECHA NACIMENTO", "FECHA DE NACIMIENTO"]);

  if (colCedulaV === -1) return;
  const dataV = hojaVentas.getRange(2, 1, ultFilaV - 1, ultColV).getValues();
  const mapaClientes = {};

  dataV.forEach(row => {
    let cedula = cleanCedula(row[colCedulaV]);
    if (cedula !== "") {
      let n1 = colNombresV !== -1 ? row[colNombresV] : "";
      let a1 = colApellidosV !== -1 ? row[colApellidosV] : "";
      let nom = colNombreV !== -1 ? row[colNombreV] : "";
      if (!nom) { nom = a1 ? (String(n1).trim() + " " + String(a1).trim()) : String(n1).trim(); }
      mapaClientes[cedula] = {
        nombre: nom,
        celular: colCelularV !== -1 ? row[colCelularV] : "",
        fechaNac: colFechaNacV !== -1 ? row[colFechaNacV] : ""
      };
    }
  });

  const ultFilaC = hojaCartera.getLastRow();
  const ultColC = hojaCartera.getLastColumn();
  if (ultFilaC <= 3) return;

  const headersC = hojaCartera.getRange(1, 1, 1, ultColC).getValues()[0];
  const colCedulaC = findIdx(headersC, ["CEDULA", "CC", "DOCUMENTO"]);
  const colNombreC = findIdx(headersC, ["NOMBRE CLIENTE", "NOMBRE COMPLETO", "CLIENTE", "NOMBRE DEL CLIENTE"]);
  const colCelularC = findIdx(headersC, ["CELULAR", "CEL CLIENTE"]);
  const colFechaNacC = findIdx(headersC, ["FECHA DE NACIMIENTO", "FECHA NACIMIENTO"]);
  if (colCedulaC === -1) return;

  const dataC = hojaCartera.getRange(4, 1, ultFilaC - 3, ultColC).getValues();
  let camposActualizados = 0;
  for (let i = 0; i < dataC.length; i++) {
    let cedula = cleanCedula(dataC[i][colCedulaC]);
    if (cedula !== "" && mapaClientes[cedula]) {
      let datosVentas = mapaClientes[cedula];
      if (colNombreC !== -1 && isEmpty(dataC[i][colNombreC]) && !isEmpty(datosVentas.nombre)) { dataC[i][colNombreC] = datosVentas.nombre; camposActualizados++; }
      if (colCelularC !== -1 && isEmpty(dataC[i][colCelularC]) && !isEmpty(datosVentas.celular)) { dataC[i][colCelularC] = datosVentas.celular; camposActualizados++; }
      if (colFechaNacC !== -1 && isEmpty(dataC[i][colFechaNacC]) && !isEmpty(datosVentas.fechaNac)) { dataC[i][colFechaNacC] = datosVentas.fechaNac; camposActualizados++; }
    }
  }

  if (camposActualizados > 0) {
    hojaCartera.getRange(4, 1, ultFilaC - 3, ultColC).setValues(dataC);
    ui.alert(`✅ ¡Sincronización Exitosa!\n\nSe han rellenado ${camposActualizados} campos vacíos usando los datos de Ventas.`);
  } else {
    ui.alert(`✅ Revisión Completada.\n\nNo se encontraron campos vacíos en Cartera.`);
  }
}

function FORZAR_LLENADO_REFERENCIAS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaOnb = ss.getSheetByName("ONBOARDING");
  if (!hojaOnb) return;

  var ultFilaOnb = hojaOnb.getLastRow();
  var ultColOnb = hojaOnb.getLastColumn();
  if (ultFilaOnb < 2) return;

  var dataOnb = hojaOnb.getRange(1, 1, ultFilaOnb, ultColOnb).getValues();
  var headersOnb = dataOnb[0].map(function(h) { return String(h).toUpperCase().replace(/\s+/g, ''); });
  
  var findIdx = function(headers, keywords) {
      return headers.findIndex(function(h) { return keywords.some(function(k) { return h.includes(String(k).toUpperCase().replace(/\s+/g, '')); }); });
  };

  var idxCedOnb = findIdx(headersOnb, ["CEDULA", "CC", "DOCUMENTO", "IDENTIFICACION"]);
  var idxR1 = findIdx(headersOnb, ["REFERENCIA1", "REF1"]);
  var idxT1 = findIdx(headersOnb, ["TELREFERENCIA1", "TELREF1", "TLFREF1", "TELEFONOREF1", "CELULARREF1", "CELREF1"]);
  var idxR2 = findIdx(headersOnb, ["REFERENCIA2", "REF2"]);
  var idxT2 = findIdx(headersOnb, ["TELREFERENCIA2", "TELREF2", "TLFREF2", "TELEFONOREF2", "CELULARREF2", "CELREF2"]);

  if (idxCedOnb === -1) return;

  var mapaRef = {};
  for (var i = 1; i < dataOnb.length; i++) {
    var ced = String(dataOnb[i][idxCedOnb]).replace(/\D/g, '');
    if (ced) {
      mapaRef[ced] = {
        r1: idxR1 !== -1 ? dataOnb[i][idxR1] : "", t1: idxT1 !== -1 ? dataOnb[i][idxT1] : "",
        r2: idxR2 !== -1 ? dataOnb[i][idxR2] : "", t2: idxT2 !== -1 ? dataOnb[i][idxT2] : ""
      };
    }
  }

  var hojasDestino = [ "VENTAS PAYJOY", "CARTERA PAYJOY GENERAL", "CARTERA ALOCREDIT GENERAL", "CARTERA KREDIYA GENERAL", "CARTERA CREDISMART GENERAL" ];
  var totalActualizados = 0;

  hojasDestino.forEach(function(nombre) {
    var hoja = ss.getSheetByName(nombre);
    if (!hoja) return;
    var ultFila = hoja.getLastRow();
    var ultCol = hoja.getLastColumn();
    if (ultFila < 2 || ultCol === 0) return;

    var datosTop = hoja.getRange(1, 1, Math.min(6, ultFila), ultCol).getValues();
    var filaHeadReal = -1;
    for (var r = 0; r < datosTop.length; r++) {
        var esCabecera = datosTop[r].some(function(celda) {
            var val = String(celda).toUpperCase().replace(/\s+/g, '');
            return val === "CEDULA" || val === "CC" || val === "DOCUMENTO" || val === "IDENTIFICACION";
        });
        if (esCabecera) { filaHeadReal = r + 1; break; }
    }
    if (filaHeadReal === -1) return;

    var headers = hoja.getRange(filaHeadReal, 1, 1, ultCol).getValues()[0].map(function(h) { return String(h).toUpperCase().replace(/\s+/g, ''); });
    var cCed = findIdx(headers, ["CEDULA", "CC", "DOCUMENTO", "IDENTIFICACION"]);
    var cR1 = findIdx(headers, ["REFERENCIA1", "REF1"]);
    var cT1 = findIdx(headers, ["TELREFERENCIA1", "TELREF1", "TLFREF1", "TELEFONOREF1", "CELULARREF1", "CELREF1"]);
    var cR2 = findIdx(headers, ["REFERENCIA2", "REF2"]);
    var cT2 = findIdx(headers, ["TELREFERENCIA2", "TELREF2", "TLFREF2", "TELEFONOREF2", "CELULARREF2", "CELREF2"]);

    if (cCed !== -1 && (cR1 !== -1 || cT1 !== -1 || cR2 !== -1 || cT2 !== -1)) {
       var filaDataReal = filaHeadReal + 1;
       var numFilas = ultFila - filaDataReal + 1;
       if (numFilas <= 0) return;

       var data = hoja.getRange(filaDataReal, 1, numFilas, ultCol).getValues();
       var huboCambios = false;

       for (var j = 0; j < data.length; j++) {
          var cedRow = String(data[j][cCed]).replace(/\D/g, '');
          if (cedRow && mapaRef[cedRow]) {
             var refData = mapaRef[cedRow];
             var isEmpty = function(v) { return !v || String(v).trim() === "" || String(v).trim() === "-"; };

             if (cR1 !== -1 && isEmpty(data[j][cR1]) && !isEmpty(refData.r1)) { data[j][cR1] = refData.r1; huboCambios = true; totalActualizados++; }
             if (cT1 !== -1 && isEmpty(data[j][cT1]) && !isEmpty(refData.t1)) { data[j][cT1] = refData.t1; huboCambios = true; totalActualizados++; }
             if (cR2 !== -1 && isEmpty(data[j][cR2]) && !isEmpty(refData.r2)) { data[j][cR2] = refData.r2; huboCambios = true; totalActualizados++; }
             if (cT2 !== -1 && isEmpty(data[j][cT2]) && !isEmpty(refData.t2)) { data[j][cT2] = refData.t2; huboCambios = true; totalActualizados++; }
          }
       }
       if (huboCambios) { hoja.getRange(filaDataReal, 1, numFilas, ultCol).setValues(data); }
    }
  });

  if (SpreadsheetApp.getUi()) {
    SpreadsheetApp.getUi().alert("✅ Misión Cumplida.\n\nSe escanearon todas las hojas y se rellenaron " + totalActualizados + " datos de referencias que estaban vacíos desde Onboarding.");
  }
}

function autoActualizarCarteraPayJoy() {
  
  var parseDateSeguro = function(fecha) {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;
    var fechaStr = String(fecha).trim();
    if (fechaStr === "") return null;
    if (fechaStr.includes("/")) {
      var partes = fechaStr.split("/");
      if (partes.length === 3) return new Date(partes[2], parseInt(partes[1]) - 1, partes[0]);
    }
    var d = new Date(fechaStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  var apiKeys = getPayjoyKeys();
  var hojaNombre = "CARTERA PAYJOY GENERAL"; 
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(hojaNombre);
  if (!hoja) return;

  var ultFila = hoja.getLastRow();
  var ultCol = hoja.getLastColumn();
  if (ultFila < 2) return; 

  var datosIniciales = hoja.getRange(1, 1, Math.min(5, ultFila), ultCol).getValues();
  var filaEncabezados = 0;
  for (var i = 0; i < datosIniciales.length; i++) {
    var esCabecera = datosIniciales[i].some(function(celda) {
        var val = String(celda).toUpperCase().replace(/\s+/g, '');
        return val === "CEDULA" || val === "CC" || val === "DOCUMENTO" || val === "TAG" || val === "CODIGO";
    });
    if (esCabecera) { filaEncabezados = i; break; }
  }

  var cabeceras = hoja.getRange(filaEncabezados + 1, 1, 1, ultCol).getValues()[0];
  var colTag = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "TAG" || h === "CODIGO_VENTA" || h === "CÓDIGO_VENTA" || h === "CODIGO DEL DISPOSITIVO"; });
  var colCuotasPagas = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "CUOTAS PAGAS" || h === "CUOTAS PAGADAS" || h === "PAGADAS"; });
  var colCuotasAtrasadas = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "CUOTAS ATRASADAS" || h === "ATRASADAS" || h === "CUOTAS_ATRASADAS"; });
  var colFechaVenta = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "FECHA" || h === "FECHA VENTA" || h === "FECHA DE VENTA"; });
  var colPrimeraCuota = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "PRIMERA CUOTA" || h === "1ERA CUOTA" || h === "FECHA PAGO" || h === "FECHA DE PAGO"; });
  var colPlazo = cabeceras.findIndex(function(c) { var h = String(c).toUpperCase().trim(); return h === "PLAZO" || h === "# CUOTAS" || h === "SEMANAS"; });

  if (colTag === -1 || colCuotasPagas === -1 || colCuotasAtrasadas === -1 || colFechaVenta === -1) return;
  
  var filaInicioDatos = filaEncabezados + 2; 
  var cantidadFilas = ultFila - filaInicioDatos + 1;
  if (cantidadFilas <= 0) return;
  
  var datosCartera = hoja.getRange(filaInicioDatos, 1, cantidadFilas, ultCol).getValues();
  var startTime = new Date().getTime();
  var props = PropertiesService.getScriptProperties();
  var filaMemoria = parseInt(props.getProperty('fila_payjoy_api')) || 0;
  if (filaMemoria >= datosCartera.length) filaMemoria = 0; 
  
  var hoy = new Date();
  hoy.setHours(0,0,0,0);
  var matrizCuotasPagas = [];
  var matrizCuotasAtrasadas = [];
  var loteInicio = filaMemoria;

  for (var f = filaMemoria; f < datosCartera.length; f++) {
    if (new Date().getTime() - startTime > 270000) {
        props.setProperty('fila_payjoy_api', f.toString());
        break; 
    }

    var tagCliente = String(datosCartera[f][colTag]).trim();
    var plazoMaximo = colPlazo !== -1 ? parseInt(datosCartera[f][colPlazo]) || 0 : 0;
    var cuotasPagasEnExcel = parseInt(datosCartera[f][colCuotasPagas]) || 0;
    var cuotasPagasCalculadas = cuotasPagasEnExcel; 
    var cuotasAtrasadasCalculadas = datosCartera[f][colCuotasAtrasadas];
    
    if (tagCliente !== "" && tagCliente.length > 4) {
      var clienteEncontrado = false; 
      for (var k = 0; k < apiKeys.length; k++) {
        if (clienteEncontrado) break; 
        var url = "https://partner.payjoy.com/v1/lookup-customer.php?key=" + apiKeys[k] + "&customerLocator=" + tagCliente + "&fields=device,financeOrder,customer";
        try {
          var respuesta = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
          if (respuesta.getResponseCode() === 200) {
             var json = JSON.parse(respuesta.getContentText());
             if (json.valid && (json.paymentHistory || json.financeOrder)) {
                clienteEncontrado = true; 
                var cuotasEstimadas = 0; var cuotaSemanal = 0; var totalPagado = 0; var conteoBloques = 0;
                
                if (json.paymentOptions) { for (var o = 0; o < json.paymentOptions.length; o++) { if (json.paymentOptions[o].type === "week") { cuotaSemanal = parseFloat(json.paymentOptions[o].amount) || 0; break; } } }
                if (json.paymentHistory) { conteoBloques = json.paymentHistory.length; for (var p = 0; p < json.paymentHistory.length; p++) { var monto = json.paymentHistory[p].amount; if (monto !== "" && monto !== null && !isNaN(monto)) totalPagado += parseFloat(monto); } }
                if (cuotaSemanal > 0 && totalPagado > 0) cuotasEstimadas = Math.floor(totalPagado / cuotaSemanal);
                else if (conteoBloques === 1 && (!json.paymentHistory[0].amount || json.paymentHistory[0].amount === "")) cuotasEstimadas = 0;
                else cuotasEstimadas = conteoBloques;
                if (cuotasEstimadas > cuotasPagasEnExcel) cuotasPagasCalculadas = cuotasEstimadas;
                
                var fechaBase = null; var esPrimeraCuota = false;
                if (colPrimeraCuota !== -1 && datosCartera[f][colPrimeraCuota]) { fechaBase = parseDateSeguro(datosCartera[f][colPrimeraCuota]); esPrimeraCuota = true; }
                if (!fechaBase && colFechaVenta !== -1) { fechaBase = parseDateSeguro(datosCartera[f][colFechaVenta]); esPrimeraCuota = false; }
                
                if (fechaBase && !isNaN(fechaBase.getTime())) {
                    fechaBase.setHours(0,0,0,0);
                    var diasTranscurridos = Math.floor((hoy.getTime() - fechaBase.getTime()) / (1000 * 60 * 60 * 24));
                    var cuotasDeberiaLlevar = 0;
                    if (esPrimeraCuota) { if (diasTranscurridos >= 0) cuotasDeberiaLlevar = Math.floor(diasTranscurridos / 14) + 1; } 
                    else { if (diasTranscurridos >= 14) cuotasDeberiaLlevar = Math.floor(diasTranscurridos / 14); }
                    
                    var limiteCuotas = plazoMaximo > 0 ? plazoMaximo : 16;
                    if (cuotasDeberiaLlevar > limiteCuotas) cuotasDeberiaLlevar = limiteCuotas;
                    cuotasAtrasadasCalculadas = Math.max(0, cuotasDeberiaLlevar - cuotasPagasCalculadas);
                }
             }
          }
        } catch(e) { }
        Utilities.sleep(150); 
      }
    }
    
    matrizCuotasPagas.push([cuotasPagasCalculadas]);
    matrizCuotasAtrasadas.push([cuotasAtrasadasCalculadas]);

    if (matrizCuotasPagas.length >= 25) {
        hoja.getRange(filaInicioDatos + loteInicio, colCuotasPagas + 1, matrizCuotasPagas.length, 1).setValues(matrizCuotasPagas);
        hoja.getRange(filaInicioDatos + loteInicio, colCuotasAtrasadas + 1, matrizCuotasAtrasadas.length, 1).setValues(matrizCuotasAtrasadas);
        loteInicio = f + 1;
        matrizCuotasPagas = []; matrizCuotasAtrasadas = [];
    }
  }
  
  if (matrizCuotasPagas.length > 0) {
    hoja.getRange(filaInicioDatos + loteInicio, colCuotasPagas + 1, matrizCuotasPagas.length, 1).setValues(matrizCuotasPagas);
    hoja.getRange(filaInicioDatos + loteInicio, colCuotasAtrasadas + 1, matrizCuotasAtrasadas.length, 1).setValues(matrizCuotasAtrasadas);
  }
  
  if (f >= datosCartera.length) props.deleteProperty('fila_payjoy_api'); 
}

// ============================================================================
// MÓDULO DE AGENDA Y VISITAS (PREFIX: trop_)
// ============================================================================

function verificarCrearHojasTrop() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const configTrop = [
    {
      name: "trop_tareas",
      headers: [
        "ID_TAREA", "COMERCIAL_ID", "COMERCIAL_NOMBRE", "ID_CLIENTE", "CLIENTE_NOMBRE", 
        "DIRECCION", "FECHA_PROGRAMADA", "HORA_PROGRAMADA", "PRIORIDAD", "ESTADO", 
        "DESCRIPCION", "CHECKLIST_JSON", "FECHA_CREACION"
      ]
    },
    {
      name: "trop_visitas",
      headers: [
        "ID_VISITA", "ID_TAREA", "COMERCIAL_ID", "COMERCIAL_NOMBRE", "ID_CLIENTE", "CLIENTE_NOMBRE", 
        "CHECKIN_FECHA", "CHECKIN_LAT", "CHECKIN_LON", "CHECKIN_ACCURACY", 
        "CHECKOUT_FECHA", "CHECKOUT_LAT", "CHECKOUT_LON", "CHECKOUT_ACCURACY", 
        "DURACION_MINUTOS", "RETRASO_MINUTOS", "ESTADO_VISITA", "OBSERVACIONES"
      ]
    },
    {
      name: "trop_fotos_gps",
      headers: [
        "ID_EVIDENCIA", "ID_VISITA", "ID_TAREA", "COMERCIAL_ID", "COMERCIAL_NOMBRE", "ID_CLIENTE", "CLIENTE_NOMBRE", 
        "FECHA_CAPTURA", "LATITUD", "LONGITUD", "PRECISION_GPS", "TIPO_EVIDENCIA", 
        "IMAGEN_URL_O_BASE64", "NOTAS"
      ]
    }
  ];

  configTrop.forEach(req => {
    let sheet = ss.getSheetByName(req.name);
    if (!sheet) {
      sheet = ss.insertSheet(req.name);
      sheet.appendRow(req.headers);
      sheet.getRange(1, 1, 1, req.headers.length).setFontWeight("bold").setBackground("#2C4C8C").setFontColor("#FFFFFF");
    }
  });
}

function guardarTareaTrop(d) {
  verificarCrearHojasTrop();
  verificarCrearHojasParametrizacion();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("trop_tareas");
  
  const idTarea = d.id_tarea || ("TASK-" + Date.now().toString().slice(-6));
  const now = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
  
  const values = sheet.getDataRange().getValues();
  if (values.length > 1) {
    const headers = values[0];
    const colId = headers.findIndex(h => String(h).toUpperCase() === "ID_TAREA");
    if (colId !== -1) {
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][colId]).trim() === String(idTarea).trim()) {
          if (d.estado) sheet.getRange(i + 1, headers.indexOf("ESTADO") + 1).setValue(d.estado);
          if (d.checklist_json !== undefined) sheet.getRange(i + 1, headers.indexOf("CHECKLIST_JSON") + 1).setValue(typeof d.checklist_json === 'string' ? d.checklist_json : JSON.stringify(d.checklist_json));
          if (d.prioridad) sheet.getRange(i + 1, headers.indexOf("PRIORIDAD") + 1).setValue(d.prioridad);
          if (d.descripcion) sheet.getRange(i + 1, headers.indexOf("DESCRIPCION") + 1).setValue(d.descripcion);
          return { status: "success", message: "Tarea actualizada correctamente.", id_tarea: idTarea };
        }
      }
    }
  }

  const checklistStr = typeof d.checklist_json === 'string' ? d.checklist_json : JSON.stringify(d.checklist_json || []);
  sheet.appendRow([
    idTarea,
    d.comercial_id || "",
    d.comercial_nombre || "",
    d.id_cliente || "",
    d.cliente_nombre || "",
    d.direccion || "",
    d.fecha_programada || "",
    d.hora_programada || "",
    d.prioridad || "Media",
    d.estado || "Pendiente",
    d.descripcion || "",
    checklistStr,
    now
  ]);

  return { status: "success", message: "Tarea registrada exitosamente.", id_tarea: idTarea };
}

function registrarCheckInTrop(d) {
  verificarCrearHojasTrop();
  verificarCrearHojasParametrizacion();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetVisitas = ss.getSheetByName("trop_visitas");
  
  const idVisita = "VIS-" + Date.now().toString().slice(-6);
  const now = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

  let retrasoMinutos = 0;
  if (d.fecha_programada && d.hora_programada) {
    try {
      const progStr = d.fecha_programada + " " + d.hora_programada;
      const progDate = new Date(progStr);
      const nowDate = new Date();
      if (!isNaN(progDate.getTime())) {
        const diffMs = nowDate.getTime() - progDate.getTime();
        retrasoMinutos = Math.max(0, Math.round(diffMs / (1000 * 60)));
      }
    } catch (e) {}
  }

  sheetVisitas.appendRow([
    idVisita,
    d.id_tarea || "",
    d.comercial_id || "",
    d.comercial_nombre || "",
    d.id_cliente || "",
    d.cliente_nombre || "",
    now,
    d.latitud || "",
    d.longitud || "",
    d.accuracy || "",
    "",
    "",
    "",
    "",
    0,
    retrasoMinutos,
    "En Proceso",
    d.observaciones || "Check-in realizado"
  ]);

  if (d.id_tarea) {
    guardarTareaTrop({ id_tarea: d.id_tarea, estado: "En Proceso" });
  }

  return { status: "success", message: "Check-in registrado.", id_visita: idVisita, retraso_minutos: retrasoMinutos };
}

function registrarCheckOutTrop(d) {
  verificarCrearHojasTrop();
  verificarCrearHojasParametrizacion();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetVisitas = ss.getSheetByName("trop_visitas");
  const nowStr = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

  const values = sheetVisitas.getDataRange().getValues();
  if (values.length <= 1) throw new Error("No existen registros de visitas.");

  const headers = values[0];
  const colIdVisita = headers.indexOf("ID_VISITA");
  const colIdTarea = headers.indexOf("ID_TAREA");
  const colCheckInFecha = headers.indexOf("CHECKIN_FECHA");

  let rowIndex = -1;
  let visitRow = null;

  for (let i = values.length - 1; i >= 1; i--) {
    if (d.id_visita && String(values[i][colIdVisita]).trim() === String(d.id_visita).trim()) {
      rowIndex = i + 1;
      visitRow = values[i];
      break;
    }
    if (d.id_tarea && String(values[i][colIdTarea]).trim() === String(d.id_tarea).trim() && String(values[i][headers.indexOf("ESTADO_VISITA")]).trim() === "En Proceso") {
      rowIndex = i + 1;
      visitRow = values[i];
      break;
    }
  }

  if (rowIndex === -1) throw new Error("No se encontró una visita activa para cerrar.");

  let duracionMinutos = 0;
  if (visitRow && visitRow[colCheckInFecha]) {
    try {
      const checkInStr = String(visitRow[colCheckInFecha]);
      const parts = checkInStr.split(" ");
      if (parts.length === 2) {
        const dParts = parts[0].split("/");
        const tParts = parts[1].split(":");
        const checkInDate = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2] || 0);
        const checkOutDate = new Date();
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        duracionMinutos = Math.max(1, Math.round(diffMs / (1000 * 60)));
      }
    } catch (e) {}
  }

  if (headers.indexOf("CHECKOUT_FECHA") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("CHECKOUT_FECHA") + 1).setValue(nowStr);
  if (headers.indexOf("CHECKOUT_LAT") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("CHECKOUT_LAT") + 1).setValue(d.latitud || "");
  if (headers.indexOf("CHECKOUT_LON") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("CHECKOUT_LON") + 1).setValue(d.longitud || "");
  if (headers.indexOf("CHECKOUT_ACCURACY") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("CHECKOUT_ACCURACY") + 1).setValue(d.accuracy || "");
  if (headers.indexOf("DURACION_MINUTOS") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("DURACION_MINUTOS") + 1).setValue(duracionMinutos);
  if (headers.indexOf("ESTADO_VISITA") !== -1) sheetVisitas.getRange(rowIndex, headers.indexOf("ESTADO_VISITA") + 1).setValue("Completada");
  if (d.observaciones && headers.indexOf("OBSERVACIONES") !== -1) {
    sheetVisitas.getRange(rowIndex, headers.indexOf("OBSERVACIONES") + 1).setValue(d.observaciones);
  }

  const taskToClose = d.id_tarea || (visitRow ? visitRow[colIdTarea] : null);
  if (taskToClose) {
    guardarTareaTrop({ id_tarea: taskToClose, estado: "Completada" });
  }

  return { status: "success", message: "Check-out registrado exitosamente.", duracion_minutos: duracionMinutos };
}

function guardarEvidenciaTrop(d) {
  verificarCrearHojasTrop();
  verificarCrearHojasParametrizacion();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetEvidencias = ss.getSheetByName("trop_fotos_gps");

  const idEvidencia = "EVID-" + Date.now().toString().slice(-6);
  const now = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

  if (!d.latitud || !d.longitud) {
    throw new Error("Coordenadas GPS no detectadas. Activa el GPS para subir evidencia.");
  }

  sheetEvidencias.appendRow([
    idEvidencia,
    d.id_visita || "",
    d.id_tarea || "",
    d.comercial_id || "",
    d.comercial_nombre || "",
    d.id_cliente || "",
    d.cliente_nombre || "",
    now,
    d.latitud,
    d.longitud,
    d.accuracy || "",
    d.tipo_evidencia || "Fotografía de Visita",
    d.imagen_base64_o_url || "",
    d.notas || ""
  ]);

  return { status: "success", message: "Evidencia con coordenadas GPS guardada correctamente.", id_evidencia: idEvidencia };
}
// ============================================================================
// X. PARAMETRIZACIONES Y DIRECTORIO DE ALIADOS
// ============================================================================

function verificarCrearHojasParametrizacion() {
  let sheetCol = SS.getSheetByName("Config_Columnas");
  if (!sheetCol) {
    sheetCol = SS.insertSheet("Config_Columnas");
    sheetCol.appendRow(["marca", "campo", "valores"]);
    
    // Default values based on current hardcoded fallback logic
    sheetCol.appendRow(["todas", "venta_bruta", "precio venta bruta, total venta, precio de venta, valor venta, monto total, costo equipo, costo, venta"]);
    sheetCol.appendRow(["alocredit", "venta_bruta", "valor credito, precio venta bruta, precio bruta, bruta"]);
    sheetCol.appendRow(["krediya", "venta_bruta", "valor credito, precio venta bruta, precio bruta, bruta"]);
    
    sheetCol.appendRow(["todas", "cuota_inicial", "valor cuota inicial, cuota inicial, inicial"]);
  }

  let sheetAliados = SS.getSheetByName("Config_Aliados");
  if (!sheetAliados) {
    sheetAliados = SS.insertSheet("Config_Aliados");
    sheetAliados.appendRow(["aliado", "marca", "tipo", "adminPct", "gestorPct", "comisionFija", "utilidadFijaAdmin", "peaje", "aplica4x1000", "aliadoPoneInventario", "incluirRemanente"]);
    
    // Default fallback rule
    sheetAliados.appendRow(["DEFAULT", "DEFAULT", "estandar", 0.40, 0.60, 40000, 70000, 40000, true, false, true]);
  }
}

function saveConfigList(sheetName, payloadList, headers) {
  try {
    const sheet = SS.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: `No se encontró la hoja ${sheetName}` };
    
    // Clear existing data (except header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Insert new data
    if (payloadList && payloadList.length > 0) {
      const rows = payloadList.map(item => {
        return headers.map(h => {
          let val = item[h];
          if (val === undefined || val === null) val = '';
          return val;
        });
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    return { success: true, message: `Configuración guardada en ${sheetName}` };
  } catch(e) {
    return { success: false, message: e.message };
  }
}
