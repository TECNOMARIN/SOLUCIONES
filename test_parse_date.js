const testDates = [
    "2026-08-14",
    "14/08/2026",
    "08/14/2026",
    "2026-08-14T05:00:00.000Z"
];
const normalizeDate = (dStr) => {
    if (!dStr) return '';
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) return dStr.substring(0, 10);
    // DD/MM/YYYY or MM/DD/YYYY
    const parts = dStr.split(/[T\/\-]/);
    if (parts.length >= 3) {
        if (parts[2].length === 4) {
            // DD/MM/YYYY or MM/DD/YYYY
            // let's assume DD/MM/YYYY is most common in LatAm
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    return dStr;
};

testDates.forEach(d => console.log(d, "->", normalizeDate(d)));
