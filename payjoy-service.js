import https from 'https';

export const PAYJOY_API_KEYS = [
  "CnjxDY6WDfVEUvVcLAOHp6RUMveBW0UW",
  "CwzaIQGsNdPUhyi0hJheA8Cr04LYfWp-"
];

export function lookupPayjoyCustomer(tag) {
  const cleanTag = String(tag || "").trim().toUpperCase();
  if (!cleanTag) {
    return Promise.resolve({ success: false, error: "TAG no proporcionado." });
  }

  return new Promise((resolve) => {
    let index = 0;

    function tryNextKey() {
      if (index >= PAYJOY_API_KEYS.length) {
        return resolve({ success: false, error: "Dispositivo no encontrado en PayJoy con este TAG." });
      }

      const key = PAYJOY_API_KEYS[index++];
      const url = `https://partner.payjoy.com/v1/lookup-customer.php?key=${key}&customerLocator=${encodeURIComponent(cleanTag)}&fields=device,financeOrder,customer`;

      const req = https.get(url, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          try {
            const response = JSON.parse(body);
            if (response && response.valid && (response.financeOrder || response.device || response.paymentHistory)) {
              // 1. Conteo directo por historial (Patrón oficial)
              const hist = Array.isArray(response.paymentHistory) ? response.paymentHistory : null;
              let cuotasPagas = hist === null ? 0 : hist.length;

              // 2. Extracción de valores financieros
              const order = response.financeOrder || {};
              const device = response.device || {};
              const customer = response.customer || {};
              const options = response.paymentOptions || [];

              let cuotaSemanal = 0;
              for (const opt of options) {
                if (opt.type === "week") cuotaSemanal = parseFloat(opt.amount) || 0;
              }
              const cuotaCatorcenal = cuotaSemanal > 0 ? (cuotaSemanal * 2) : 0;
              const saldoOriginal = parseFloat(order.remainingBalance) || 0;

              // 3. Regla catorcenal por tiempo de desbloqueo (validThrough vs time de venta):
              // - La cuota inicial desbloquea el equipo por 14 días (hasta cuota #1).
              // - Cada cuota catorcenal pagada suma +14 días adicionales a validThrough.
              const validThrough = parseInt(device.validThrough) || 0;
              const orderTime = parseInt(order.time) || 0;

              if (validThrough > 0 && orderTime > 0) {
                const diasDesbloqueoTotal = Math.round((validThrough - orderTime) / 86400);
                if (diasDesbloqueoTotal >= 28) {
                  const pagasCatorcenales = Math.floor(diasDesbloqueoTotal / 14) - 1;
                  if (pagasCatorcenales > cuotasPagas) {
                    cuotasPagas = pagasCatorcenales;
                  }
                }
              }

              // 4. Cálculo de fecha próxima de pago y estado de mora
              const nowSec = Math.floor(Date.now() / 1000);
              let fechaProximoPago = null;
              let diasParaVencer = null;
              let cuotasMora = 0;

              if (validThrough > 0) {
                const fechaObj = new Date(validThrough * 1000);
                fechaProximoPago = fechaObj.toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                });

                diasParaVencer = Math.round((validThrough - nowSec) / 86400);

                if (diasParaVencer < 0) {
                  // Vencido
                  const diasAtraso = Math.abs(diasParaVencer);
                  cuotasMora = Math.floor(diasAtraso / 14) + 1;
                } else {
                  // Al día
                  cuotasMora = 0;
                }
              }

              // 5. Saldo real descontando cuotas reconocidas
              const saldoCalculado = (cuotasPagas > 0 && cuotaCatorcenal > 0)
                ? Math.max(0, saldoOriginal - (cuotasPagas * cuotaCatorcenal))
                : saldoOriginal;

              return resolve({
                success: true,
                tag: cleanTag,
                cliente: customer.name || customer.fullName || "",
                pagas: cuotasPagas,
                mora: cuotasMora,
                fechaProximoPago: fechaProximoPago,
                diasParaVencer: diasParaVencer, // >= 0: al día (faltan N días) | < 0: vencido
                cuotaCatorcenal: cuotaCatorcenal,
                cuotaSemanal: cuotaSemanal,
                deuda: saldoCalculado,
                saldoOriginal: saldoOriginal,
                validThrough: validThrough,
                orderTime: orderTime,
                device: device.model ? (device.model.name || device.model.makeModel || "") : (device.family ? device.family.name : ""),
                imei: device.imei || "",
                paymentLink: `https://pay.payjoy.com/p/device/${cleanTag}`
              });
            } else {
              tryNextKey();
            }
          } catch (e) {
            tryNextKey();
          }
        });
      });

      req.on("error", () => tryNextKey());
      req.setTimeout(8000, () => {
        req.destroy();
        tryNextKey();
      });
    }

    tryNextKey();
  });
}
