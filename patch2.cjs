const fs = require('fs');
let content = fs.readFileSync('src/main.jsx', 'utf8');

content = content.replace(
    /if \(\(portfolio === 'credismart' \|\| portfolio === 'alocredit'\) && \['fpd3', 'fpd7', 'fpd15'\]\.includes\(activeFilter\)\) \{([\s\S]*?)if \(dueDate\) \{/g,
    `if (['credismart', 'alocredit', 'krediya'].includes(portfolio) && ['fpd3', 'fpd7', 'fpd15'].includes(activeFilter)) {
                                // First, exclude those with cuotas pagas > 0 for all portfolios in FPD
                                const paidCol = findConfigColumn(activeConfig?.columns?.paidQuotas || ['cuotas pagas', 'cuotas pagadas', 'pagadas', 'pagos'], headers);
                                if (paidCol && row[paidCol]) {
                                    const pagadas = parseInt(String(row[paidCol]).replace(/\\D/g, '')) || 0;
                                    if (pagadas > 0) return false;
                                }$1if (dueDate) {`
);

content = content.replace(
    /if \(\(portfolio === 'credismart' \|\| portfolio === 'alocredit'\) && \['fpd3', 'fpd7', 'fpd15'\]\.includes\(quotaKey\)\) \{([\s\S]*?)let dueDate = null;/g,
    `if (['credismart', 'alocredit', 'krediya'].includes(portfolio) && ['fpd3', 'fpd7', 'fpd15'].includes(quotaKey)) {$1// First, exclude those with cuotas pagas > 0 for all portfolios in FPD
                            const paidCol = findConfigColumn(activeConfig?.columns?.paidQuotas || ['cuotas pagas', 'cuotas pagadas', 'pagadas', 'pagos'], headers);
                            if (paidCol && row[paidCol]) {
                                const pagadas = parseInt(String(row[paidCol]).replace(/\\D/g, '')) || 0;
                                if (pagadas > 0) return false;
                            }
                            let dueDate = null;`
);

content = content.replace(
    /\} else if \(\(portfolio === 'credismart' \|\| portfolio === 'alocredit'\) && \['fpd3', 'fpd7', 'fpd15'\]\.includes\(quotaId\)\) \{/g,
    `} else if (['credismart', 'alocredit', 'krediya'].includes(portfolio) && ['fpd3', 'fpd7', 'fpd15'].includes(quotaId)) {`
);

fs.writeFileSync('src/main.jsx', content);
